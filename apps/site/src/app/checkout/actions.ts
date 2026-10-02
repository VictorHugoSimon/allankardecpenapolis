'use server';

import { checkoutSchema } from '@ceak/core/validacao';
import { ErroNegocio, iniciarPedido } from '@ceak/db';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { dentroDoLimite, depsPagamento, log } from '@/lib/servidor';

export interface EstadoCheckout extends EstadoForm {
  pedidoId?: string;
}

export async function finalizarPedido(_: EstadoCheckout, form: FormData): Promise<EstadoCheckout> {
  const valores = textos(form, ['nome', 'whatsapp']);
  let itens: unknown = [];
  try {
    itens = JSON.parse(String(form.get('itens') ?? '[]'));
  } catch {
    itens = [];
  }
  const r = checkoutSchema.safeParse({
    ...valores,
    itens,
    consentimento: form.get('consentimento') === 'sim',
    site: form.get('site') ?? '',
  });
  if (!r.success) {
    const e = errosDoZod(r.error);
    return { erros: e, erro: e.itens, valores };
  }
  if (!(await dentroDoLimite('checkout', 10))) return { erro: MSG_LIMITE, valores };
  try {
    const { id } = await iniciarPedido(r.data, depsPagamento());
    return { ok: true, pedidoId: id };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message, valores };
    log.error('FINANCEIRO', 'pedido.falha', {
      rota: '/checkout',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
}
