'use server';

import { revalidatePath } from 'next/cache';
import { decidirAprovacao, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { log } from '@/lib/log';
import { contexto } from '@/lib/servidor';

export interface ResultadoDecisao {
  ok?: boolean;
  mensagem: string;
}

export async function decidir(
  id: string,
  decisao: 'APROVADO' | 'REJEITADO',
): Promise<ResultadoDecisao> {
  const s = await exigirModulo('aprovacoes');
  const ctx = await contexto(s);
  try {
    await decidirAprovacao(ctx, id, decisao, { ip: ctx.ip }, { log });
  } catch (e) {
    if (e instanceof ErroNegocio) return { mensagem: e.message };
    throw e;
  }
  revalidatePath('/', 'layout');
  return {
    ok: true,
    mensagem:
      decisao === 'APROVADO'
        ? 'Aprovado · registrado na auditoria'
        : 'Rejeitado · autor notificado',
  };
}
