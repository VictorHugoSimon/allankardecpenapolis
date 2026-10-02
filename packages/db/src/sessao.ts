import { type IdentidadeConfirmada, type Sessao } from '@ceak/core/auth';
import { prisma } from './client';

/**
 * Converte uma identidade confirmada pelo provedor em sessão do CEAK.
 * Retorna `null` se não houver usuário ativo correspondente.
 */
export async function sessaoParaIdentidade(id: IdentidadeConfirmada): Promise<Sessao | null> {
  const usuario = await prisma.usuario.findFirst({
    where: {
      ativo: true,
      OR: [
        ...(id.authId ? [{ authId: id.authId }] : []),
        ...(id.email ? [{ email: id.email.toLowerCase() }] : []),
        ...(id.telefone ? [{ pessoa: { whatsapp: id.telefone } }] : []),
      ],
    },
    include: { pessoa: true },
  });
  if (!usuario) return null;
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcessoEm: new Date(), tentativasFalhas: 0 },
  });
  return {
    usuarioId: usuario.id,
    pessoaId: usuario.pessoaId,
    nome: usuario.pessoa.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    coordAssistencia: usuario.coordAssistencia,
  };
}
