'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centavos } from '@ceak/core/validacao';
import { criarLancamento, ErroNegocio, mudarStatusLancamento } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { log } from '@/lib/log';
import { contexto } from '@/lib/servidor';

const ROTULO: Record<string, string> = {
  APROVADO: 'Lançamento aprovado · registrado na auditoria',
  PAGO: 'Pagamento registrado · registrado na auditoria',
  CANCELADO: 'Lançamento cancelado · registrado na auditoria',
};

export async function mudarStatus(
  id: string,
  novo: 'APROVADO' | 'PAGO' | 'CANCELADO',
): Promise<{ ok?: boolean; mensagem: string }> {
  const s = await exigirModulo('financeiro');
  const ctx = await contexto(s);
  try {
    await mudarStatusLancamento(ctx, id, novo, ctx, { log });
  } catch (e) {
    if (e instanceof ErroNegocio) return { mensagem: e.message };
    throw e;
  }
  revalidatePath('/', 'layout');
  return { ok: true, mensagem: ROTULO[novo]! };
}

const esquema = z.object({
  tipo: z.enum(['PAGAR', 'RECEBER']),
  contraparte: z.string().trim().min(2, 'Informe o fornecedor ou a origem.').max(120),
  descricao: z.string().trim().min(3, 'Informe a descrição.').max(200),
  categoriaId: z.string().uuid('Escolha a categoria.'),
  centroCustoId: z.union([z.string().uuid(), z.literal('')]).optional(),
  valor: centavos.pipe(z.number().int().min(1, 'Informe o valor.').max(100_000_000)),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe o vencimento.'),
});

export interface EstadoLancamento {
  erro?: string;
  erros?: Record<string, string>;
}

export async function novoLancamento(
  _: EstadoLancamento,
  form: FormData,
): Promise<EstadoLancamento> {
  const s = await exigirModulo('financeiro');
  const r = esquema.safeParse(Object.fromEntries(form));
  if (!r.success) {
    const erros: Record<string, string> = {};
    for (const i of r.error.issues) erros[String(i.path[0])] ??= i.message;
    return { erros };
  }
  const ctx = await contexto(s);
  try {
    await criarLancamento(
      ctx,
      {
        tipo: r.data.tipo,
        contraparte: r.data.contraparte,
        descricao: r.data.descricao,
        categoriaId: r.data.categoriaId,
        centroCustoId: r.data.centroCustoId || undefined,
        valorCentavos: r.data.valor,
        vencimento: new Date(`${r.data.vencimento}T12:00:00-03:00`),
      },
      { nome: s.nome, ip: ctx.ip },
      { log },
    );
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    throw e;
  }
  redirect(
    `/financeiro/${r.data.tipo === 'PAGAR' ? 'pagar' : 'receber'}?mes=${r.data.vencimento.slice(0, 7)}`,
  );
}
