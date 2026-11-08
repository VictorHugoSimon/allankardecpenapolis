'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';

/**
 * Confirma somente a entrega física de pedidos previamente pagos.
 * Nunca aprova PIX, altera o valor ou simula pagamento.
 */
export async function confirmarRetirada(form: FormData): Promise<void> {
  const sessao = await exigirModulo('loja');
  if (!['ADMINISTRADOR', 'DIRETORIA'].includes(sessao.perfil)) {
    throw new Error('Seu perfil não tem permissão para confirmar retiradas.');
  }
  const id = String(form.get('pedidoId') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Pedido inválido.');
  await comRls(contextoRls(sessao), async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id },
      select: { status: true, statusPagamento: true, retiradoEm: true },
    });
    if (!pedido) throw new Error('Pedido não encontrado.');
    if (pedido.statusPagamento !== 'PAGO' || pedido.status !== 'AGUARDANDO_RETIRADA') {
      throw new Error('Somente pedidos pagos, pendentes de retirada, podem ser entregues.');
    }
    const atualizado = await tx.pedido.updateMany({
      where: { id, status: 'AGUARDANDO_RETIRADA', statusPagamento: 'PAGO', retiradoEm: null },
      data: { status: 'RETIRADO', retiradoEm: new Date() },
    });
    if (atualizado.count !== 1) throw new Error('O pedido já foi atualizado por outra pessoa.');
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'pedido.retirado',
      entidade: 'Pedido',
      entidadeId: id,
      antes: { status: pedido.status },
      depois: { status: 'RETIRADO' },
      ip: null,
    });
  });
  revalidatePath('/loja/pedidos');
  revalidatePath('/loja');
}
