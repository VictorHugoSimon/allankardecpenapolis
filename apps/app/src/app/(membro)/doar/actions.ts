'use server';

import { redirect } from 'next/navigation';
import { DESTINOS_DOACAO } from '@ceak/core/regras';
import { centavos, doacaoSchema } from '@ceak/core/validacao';
import { confirmarPixManual, iniciarDoacao, prisma } from '@ceak/db';
import { campanhaPorTitulo } from '@/lib/dados';
import { errosDoZod, MSG_FALHA, MSG_LIMITE, textos, type EstadoForm } from '@/lib/formulario';
import { dentroDoLimite, depsPagamento, exigirSessao, log } from '@/lib/servidor';

/** Doação pelo App: fica ligada à pessoa e aparece em Minha jornada. */
export async function doar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSessao();
  const valores = textos(form, ['valor', 'outro', 'destino']);
  const bruto = valores.valor === 'outro' ? valores.outro : valores.valor;
  const v = centavos.safeParse(bruto || '0');
  if (!v.success || v.data === 0)
    return { erros: { valor: 'Informe o valor da doação.' }, valores };
  const destino = (DESTINOS_DOACAO as readonly string[]).includes(valores.destino ?? '')
    ? valores.destino!
    : DESTINOS_DOACAO[0];
  const r = doacaoSchema.safeParse({ valorCentavos: v.data, destino });
  if (!r.success) {
    const e = errosDoZod(r.error);
    return { erros: { valor: e.valorCentavos ?? e.destino ?? 'Valor inválido.' }, valores };
  }
  if (!(await dentroDoLimite('app-doacao', 10))) return { erro: MSG_LIMITE, valores };
  let id: string;
  try {
    const campanha = destino.startsWith('Campanha') ? await campanhaPorTitulo(destino) : null;
    ({ id } = await iniciarDoacao(
      {
        valorCentavos: r.data.valorCentavos,
        destino,
        nome: s.nome,
        email: s.email,
        pessoaId: s.pessoaId,
        campanhaId: campanha?.id,
      },
      depsPagamento(),
    ));
  } catch (e) {
    log.error('FINANCEIRO', 'app: doação falhou', {
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
  const s = await exigirSessao();
  const id = String(form.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return { aguardando: true };
  const dono = await prisma.doacao.count({ where: { id, pessoaId: s.pessoaId } });
  if (!dono) return { aguardando: true };
  const r = await confirmarPixManual('doacao', id, depsPagamento());
  if (r.pago) redirect(`/doar/${id}`);
  return { aguardando: true };
}
