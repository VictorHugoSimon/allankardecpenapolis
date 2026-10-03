'use server';

import { redirect } from 'next/navigation';
import { temAcessoGestao } from '@ceak/core/rbac';
import { loginSchema, recuperarSenhaSchema } from '@ceak/core/validacao';
import { autenticarComSenha } from '@ceak/db';
import { authProvider, gravarCookieSessao, ipDaRequisicao } from '@/lib/auth';
import { log } from '@/lib/log';

export interface EstadoLogin {
  erro?: string;
  campos?: { email?: string };
  recuperacaoEnviada?: boolean;
}

/** Só aceita caminhos internos (evita open redirect). */
function destinoSeguro(next: FormDataEntryValue | null): string {
  const v = typeof next === 'string' ? next : '';
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/';
}

export async function entrar(_prev: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const t0 = Date.now();
  const parsed = loginSchema.safeParse({ email: form.get('email'), senha: form.get('senha') });
  if (!parsed.success) {
    return {
      erro: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      campos: { email: String(form.get('email') ?? '') },
    };
  }
  const { email, senha } = parsed.data;
  const ip = await ipDaRequisicao();
  const r = await autenticarComSenha(authProvider(), email, senha);

  if (!r.ok) {
    log.warn('SEGURANCA', r.motivo === 'bloqueado' ? `login bloqueado · ${email}` : `tentativa de login falha · ${email}`, {
      rota: '/login',
      status: r.motivo === 'bloqueado' ? 429 : 401,
      usuario: ip ?? undefined,
      latenciaMs: Date.now() - t0,
    });
    return {
      erro: r.motivo === 'bloqueado' ? 'Muitas tentativas. Tente novamente em 15 minutos.' : 'E-mail ou senha incorretos.',
      campos: { email },
    };
  }

  await gravarCookieSessao(r.sessao);
  log.info('SEGURANCA', `login · ${r.sessao.email} (${r.sessao.perfil})`, {
    rota: '/login',
    status: 200,
    usuario: r.sessao.nome,
    latenciaMs: Date.now() - t0,
  });
  redirect(temAcessoGestao(r.sessao.perfil) ? destinoSeguro(form.get('next')) : '/sem-acesso');
}

export async function recuperarSenha(_prev: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const parsed = recuperarSenhaSchema.safeParse({ email: form.get('email') });
  if (parsed.success) {
    // Mesmo retorno exista ou não a conta (não revela e-mails cadastrados).
    await authProvider()
      .enviarRecuperacaoSenha(parsed.data.email)
      .catch(() => undefined);
    log.info('SEGURANCA', 'recuperação de senha solicitada', { rota: '/login' });
  }
  return { recuperacaoEnviada: true };
}
