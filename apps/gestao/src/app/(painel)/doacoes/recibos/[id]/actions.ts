'use server';

import { revalidatePath } from 'next/cache';
import { comRls, registrarAuditoria } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Emite uma única vez o recibo administrativo interno, sem gerar cobrança ou certificado fiscal. */
export async function emitirReciboInterno(form: FormData): Promise<void> {
  const sessao = await exigirModulo('doacoes');
  if (sessao.perfil !== 'ADMINISTRADOR') {
    throw new Error('Somente o administrador pode emitir recibos internos.');
  }
  const id = String(form.get('id') ?? '');
  if (!uuid.test(id) || form.get('confirmacao') !== 'EMITIR') {
    throw new Error('Identificação ou confirmação inválida.');
  }
  await comRls(contextoRls(sessao), async tx => {
    const doacao = await tx.doacao.findUnique({
      where: { id },
      select: {
        id: true, statusPagamento: true, pagoEm: true,
        reciboEmitidoEm: true, forma: true, valorCentavos: true,
        itemDescricao: true, destino: true,
      },
    });
    if (!doacao || doacao.statusPagamento !== 'PAGO' || !doacao.pagoEm) {
      throw new Error('Só é permitido emitir recibo de contribuição já confirmada.');
    }
    if (doacao.reciboEmitidoEm) return; // Reenvio de formulário não duplica a emissão.
    const emitidoEm = new Date();
    const atualizado = await tx.doacao.updateMany({
      where: { id, statusPagamento: 'PAGO', pagoEm: { not: null }, reciboEmitidoEm: null },
      data: { reciboEmitidoEm: emitidoEm },
    });
    if (atualizado.count !== 1) {
      throw new Error('Registro alterado em outra sessão. Atualize a página.');
    }
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'doacao.recibo_interno.emitido',
      entidade: 'Doacao',
      entidadeId: id,
      ip: null,
      antes: { reciboEmitidoEm: null },
      depois: {
        reciboEmitidoEm: emitidoEm.toISOString(),
        referencia: `CEAK-${doacao.pagoEm.getUTCFullYear()}-${id.toUpperCase()}`,
        statusPagamento: 'PAGO',
        forma: doacao.forma,
        valorCentavos: doacao.valorCentavos,
        itemDescricao: doacao.itemDescricao,
        destino: doacao.destino,
        tipo: 'RECIBO_INTERNO_NAO_FISCAL',
      },
    });
  });
  revalidatePath(`/doacoes/recibos/${id}`);
  revalidatePath('/doacoes/recibos');
}
