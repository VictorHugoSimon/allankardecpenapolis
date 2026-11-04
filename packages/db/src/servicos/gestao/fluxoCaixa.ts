import { comRls, type ContextoRls } from '../../rls';
import { mes } from './periodo';

export interface MovimentoFluxo {
  tipo: 'PAGAR' | 'RECEBER';
  valorCentavos: number;
  status: string;
  pagoEm: Date | null;
  vencimento: Date;
}

/** Datas @db.Date chegam à aplicação à meia-noite UTC; comparar por dia civil. */
function dataCivilUtc(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export interface PeriodoFluxo {
  inicio: Date;
  fim: Date;
  rotulo: string;
}

/**
 * Consolida por data de pagamento (realizado) e vencimento (previsto).
 * Previsto considera somente contas abertas; não mistura provisões com saldo realizado.
 * Nenhum resultado equivale ao saldo bancário conciliado.
 */
export function consolidarFluxoCaixa(
  movimentos: MovimentoFluxo[],
  periodos: PeriodoFluxo[],
) {
  let acumuladoPeriodo = 0;
  return periodos.map((p) => {
    let entradas = 0;
    let saidas = 0;
    let entradasPrevistas = 0;
    let saidasPrevistas = 0;
    for (const l of movimentos) {
      if (l.status === 'PAGO' && l.pagoEm && l.pagoEm >= p.inicio && l.pagoEm < p.fim) {
        if (l.tipo === 'RECEBER') entradas += l.valorCentavos;
        else saidas += l.valorCentavos;
      } else if (
        ['PENDENTE', 'APROVADO', 'VENCIDO'].includes(l.status) &&
        dataCivilUtc(l.vencimento) >= dataCivilUtc(p.inicio) &&
        dataCivilUtc(l.vencimento) < dataCivilUtc(p.fim)
      ) {
        if (l.tipo === 'RECEBER') entradasPrevistas += l.valorCentavos;
        else saidasPrevistas += l.valorCentavos;
      }
    }
    const saldo = entradas - saidas;
    acumuladoPeriodo += saldo;
    return {
      rotulo: p.rotulo,
      entradas,
      saidas,
      saldo,
      acumuladoPeriodo,
      entradasPrevistas,
      saidasPrevistas,
      saldoPrevisto: entradasPrevistas - saidasPrevistas,
    };
  });
}

/** Visão de seis competências até o mês selecionado, somente com dados permitidos pelo RLS. */
export async function fluxoCaixaFinanceiro(ctx: ContextoRls, referencia = new Date()) {
  const periodos = Array.from({ length: 6 }, (_, i) => mes(referencia, i - 5));
  return comRls(ctx, async (tx) => {
    const inicio = periodos[0]!.inicio;
    const fim = periodos[periodos.length - 1]!.fim;
    const inicioVencimento = new Date(`${dataCivilUtc(inicio)}T00:00:00.000Z`);
    const fimVencimento = new Date(`${dataCivilUtc(fim)}T00:00:00.000Z`);
    const lancamentos = await tx.lancamento.findMany({
      where: {
        OR: [
          { status: 'PAGO', pagoEm: { gte: inicio, lt: fim } },
          {
            status: { in: ['PENDENTE', 'APROVADO', 'VENCIDO'] },
            vencimento: { gte: inicioVencimento, lt: fimVencimento },
          },
        ],
      },
      select: {
        tipo: true,
        valorCentavos: true,
        status: true,
        pagoEm: true,
        vencimento: true,
      },
    });
    return {
      periodo: periodos.map((m) => m.curto).join(' · '),
      meses: consolidarFluxoCaixa(
        lancamentos,
        periodos.map((m) => ({ inicio: m.inicio, fim: m.fim, rotulo: m.curto })),
      ),
    };
  });
}
