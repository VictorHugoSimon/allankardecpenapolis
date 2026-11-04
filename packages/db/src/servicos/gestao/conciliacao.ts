import { comRls, type ContextoRls } from '../../rls';
import { mes } from './periodo';

type StatusExtrato = 'PENDENTE' | 'SUGERIDO' | 'CONCILIADO' | 'DIVERGENTE';
type Tipo = 'PAGAR' | 'RECEBER';

export interface LinhaExtratoConciliacao {
  id: string;
  data: Date;
  descricao: string;
  valorCentavos: number;
  lancamentoId: string | null;
  status: StatusExtrato;
  referencia: string | null;
  lancamento: {
    id: string;
    tipo: Tipo;
    valorCentavos: number;
    status: string;
    pagoEm: Date | null;
    contraparte: string;
  } | null;
}

export function diagnosticarLinha(l: LinhaExtratoConciliacao) {
  const esperado = l.lancamento
    ? (l.lancamento.tipo === 'RECEBER' ? 1 : -1) * l.lancamento.valorCentavos
    : null;
  const divergente = esperado !== null && esperado !== l.valorCentavos;
  return {
    ...l,
    esperado,
    divergente,
    // Status é decisão registrada: não alterar automaticamente uma conciliação histórica.
    alerta: divergente
      ? 'Valor ou natureza diferente do lançamento vinculado'
      : l.status === 'CONCILIADO' && !l.lancamento
        ? 'Conciliação sem lançamento vinculado'
        : l.lancamento && l.lancamento.status !== 'PAGO'
          ? 'Lançamento vinculado ainda não está pago'
          : null,
  };
}

/** Painel de conferência — somente leitura. Nenhum vínculo ou confirmação automática. */
export async function painelConciliacao(ctx: ContextoRls, referencia = new Date()) {
  const periodo = mes(referencia);
  // Postgres DATE deve ser filtrado por dia civil em UTC, não pelo offset -03:00.
  const inicio = new Date(periodo.inicio.toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const fim = new Date(periodo.fim.toISOString().slice(0, 10) + 'T00:00:00.000Z');

  return comRls(ctx, async (tx) => {
    const linhas = await tx.extratoLinha.findMany({
      where: { data: { gte: inicio, lt: fim } },
      select: {
        id: true,
        data: true,
        descricao: true,
        valorCentavos: true,
        lancamentoId: true,
        status: true,
        referencia: true,
        lancamento: {
          select: {
            id: true,
            tipo: true,
            valorCentavos: true,
            status: true,
            pagoEm: true,
            contraparte: true,
          },
        },
      },
      orderBy: [{ data: 'desc' }, { id: 'asc' }],
    });
    const conferidas = linhas.map(diagnosticarLinha);
    const total = (status: StatusExtrato) =>
      conferidas.filter((l) => l.status === status).length;
    return {
      periodo: periodo.rotulo,
      total: conferidas.length,
      pendentes: total('PENDENTE'),
      sugeridas: total('SUGERIDO'),
      conciliadas: total('CONCILIADO'),
      divergentes: total('DIVERGENTE') + conferidas.filter((l) => l.status !== 'DIVERGENTE' && l.alerta !== null).length,
      creditoCentavos: conferidas.filter((l) => l.valorCentavos > 0).reduce((a, l) => a + l.valorCentavos, 0),
      debitoCentavos: conferidas.filter((l) => l.valorCentavos < 0).reduce((a, l) => a - l.valorCentavos, 0),
      linhas: conferidas,
    };
  });
}
