import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { criarAdapters } from '@ceak/core/adapters';
import {
  assinarSessao,
  COOKIE_SESSAO,
  criarSupabaseAuthProvider,
  lerSessao,
  SESSAO_INATIVIDADE_S,
  type AuthProvider,
  type Sessao,
} from '@ceak/core/auth';
import { podeAcessar, temAcessoGestao, type Modulo } from '@ceak/core/rbac';
import { criarLocalAuthProvider, type ContextoRls } from '@ceak/db';
import { authSecret } from './env';

export async function getSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  return lerSessao(jar.get(COOKIE_SESSAO)?.value, authSecret());
}

/** Exige sessão com acesso ao Gestão. */
export async function exigirSessao(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect('/login');
  if (!temAcessoGestao(s.perfil)) redirect('/sem-acesso');
  return s;
}

/** Verificação no servidor (além do middleware): o perfil precisa ter acesso ao módulo. */
export async function exigirModulo(modulo: Modulo): Promise<Sessao> {
  const s = await exigirSessao();
  if (!podeAcessar(s.perfil, modulo)) redirect(`/sem-acesso?modulo=${modulo}`);
  return s;
}

export function contextoRls(s: Sessao): ContextoRls {
  return {
    usuarioId: s.usuarioId,
    pessoaId: s.pessoaId,
    perfil: s.perfil,
    coordAssistencia: s.coordAssistencia,
  };
}

export async function gravarCookieSessao(s: Sessao): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, await assinarSessao(s, authSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSAO_INATIVIDADE_S,
  });
}

export async function apagarCookieSessao(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
}

export async function ipDaRequisicao(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
}

let provider: AuthProvider | undefined;

/** Provedor de identidade conforme AUTH_PROVIDER (local | supabase). */
export function authProvider(): AuthProvider {
  if (provider) return provider;
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios.');
    provider = criarSupabaseAuthProvider({ url, anonKey });
  } else {
    const adapters = criarAdapters();
    provider = criarLocalAuthProvider({
      enviar: (destino, canal, msg) =>
        canal === 'email'
          ? adapters.email.enviar(destino, 'Seu acesso ao CEAK', msg)
          : adapters.whatsapp.enviar(destino, msg),
    });
  }
  return provider;
}
