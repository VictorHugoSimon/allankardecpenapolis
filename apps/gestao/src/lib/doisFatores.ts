import 'server-only';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { type Sessao } from '@ceak/core/auth';
import { isPerfil } from '@ceak/core/rbac';
import { authSecret } from './env';

/** Entre a senha e o autenticador: guarda a sessão pretendida por 10 minutos. */
const COOKIE_PENDENTE = 'ceak_2fa_pendente';
/** "Não pedir de novo neste navegador por 30 dias". */
const COOKIE_CONFIAVEL = 'ceak_2fa_confiavel';
const CONFIAVEL_S = 30 * 86_400;

const chave = () => new TextEncoder().encode(authSecret());
const opcoesCookie = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

export interface Pendente {
  sessao: Sessao;
  etapa: 'verificar' | 'configurar';
  next: string;
  iniciadoEm: number;
}

export async function gravarPendente(p: Omit<Pendente, 'iniciadoEm'>) {
  const t = await new SignJWT({ ...p, tipo: '2fa-pendente', iniciadoEm: Date.now() })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.sessao.usuarioId)
    .setExpirationTime('10m')
    .sign(chave());
  (await cookies()).set(COOKIE_PENDENTE, t, opcoesCookie(600));
}

export async function lerPendente(): Promise<Pendente | null> {
  const t = (await cookies()).get(COOKIE_PENDENTE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, chave(), { algorithms: ['HS256'] });
    const p = payload as unknown as Pendente & { tipo: string };
    if (
      p.tipo !== '2fa-pendente' ||
      !isPerfil(p.sessao?.perfil) ||
      !['verificar', 'configurar'].includes(p.etapa)
    )
      return null;
    return p;
  } catch {
    return null;
  }
}

export async function apagarPendente() {
  (await cookies()).delete(COOKIE_PENDENTE);
}

/** Lembra este navegador para o usuário; deixa de valer se o autenticador for redefinido. */
export async function lembrarNavegador(usuarioId: string, ativadoEm: Date) {
  const t = await new SignJWT({ tipo: '2fa-confiavel', ativ: ativadoEm.toISOString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuarioId)
    .setExpirationTime(`${CONFIAVEL_S}s`)
    .sign(chave());
  (await cookies()).set(COOKIE_CONFIAVEL, t, opcoesCookie(CONFIAVEL_S));
}

export async function navegadorConfiavel(
  usuarioId: string,
  ativadoEm: Date | null,
): Promise<boolean> {
  const t = (await cookies()).get(COOKIE_CONFIAVEL)?.value;
  if (!t || !ativadoEm) return false;
  try {
    const { payload } = await jwtVerify(t, chave(), { algorithms: ['HS256'] });
    return (
      payload.tipo === '2fa-confiavel' &&
      payload.sub === usuarioId &&
      payload.ativ === ativadoEm.toISOString()
    );
  } catch {
    return false;
  }
}
