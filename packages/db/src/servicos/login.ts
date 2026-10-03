import { type AuthProvider, type Sessao } from '@ceak/core/auth';
import { prisma } from '../client';
import { sessaoParaIdentidade } from '../sessao';

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60_000;

export type ResultadoLogin =
  { ok: true; sessao: Sessao } | { ok: false; motivo: 'bloqueado' | 'invalido' };

/**
 * Login por e-mail e senha com bloqueio de 15 minutos após 5 tentativas falhas.
 * Nunca revela se o e-mail existe (mesma resposta para conta inexistente e senha errada).
 */
export async function autenticarComSenha(
  provider: AuthProvider,
  email: string,
  senha: string,
): Promise<ResultadoLogin> {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, tentativasFalhas: true, bloqueadoAte: true },
  });
  if (usuario?.bloqueadoAte && usuario.bloqueadoAte > new Date())
    return { ok: false, motivo: 'bloqueado' };
  const identidade = await provider.entrarComSenha(email, senha);
  const sessao = identidade ? await sessaoParaIdentidade(identidade) : null;
  if (sessao) return { ok: true, sessao };
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
  return { ok: false, motivo: 'invalido' };
}

/** Só envia código para WhatsApp de uma conta ativa (sem revelar se existe). */
export async function whatsappTemConta(telefone: string): Promise<boolean> {
  const n = await prisma.usuario.count({ where: { ativo: true, pessoa: { whatsapp: telefone } } });
  return n > 0;
}
