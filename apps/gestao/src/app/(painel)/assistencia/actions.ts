'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { alterarSituacaoAssistencia, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

const esquema = z.object({
  id: z.string().uuid(),
  destino: z.enum(['AGENDADA', 'CONCLUIDA', 'CANCELADA']),
});

export async function atualizarSituacao(
  id: string, destino: 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA',
): Promise<{ ok: boolean; mensagem: string }> {
  const s = await exigirModulo('assistencia');
  const dados = esquema.safeParse({ id, destino });
  if (!dados.success) return { ok: false, mensagem: 'Dados inválidos.' };
  const ctx = await contexto(s);
  try {
    await alterarSituacaoAssistencia(ctx, dados.data.id, dados.data.destino, ctx.ip);
  } catch(e) {
    if(e instanceof ErroNegocio) return {ok:false,mensagem:e.message};
    throw e;
  }
  revalidatePath('/assistencia');
  return {ok:true,mensagem:'Situação atualizada com auditoria.'};
}
