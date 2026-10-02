import { type Perfil } from '@ceak/core/rbac';
import { prisma } from './client';
import { type Prisma } from './generated/prisma/client';

export type Tx = Prisma.TransactionClient;

export interface ContextoRls {
  usuarioId: string | null;
  pessoaId: string | null;
  perfil: Perfil | 'ANONIMO';
  coordAssistencia: boolean;
}

export const CONTEXTO_ANONIMO: ContextoRls = {
  usuarioId: null,
  pessoaId: null,
  perfil: 'ANONIMO',
  coordAssistencia: false,
};

/**
 * Executa `fn` numa transação com o papel `ceak_app` (sem BYPASSRLS) e com o
 * contexto do usuário em `app.*`, para que as policies de RLS se apliquem.
 * Use para toda leitura/escrita de dados sensíveis.
 */
export async function comRls<T>(ctx: ContextoRls, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT
      set_config('app.usuario_id', ${ctx.usuarioId ?? ''}, true),
      set_config('app.pessoa_id', ${ctx.pessoaId ?? ''}, true),
      set_config('app.perfil', ${ctx.perfil}, true),
      set_config('app.coord_assistencia', ${ctx.coordAssistencia ? 'on' : 'off'}, true)`;
    await tx.$executeRawUnsafe('SET LOCAL ROLE ceak_app');
    return fn(tx);
  });
}
