'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { confirmarConciliacao, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

const esquema = z.object({
  extratoId: z.string().uuid(),
  lancamentoId: z.string().uuid(),
});

export async function confirmarVinculo(
  extratoId: string,
  lancamentoId: string,
): Promise<{ ok: boolean; mensagem: string }> {
  const sessao = await exigirModulo('financeiro');
  const dados = esquema.safeParse({ extratoId, lancamentoId });
  if (!dados.success) return { ok: false, mensagem: 'Identificadores inválidos.' };
  const ctx = await contexto(sessao);
  try {
    await confirmarConciliacao(ctx, dados.data.extratoId, dados.data.lancamentoId, ctx.ip);
  } catch (e) {
    if (e instanceof ErroNegocio) return { ok: false, mensagem: e.message };
    throw e;
  }
  revalidatePath('/financeiro/conciliacao');
  return { ok: true, mensagem: 'Conciliação confirmada e registrada na auditoria.' };
}
