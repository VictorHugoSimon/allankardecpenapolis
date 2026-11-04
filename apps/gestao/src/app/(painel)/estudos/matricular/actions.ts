'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ErroNegocio, matricularPessoaManual } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

export interface EstadoMatricula { erro?: string; sucesso?: string }
const esquema = z.object({ turmaId: z.string().uuid(), pessoaId: z.string().uuid() });

export async function salvarMatricula(_: EstadoMatricula, form: FormData): Promise<EstadoMatricula> {
  const sessao = await exigirModulo('estudos');
  if (!['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'].includes(sessao.perfil))
    return { erro: 'Você não tem permissão para realizar matrículas.' };
  const r = esquema.safeParse({ turmaId: form.get('turmaId'), pessoaId: form.get('pessoaId') });
  if (!r.success) return { erro: 'Selecione uma turma e uma pessoa cadastrada.' };
  const ctx = await contexto(sessao);
  try {
    await matricularPessoaManual(ctx, r.data, ctx.ip);
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  revalidatePath('/estudos');
  return { sucesso: 'Matrícula criada com auditoria. A turma foi atualizada.' };
}
