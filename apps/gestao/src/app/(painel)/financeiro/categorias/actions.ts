'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cadastrarCategoriaFinanceira, ErroNegocio } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { contexto } from '@/lib/servidor';

const esquema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe pelo menos 2 caracteres.')
    .max(80, 'Máximo de 80 caracteres.'),
  tipo: z.enum(['RECEBER', 'PAGAR']),
});

export interface EstadoCategoria {
  erro?: string;
  sucesso?: string;
}

export async function salvarCategoria(
  _: EstadoCategoria,
  form: FormData,
): Promise<EstadoCategoria> {
  const sessao = await exigirModulo('financeiro');
  const validacao = esquema.safeParse({
    nome: form.get('nome'),
    tipo: form.get('tipo'),
  });
  if (!validacao.success) {
    return { erro: validacao.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const ctx = await contexto(sessao);
  try {
    await cadastrarCategoriaFinanceira(ctx, validacao.data, ctx.ip);
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  revalidatePath('/financeiro');
  revalidatePath('/financeiro/categorias');
  revalidatePath('/financeiro/novo');
  return { sucesso: 'Categoria cadastrada e registrada na auditoria.' };
}
