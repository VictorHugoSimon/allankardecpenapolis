'use server';

import { redirect } from 'next/navigation';
import { telefoneBR } from '@ceak/core/validacao';
import { atualizarDadosPessoais, solicitarExclusaoDados } from '@ceak/db';
import { type EstadoForm } from '@/lib/formulario';
import { apagarCookieSessao, exigirSessao, getSessao, ipDaRequisicao, log } from '@/lib/servidor';

export async function sair(): Promise<void> {
  const s = await getSessao();
  await apagarCookieSessao();
  if (s) log.info('SEGURANCA', 'app: logout', { rota: '/perfil', status: 200 });
  redirect('/entrar');
}

export async function salvarDados(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSessao();
  const nome = String(form.get('nome') ?? '').trim();
  const bruto = String(form.get('whatsapp') ?? '').trim();
  const erros: Record<string, string> = {};
  if (nome.length < 3 || nome.length > 120) erros.nome = 'Informe seu nome completo.';
  const tel = bruto ? telefoneBR.safeParse(bruto) : null;
  if (tel && !tel.success) erros.whatsapp = tel.error.issues[0]!.message;
  if (Object.keys(erros).length) return { erros, valores: { nome, whatsapp: bruto } };
  await atualizarDadosPessoais(
    s.pessoaId,
    { nome, whatsapp: tel?.success ? tel.data : null },
    s.usuarioId,
    await ipDaRequisicao(),
  );
  return { ok: true };
}

export async function pedirExclusao(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSessao();
  if (form.get('confirmo') !== 'sim')
    return { erros: { confirmo: 'Marque a confirmação para continuar.' } };
  await solicitarExclusaoDados(s.pessoaId, s.usuarioId, await ipDaRequisicao());
  log.info('SEGURANCA', 'app: pedido de exclusão de dados (LGPD)', {
    rota: '/perfil/dados',
    status: 201,
  });
  return { ok: true };
}
