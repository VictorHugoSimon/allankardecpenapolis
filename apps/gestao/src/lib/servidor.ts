import 'server-only';
import { criarAdapters, type Adapters } from '@ceak/core/adapters';
import { instituicao } from '@ceak/core';
import { type Sessao } from '@ceak/core/auth';
import { escopo } from '@ceak/core/rbac';
import { contextoRls, ipDaRequisicao } from './auth';
import { log } from './log';

const g = globalThis as unknown as { __ceakGestaoAdapters?: Adapters };

export function adapters(): Adapters {
  g.__ceakGestaoAdapters ??= criarAdapters();
  return g.__ceakGestaoAdapters;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? instituicao.urls.site).replace(
  /\/$/,
  '',
);
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? instituicao.urls.app).replace(/\/$/, '');
export const GESTAO_URL = (process.env.NEXT_PUBLIC_GESTAO_URL ?? instituicao.urls.gestao).replace(
  /\/$/,
  '',
);

/** Segredo do QR Code de check-in (o mesmo do App: CHECKIN_SECRET ou AUTH_SECRET). */
export function checkinSecret(): string {
  const c = process.env.CHECKIN_SECRET;
  if (c && c.length >= 16) return c;
  const a = process.env.AUTH_SECRET;
  if (a && a.length >= 32) return a;
  if (process.env.NODE_ENV === 'production') throw new Error('CHECKIN_SECRET/AUTH_SECRET ausente.');
  return 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
}

/** Contexto completo para os serviços: RLS + perfil + autor. */
export async function contexto(s: Sessao) {
  return {
    ...contextoRls(s),
    perfil: s.perfil,
    usuarioId: s.usuarioId,
    ip: await ipDaRequisicao(),
  };
}

/** Instrutor vê só as próprias turmas e alunos. */
export function instrutorRestrito(s: Sessao): string | undefined {
  return s.perfil === 'INSTRUTOR' || escopo(s.perfil, 'pessoas') === 'proprios_alunos'
    ? s.pessoaId
    : undefined;
}

export function enviarEmail(para: string, assunto: string, texto: string) {
  return adapters().email.enviar(para, assunto, texto);
}

export { log };
