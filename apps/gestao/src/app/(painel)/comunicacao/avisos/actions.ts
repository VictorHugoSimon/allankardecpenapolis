'use server';

import { revalidatePath } from 'next/cache';
import { comRls, prisma, registrarAuditoria } from '@ceak/db';
import { InscricaoPushExpirada } from '@ceak/core/adapters';
import { adapters, log } from '@/lib/servidor';
import { contextoRls, exigirModulo } from '@/lib/auth';

function validarTexto(form: FormData, chave: string, minimo: number, maximo: number) {
  const valor = String(form.get(chave) ?? '').trim();
  if (valor.length < minimo || valor.length > maximo) {
    throw new Error(`O campo ${chave} deve conter de ${minimo} a ${maximo} caracteres.`);
  }
  return valor;
}

const segmentos = ['TODOS', 'MEMBROS', 'VOLUNTARIOS', 'INSTRUTORES'] as const;
type Segmento = (typeof segmentos)[number];

function validarLink(form: FormData): string | null {
  const valor = String(form.get('url') ?? '').trim();
  if (!valor) return null;
  if (valor.length > 1500) throw new Error('O link é muito longo.');
  if (valor.startsWith('/') && !valor.startsWith('//') && !valor.startsWith('/\\')) {
    return valor;
  }
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
    return url.toString();
  } catch {
    throw new Error('Use um link HTTPS ou um caminho interno do CEAK (começando com /).');
  }
}

export async function criarAvisoInterno(form: FormData): Promise<void> {
  const sessao = await exigirModulo('comunicacao');
  if (sessao.perfil !== 'ADMINISTRADOR')
    throw new Error('Apenas administradores podem criar avisos gerais.');
  const titulo = validarTexto(form, 'titulo', 4, 160);
  const mensagem = validarTexto(form, 'mensagem', 10, 2000);
  const segmento = String(form.get('segmento') ?? 'TODOS');
  if (!segmentos.includes(segmento as Segmento)) throw new Error('Público inválido.');
  const url = validarLink(form);
  await comRls(contextoRls(sessao), async (tx) => {
    const comunicado = await tx.comunicacao.create({
      data: {
        canal: 'APP',
        titulo,
        mensagem,
        publico: ({ TODOS: 'Todos os membros elegíveis', MEMBROS: 'Membros', VOLUNTARIOS: 'Voluntários', INSTRUTORES: 'Instrutores' } as Record<Segmento, string>)[segmento as Segmento],
        filtro: { segmento, url },
        status: 'RASCUNHO',
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'comunicacao.app.rascunho',
      entidade: 'Comunicacao',
      entidadeId: comunicado.id,
      antes: null,
      depois: { titulo, canal: 'APP', segmento, link: Boolean(url), status: 'RASCUNHO' },
      ip: null,
    });
  });
  revalidatePath('/comunicacao/avisos');
}

/**
 * Cria notificações na caixa interna do PWA e, quando configurado,
 * envia Web Push aos dispositivos inscritos dos destinatários elegíveis.
 * Nunca envia WhatsApp ou e-mail, nem alcança contas sem consentimento.
 */
export async function publicarAvisoInterno(form: FormData): Promise<void> {
  const sessao = await exigirModulo('comunicacao');
  if (sessao.perfil !== 'ADMINISTRADOR')
    throw new Error('Apenas administradores podem publicar avisos gerais.');
  const id = String(form.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Aviso inválido.');
  const resultado = await comRls(contextoRls(sessao), async (tx) => {
    const aviso = await tx.comunicacao.findUnique({
      where: { id },
      select: { id: true, canal: true, titulo: true, mensagem: true, status: true, filtro: true },
    });
    if (!aviso || aviso.canal !== 'APP' || aviso.status !== 'RASCUNHO') {
      throw new Error('O aviso não está em rascunho ou já foi publicado.');
    }
    const filtro = aviso.filtro && typeof aviso.filtro === 'object' && !Array.isArray(aviso.filtro)
      ? aviso.filtro as Record<string, unknown> : {};
    const segmento = String(filtro.segmento ?? 'TODOS');
    if (!segmentos.includes(segmento as Segmento)) throw new Error('Segmentação inválida.');
    const url = typeof filtro.url === 'string' ? filtro.url : null;
    if (url) {
      const check = new FormData();
      check.set('url', url);
      validarLink(check);
    }
    const perfis = segmento === 'MEMBROS' ? ['MEMBRO'] :
      segmento === 'VOLUNTARIOS' ? ['VOLUNTARIO'] :
      segmento === 'INSTRUTORES' ? ['INSTRUTOR'] :
      ['MEMBRO', 'VISITANTE', 'VOLUNTARIO', 'INSTRUTOR'];
    const pessoas = await tx.pessoa.findMany({
      where: {
        usuario: { is: { ativo: true } },
        consentimentoEm: { not: null },
        exclusaoSolicitadaEm: null,
        anonimizadaEm: null,
        perfil: { in: perfis as ('MEMBRO' | 'VISITANTE' | 'VOLUNTARIO' | 'INSTRUTOR')[] },
      },
      select: { id: true },
      take: 5001,
    });
    if (!pessoas.length)
      throw new Error('Ainda não há membros cadastrados com consentimento para receber avisos.');
    if (pessoas.length > 5000)
      throw new Error('Envio acima do limite de segurança. Use segmentação de público.');
    const atualizado = await tx.comunicacao.updateMany({
      where: { id, canal: 'APP', status: 'RASCUNHO' },
      data: { status: 'ENVIADO', enviadoEm: new Date(), enviados: pessoas.length },
    });
    if (atualizado.count !== 1) throw new Error('Aviso já processado por outra sessão.');
    await tx.notificacao.createMany({
      data: pessoas.map((p) => ({
        pessoaId: p.id,
        categoria: 'Comunicado',
        titulo: aviso.titulo,
        corpo: aviso.mensagem,
        url,
      })),
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'comunicacao.app.publicada',
      entidade: 'Comunicacao',
      entidadeId: aviso.id,
      antes: { status: 'RASCUNHO' },
      depois: { status: 'ENVIADO', destinatarios: pessoas.length, canal: 'APP' },
      ip: null,
    });
    return { id: aviso.id, titulo: aviso.titulo, mensagem: aviso.mensagem, url, pessoaIds: pessoas.map(p => p.id) };
  });

  // A caixa interna é a fonte de verdade. Web Push é um canal adicional,
  // somente para quem autorizou o dispositivo no navegador.
  // Evitar envio simulado, vazamento de endpoint e tempestade em uma função serverless.
  const provedor = process.env.PUSH_PROVIDER === 'webpush' &&
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ? adapters().push : null;
  let enviadosPush = 0;
  let falhasPush = 0;
  let avisoPush = 'Web Push não configurado; avisos disponíveis dentro do aplicativo.';
  if (provedor && provedor.nome === 'webpush') {
    const destinos = await prisma.dispositivoPush.findMany({
      where: { pessoaId: { in: resultado.pessoaIds } },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
      take: 101,
    });
    if (destinos.length > 100) {
      avisoPush = 'Mais de 100 aparelhos: envio externo não iniciado. É necessário processamento em lotes.';
    } else {
      const urlPush = resultado.url?.startsWith('/') && !resultado.url.startsWith('//')
        ? resultado.url : '/notificacoes';
      // Lotes de até 10 aparelhos para limitar pressão no serviço e latência.
      for (let i = 0; i < destinos.length; i += 10) {
        await Promise.all(destinos.slice(i, i + 10).map(async d => {
          try {
            await provedor.enviar(JSON.stringify({
              endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth },
            }), resultado.titulo, resultado.mensagem, urlPush);
            enviadosPush++;
          } catch (erro) {
            falhasPush++;
            if (erro instanceof InscricaoPushExpirada) {
              await prisma.dispositivoPush.deleteMany({ where: { id: d.id, endpoint: d.endpoint } });
            }
          }
        }));
      }
      avisoPush = `Web Push: ${enviadosPush} envios aceitos, ${falhasPush} falhas.`;
    }
  }
  await comRls(contextoRls(sessao), async tx => {
    const atual = await tx.comunicacao.findUnique({
      where: { id: resultado.id }, select: { filtro: true },
    });
    const filtro = atual?.filtro && typeof atual.filtro === 'object' && !Array.isArray(atual.filtro)
      ? atual.filtro as Record<string, unknown> : {};
    await tx.comunicacao.update({
      where: { id: resultado.id },
      data: { filtro: { ...filtro, resumoPush: avisoPush, enviadosPush, falhasPush } },
    });
  });
  log.info('NOTIFICACOES', 'publicação de comunicado interno e tentativas de Web Push', {
    rota: '/comunicacao/avisos', status: 200,
    contexto: { comunicadoId: resultado.id, enviadosPush, falhasPush },
  });
  revalidatePath('/comunicacao/avisos');
}
