'use server';

import { revalidatePath } from 'next/cache';
import { podeAprovarConteudo } from '@ceak/core/rbac';
import {
  agendarConteudo,
  aprovarOuRejeitarConteudo,
  CANAIS_EDITOR,
  enviarParaRevisao,
  ErroNegocio,
  publicarConteudo,
  salvarConteudo,
} from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { log } from '@/lib/log';
import { adapters, contexto, SITE_URL } from '@/lib/servidor';

export interface ResultadoEditor {
  ok?: boolean;
  mensagem: string;
}

async function executar(fn: () => Promise<string>, id: string): Promise<ResultadoEditor> {
  try {
    const mensagem = await fn();
    revalidatePath(`/conteudo/${id}`);
    revalidatePath('/', 'layout');
    return { ok: true, mensagem };
  } catch (e) {
    if (e instanceof ErroNegocio) return { mensagem: e.message };
    throw e;
  }
}

export async function salvar(id: string, form: FormData): Promise<ResultadoEditor> {
  const s = await exigirModulo('conteudo');
  const ctx = await contexto(s);
  const titulo = String(form.get('titulo') ?? '').trim();
  if (titulo.length < 3) return { mensagem: 'Informe o título.' };
  const versoes = Object.fromEntries(
    CANAIS_EDITOR.filter((c) => form.has(`texto_${c}`)).map((c) => [
      c,
      String(form.get(`texto_${c}`)).slice(0, 20_000),
    ]),
  );
  return executar(async () => {
    const r = await salvarConteudo(
      id,
      {
        titulo: titulo.slice(0, 200),
        versoes,
        resumo: String(form.get('resumo') ?? '').trim() || undefined,
        seoTitulo: String(form.get('seoTitulo') ?? '').trim() || undefined,
        seoDescricao: String(form.get('seoDescricao') ?? '').trim() || undefined,
        tags: String(form.get('tags') ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12),
      },
      ctx,
    );
    return r.voltouParaRevisao
      ? 'Alterações salvas · conteúdo voltou para revisão'
      : 'Alterações salvas';
  }, id);
}

export async function paraRevisao(id: string): Promise<ResultadoEditor> {
  const s = await exigirModulo('conteudo');
  const ctx = await contexto(s);
  return executar(async () => {
    await enviarParaRevisao(id, ctx);
    return 'Enviado para revisão humana';
  }, id);
}

export async function decidir(
  id: string,
  decisao: 'APROVADO' | 'REJEITADO',
): Promise<ResultadoEditor> {
  const s = await exigirModulo('conteudo');
  if (!podeAprovarConteudo(s.perfil)) return { mensagem: 'Seu perfil não aprova conteúdos.' };
  const ctx = await contexto(s);
  return executar(async () => {
    await aprovarOuRejeitarConteudo(id, decisao, ctx, { log });
    return decisao === 'APROVADO'
      ? 'Conteúdo aprovado · registrado na auditoria'
      : 'Conteúdo devolvido ao autor';
  }, id);
}

export async function agendar(id: string, form: FormData): Promise<ResultadoEditor> {
  const s = await exigirModulo('conteudo');
  if (!podeAprovarConteudo(s.perfil)) return { mensagem: 'Seu perfil não agenda publicações.' };
  const ctx = await contexto(s);
  const v = String(form.get('quando') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return { mensagem: 'Escolha data e horário.' };
  const quando = new Date(`${v}:00-03:00`);
  return executar(async () => {
    await agendarConteudo(id, quando, ctx);
    return 'Publicação agendada';
  }, id);
}

export async function publicar(id: string): Promise<ResultadoEditor> {
  const s = await exigirModulo('conteudo');
  if (!podeAprovarConteudo(s.perfil)) return { mensagem: 'Seu perfil não publica conteúdos.' };
  const ctx = await contexto(s);
  const a = adapters();
  return executar(async () => {
    const r = await publicarConteudo(id, ctx, {
      social: {
        FACEBOOK: a.social.facebook,
        INSTAGRAM: a.social.instagram,
        GOOGLE_BUSINESS: a.social.google,
      },
      log,
      siteUrl: SITE_URL,
    });
    return `Publicado em ${r.publicados.join(', ')}${r.naFila.length ? ` · ${r.naFila.join(', ')} na fila` : ''}`;
  }, id);
}
