import { prisma } from './client';

/** Compatibilidade durante deploy coordenado de app e migração.
 * Não presume que a tabela já existe; falha fechada e nunca envia mensagens.
 */
export async function preferenciasComunicacaoDisponiveis(): Promise<boolean> {
  const [r] = await prisma.$queryRaw<Array<{ existe: boolean }>>`
    SELECT to_regclass('ceak_v2.preferencia_comunicacao') IS NOT NULL AS existe
  `;
  return r?.existe === true;
}
