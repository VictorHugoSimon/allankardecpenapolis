import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { criarAdapters, type Adapters } from '@ceak/core/adapters';
import { assinarSessao, criarSupabaseAuthProvider, lerSessao, type AuthProvider, type Sessao } from '@ceak/core/auth';
import { criarLogger } from '@ceak/core/logger';
import { criarLocalAuthProvider, logSinkBanco } from '@ceak/db';
import { authSecret } from './env';
import { APP_SESSAO_S, COOKIE_APP } from './sessao-config';

const g = globalThis as unknown as { __ceakAppAdapters?: Adapters; __ceakAppAuth?: AuthProvider };

export function adapters(): Adapters {
  g.__ceakAppAdapters ??= criarAdapters();
  return g.__ceakAppAdapters;
}

export const log = criarLogger([
  (e) => {
    const linha = JSON.stringify(e);
    if (e.nivel === 'ERROR') console.error(linha);
    else if (e.nivel === 'WARN') console.warn(linha);
    else process.stdout.write(linha + '\n');
  },
  logSinkBanco,
]);

export function authProvider(): AuthProvider {
  if (g.__ceakAppAuth) return g.__ceakAppAuth;
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios.');
    g.__ceakAppAuth = criarSupabaseAuthProvider({ url, anonKey });
  } else {
    const a = adapters();
    g.__ceakAppAuth = criarLocalAuthProvider({
      enviar: (destino, canal, msg) => (canal === 'email' ? a.email.enviar(destino, 'Seu acesso ao CEAK', msg) : a.whatsapp.enviar(destino, msg)),
    });
  }
  return g.__ceakAppAuth;
}

export async function getSessao(): Promise<Sessao | null> {
  return lerSessao((await cookies()).get(COOKIE_APP)?.value, authSecret());
}

export async function exigirSessao(): Promise<Sessao> {
  const s = await getSessao();
  if (!s) redirect('/entrar');
  return s;
}

export async function gravarCookieSessao(s: Sessao): Promise<void> {
  (await cookies()).set(COOKIE_APP, await assinarSessao(s, authSecret(), APP_SESSAO_S), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: APP_SESSAO_S,
  });
}

export async function apagarCookieSessao(): Promise<void> {
  (await cookies()).delete(COOKIE_APP);
}

export async function ipDaRequisicao(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
}

const janelas = new Map<string, { inicio: number; n: number }>();

/** Limite de envios por IP e ação (em memória; com várias instâncias, trocar por Redis). */
export async function dentroDoLimite(acao: string, max = 8, janelaMs = 10 * 60_000): Promise<boolean> {
  const chave = `${acao}:${(await ipDaRequisicao()) ?? '?'}`;
  const agora = Date.now();
  const j = janelas.get(chave);
  if (!j || agora - j.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, n: 1 });
    return true;
  }
  j.n++;
  if (j.n > max) {
    log.warn('SEGURANCA', `limite de envios excedido · ${acao}`, { status: 429 });
    return false;
  }
  return true;
}

export function depsPagamento() {
  const a = adapters();
  return { pagamento: a.pagamento, email: a.email, whatsapp: a.whatsapp, log };
}
