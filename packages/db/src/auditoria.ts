import { diffCampos, type RegistroAuditoria } from '@ceak/core/auditoria';
import { type Prisma } from './generated/prisma/client';
import { type Tx } from './rls';

const json = (v: Record<string, unknown> | null) =>
  v === null ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue);

/**
 * Grava a trilha de auditoria na MESMA transação da alteração:
 * se a alteração falhar, a auditoria não fica órfã (e vice-versa).
 * Usa `createMany` (INSERT sem RETURNING): quem grava não precisa poder ler a auditoria.
 */
export async function registrarAuditoria(tx: Tx, r: RegistroAuditoria): Promise<void> {
  const { antes, depois } = diffCampos(r.antes, r.depois);
  await tx.auditoria.createMany({
    data: {
      usuarioId: r.usuarioId,
      acao: r.acao,
      entidade: r.entidade,
      entidadeId: r.entidadeId,
      antes: json(antes),
      depois: json(depois),
      ip: r.ip,
    },
  });
}
