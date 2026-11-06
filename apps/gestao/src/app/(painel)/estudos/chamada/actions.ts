'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { criarAulaManual, registrarChamadaManual, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

export interface EstadoChamada {
  erro?: string;
  sucesso?: string;
}
const novaAula = z.object({
  turmaId: z.string().uuid(),
  numero: z.coerce.number().int().min(1).max(1000),
  titulo: z.string().trim().min(3).max(140),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const registro = z.object({
  aulaId: z.string().uuid(),
  alunos: z.array(z.object({ pessoaId: z.string().uuid(), presente: z.boolean() })).max(500),
});

export async function salvarAula(_: EstadoChamada, form: FormData): Promise<EstadoChamada> {
  const s = await exigirModulo('estudos');
  const r = novaAula.safeParse(Object.fromEntries(form));
  if (!r.success) return { erro: 'Informe turma, número, título e data válidos.' };
  const ctx = await contexto(s);
  try {
    await criarAulaManual(ctx, r.data, ctx.ip);
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  revalidatePath('/estudos');
  revalidatePath('/estudos/chamada');
  return { sucesso: 'Aula cadastrada. Atualize a página para registrar a chamada.' };
}

export async function salvarChamada(
  aulaId: string,
  alunos: { pessoaId: string; presente: boolean }[],
): Promise<{ ok: boolean; mensagem: string }> {
  const s = await exigirModulo('estudos');
  const r = registro.safeParse({ aulaId, alunos });
  if (!r.success) return { ok: false, mensagem: 'Dados da chamada inválidos.' };
  const ctx = await contexto(s);
  try {
    const resultado = await registrarChamadaManual(ctx, r.data.aulaId, r.data.alunos, ctx.ip);
    revalidatePath('/estudos');
    revalidatePath('/estudos/chamada');
    return {
      ok: true,
      mensagem: `Chamada registrada: ${resultado.presentes} presentes de ${resultado.total} alunos.`,
    };
  } catch (e) {
    if (e instanceof ErroNegocio) return { ok: false, mensagem: e.message };
    throw e;
  }
}
