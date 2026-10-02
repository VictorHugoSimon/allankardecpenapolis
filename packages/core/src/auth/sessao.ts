import { jwtVerify, SignJWT } from 'jose';
import { isPerfil, type Perfil } from '../rbac/perfis';

/** Dados mínimos da sessão, guardados num cookie httpOnly assinado (HS256). */
export interface Sessao {
  usuarioId: string;
  pessoaId: string;
  nome: string;
  email: string;
  perfil: Perfil;
  /** Membro da coordenação de assistência (acesso a dados sensíveis). */
  coordAssistencia: boolean;
}

export const COOKIE_SESSAO = 'ceak_sessao';
/** Sessão expira por inatividade em 30 minutos (Configurações › Segurança). */
export const SESSAO_INATIVIDADE_S = 30 * 60;

const ISSUER = 'ceak-digital';

function chave(secret: string): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET precisa ter pelo menos 32 caracteres.');
  }
  return new TextEncoder().encode(secret);
}

export async function assinarSessao(
  s: Sessao,
  secret: string,
  ttlSegundos = SESSAO_INATIVIDADE_S,
): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setSubject(s.usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${ttlSegundos}s`)
    .sign(chave(secret));
}

/** Retorna a sessão ou `null` se o token for inválido ou expirado. */
export async function lerSessao(token: string | undefined, secret: string): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(secret), {
      issuer: ISSUER,
      algorithms: ['HS256'],
    });
    const p = payload as Record<string, unknown>;
    if (
      typeof p.usuarioId !== 'string' ||
      typeof p.pessoaId !== 'string' ||
      typeof p.nome !== 'string' ||
      typeof p.email !== 'string' ||
      !isPerfil(p.perfil)
    ) {
      return null;
    }
    return {
      usuarioId: p.usuarioId,
      pessoaId: p.pessoaId,
      nome: p.nome,
      email: p.email,
      perfil: p.perfil,
      coordAssistencia: p.coordAssistencia === true,
    };
  } catch {
    return null;
  }
}

/** Renova o token quando passou da metade do tempo de inatividade. */
export async function precisaRenovar(token: string, secret: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, chave(secret), { issuer: ISSUER });
    const restante = (payload.exp ?? 0) - Math.floor(Date.now() / 1000);
    return restante < SESSAO_INATIVIDADE_S / 2;
  } catch {
    return false;
  }
}
