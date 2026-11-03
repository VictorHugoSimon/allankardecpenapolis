'use server';

import { redirect } from 'next/navigation';
import { senhaForte } from '@ceak/core/validacao';
import { ativarContaVinculada, ErroNegocio, sessaoParaIdentidade } from '@ceak/db';
import { gravarCookieSessao, ipDaRequisicao } from '@/lib/servidor';

export interface EstadoAtivacao {
  erro?: string;
}

export async function concluirAtivacao(_: EstadoAtivacao, form: FormData): Promise<EstadoAtivacao> {
  if (process.env.CEAK_ENABLE_ACCOUNT_LINKING !== 'sim') {
    return { erro: 'Ativação de cadastros anteriores ainda indisponível.' };
  }
  const pessoaId = String(form.get('pessoaId') ?? '');
  const token = String(form.get('token') ?? '');
  const senha = String(form.get('senha') ?? '');
  if (form.get('consentimento') !== 'sim') {
    return { erro: 'Para continuar, aceite o termo de privacidade.' };
  }
  if (senha !== String(form.get('confirmar') ?? '')) {
    return { erro: 'As senhas não coincidem.' };
  }
  const validacao = senhaForte.safeParse(senha);
  if (!validacao.success) return { erro: validacao.error.issues[0]?.message ?? 'Senha inválida.' };
  try {
    const usuario = await ativarContaVinculada(
      pessoaId,
      token,
      validacao.data,
      await ipDaRequisicao(),
    );
    const sessao = await sessaoParaIdentidade({ email: usuario.email });
    if (!sessao) return { erro: 'Conta criada, mas não foi possível entrar. Faça login.' };
    await gravarCookieSessao(sessao);
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    return { erro: 'Não foi possível ativar a conta. Confirme se o link ainda está válido.' };
  }
  redirect('/');
}
