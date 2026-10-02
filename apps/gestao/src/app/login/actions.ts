'use server';

import { redirect } from 'next/navigation';
import { temAcessoGestao } from '@ceak/core/rbac';
import { loginSchema, recuperarSenhaSchema } from '@ceak/core/validacao';
import { prisma, sessaoParaIdentidade } from '@ceak/db';
import { authProvider, gravarCookieSessao, ipDaRequisicao } from '@/lib/auth';
import { log } from '@/lib/log';

export interface EstadoLogin {
  erro?: string;
  campos?: { email?: string };
  recuperacaoEnviada?: boolean;
}

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60_000;

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
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (usuario?.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
    log.warn('SEGURANCA', `login bloqueado · ${email}`, {
      rota: '/login',
      status: 429,
      usuario: ip ?? undefined,
    });
    return { erro: 'Muitas tentativas. Tente novamente em 15 minutos.', campos: { email } };
  }

  const identidade = await authProvider().entrarComSenha(email, senha);
  const sessao = identidade ? await sessaoParaIdentidade(identidade) : null;

  if (!sessao) {
    if (usuario) {
      const tentativas = usuario.tentativasFalhas + 1;
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativasFalhas: tentativas,
          bloqueadoAte: tentativas >= MAX_TENTATIVAS ? new Date(Date.now() + BLOQUEIO_MS) : null,
        },
      });
    }
    log.warn('SEGURANCA', `tentativa de login falha · ${email}`, {
      rota: '/login',
      status: 401,
      usuario: ip ?? undefined,
      latenciaMs: Date.now() - t0,
    });
    return { erro: 'E-mail ou senha incorretos.', campos: { email } };
  }

  await gravarCookieSessao(sessao);
  log.info('SEGURANCA', `login · ${sessao.email} (${sessao.perfil})`, {
    rota: '/login',
    status: 200,
    usuario: sessao.nome,
    latenciaMs: Date.now() - t0,
  });
  redirect(temAcessoGestao(sessao.perfil) ? destinoSeguro(form.get('next')) : '/sem-acesso');
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
