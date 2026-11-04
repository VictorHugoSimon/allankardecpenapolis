import { registrarAuditoria } from '../../auditoria';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';

interface RegistroConferencia {
  tipo: 'PAGAR' | 'RECEBER';
  status: string;
  valorCentavos: number;
  pagoEm: Date | null;
}

export function conferirConciliacao(valorExtrato: number, lancamento: RegistroConferencia): void {
  if (lancamento.status !== 'PAGO' || !lancamento.pagoEm) {
    throw new ErroNegocio('Somente lançamentos pagos podem ser conciliados.', 'nao_pago');
  }
  const valorEsperado =
    lancamento.tipo === 'RECEBER' ? lancamento.valorCentavos : -lancamento.valorCentavos;
  if (valorEsperado !== valorExtrato) {
    throw new ErroNegocio(
      'O valor e a natureza do lançamento devem corresponder exatamente ao extrato.',
      'divergencia',
    );
  }
}

/**
 * Decisão humana para uma linha já persistida, com auditoria na mesma transação.
 * Nunca cria pagamento, altera saldo de lançamento nem importa CSV.
 */
export async function confirmarConciliacao(
  ctx: ContextoRls & { usuarioId: string },
  extratoId: string,
  lancamentoId: string,
  ip: string | null,
): Promise<void> {
  await comRls(ctx, async (tx) => {
    // Lock do lançamento protege contra duas confirmações simultâneas concorrentes.
    const bloqueado = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM lancamento WHERE id = ${lancamentoId}::uuid FOR UPDATE
    `;
    if (bloqueado.length !== 1) {
      throw new ErroNegocio('Lançamento indisponível para conciliação.', 'nao_encontrado');
    }
    const [linha, lancamento, outroVinculo] = await Promise.all([
      tx.extratoLinha.findUnique({
        where: { id: extratoId },
        select: {
          id: true,
          descricao: true,
          valorCentavos: true,
          status: true,
          lancamentoId: true,
        },
      }),
      tx.lancamento.findUnique({
        where: { id: lancamentoId },
        select: { id: true, tipo: true, valorCentavos: true, status: true, pagoEm: true },
      }),
      tx.extratoLinha.findFirst({
        where: { lancamentoId, id: { not: extratoId } },
        select: { id: true },
      }),
    ]);
    if (!linha || !lancamento) {
      throw new ErroNegocio('Movimentação ou lançamento não encontrado.', 'nao_encontrado');
    }
    if (!['PENDENTE', 'SUGERIDO'].includes(linha.status) || linha.lancamentoId) {
      throw new ErroNegocio(
        'Esta movimentação já foi vinculada ou não aceita confirmação.',
        'ja_conciliado',
      );
    }
    if (outroVinculo) {
      throw new ErroNegocio(
        'Este lançamento já está vinculado a outra movimentação.',
        'duplicidade',
      );
    }
    conferirConciliacao(linha.valorCentavos, lancamento);
    const resultado = await tx.extratoLinha.updateMany({
      where: { id: extratoId, lancamentoId: null, status: { in: ['PENDENTE', 'SUGERIDO'] } },
      data: { lancamentoId, status: 'CONCILIADO', conciliadoEm: new Date() },
    });
    if (resultado.count !== 1) {
      throw new ErroNegocio(
        'A movimentação foi alterada. Atualize a tela e tente novamente.',
        'concorrencia',
      );
    }
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'confirmou conciliação bancária',
      entidade: 'ExtratoLinha',
      entidadeId: extratoId,
      antes: { status: linha.status, lancamentoId: null },
      depois: { status: 'CONCILIADO', lancamentoId, valorCentavos: linha.valorCentavos },
      ip,
    });
  });
}
