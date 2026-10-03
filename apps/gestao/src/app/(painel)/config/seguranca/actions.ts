'use server';

import { revalidatePath } from 'next/cache';
import { ErroNegocio, salvarRetencaoLogs } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

export async function salvarRetencao(
  _: { ok?: boolean; erro?: string },
  form: FormData,
): Promise<{ ok?: boolean; erro?: string }> {
  const s = await exigirModulo('config');
  const ctx = await contexto(s);
  try {
    await salvarRetencaoLogs(ctx, Number(form.get('meses')), ctx);
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  revalidatePath('/config/seguranca');
  return { ok: true };
}
