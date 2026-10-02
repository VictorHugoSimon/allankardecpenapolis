'use server';

import { redirect } from 'next/navigation';
import { confirmarPixManual } from '@ceak/db';
import { depsPagamento } from '@/lib/servidor';

export async function jaFizPixPedido(
  _: { aguardando?: boolean },
  form: FormData,
): Promise<{ aguardando?: boolean }> {
  const id = String(form.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return { aguardando: true };
  const r = await confirmarPixManual('pedido', id, depsPagamento());
  if (r.pago) redirect(`/pedido/${id}`);
  return { aguardando: true };
}
