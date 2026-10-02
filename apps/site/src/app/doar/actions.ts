'use server';

import { redirect } from 'next/navigation';
import { centavos, doacaoSchema } from '@ceak/core/validacao';
import { DESTINOS_DOACAO } from '@ceak/core/regras';
import { confirmarPixManual, iniciarDoacao } from '@ceak/db';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { dentroDoLimite, depsPagamento, log } from '@/lib/servidor';

export async function doar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const valores = textos(form, ['valor', 'outro', 'destino', 'nome', 'email']);
  const bruto = valores.valor === 'outro' ? valores.outro : valores.valor;
  const v = centavos.safeParse(bruto || '0');
  if (!v.success || v.data === 0)
    return { erros: { valor: 'Informe o valor da doação.' }, valores };
  const destino = (DESTINOS_DOACAO as readonly string[]).includes(valores.destino ?? '')
    ? valores.destino
    : DESTINOS_DOACAO[0];
  const r = doacaoSchema.safeParse({
    valorCentavos: v.data,
    destino,
    nome: valores.nome,
    email: valores.email,
    site: form.get('site') ?? '',
  });
  if (!r.success) {
    const e = errosDoZod(r.error);
    return { erros: { ...e, ...(e.valorCentavos ? { valor: e.valorCentavos } : {}) }, valores };
  }
  if (!(await dentroDoLimite('doacao', 10))) return { erro: MSG_LIMITE, valores };
  let id: string;
  try {
    ({ id } = await iniciarDoacao(r.data, depsPagamento()));
  } catch (e) {
    log.error('FINANCEIRO', 'doacao.falha', {
      rota: '/doar',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
  redirect(`/doar/${id}`);
}

export async function jaFizPix(
  _: { aguardando?: boolean },
  form: FormData,
): Promise<{ aguardando?: boolean }> {
  const id = String(form.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return { aguardando: true };
  const r = await confirmarPixManual('doacao', id, depsPagamento());
  if (r.pago) redirect(`/doar/${id}`);
  return { aguardando: true };
}
