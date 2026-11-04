import { describe, expect, it } from 'vitest';
import { consolidarFluxoCaixa } from './fluxoCaixa';

const inicio = new Date('2026-11-01T03:00:00.000Z');
const fim = new Date('2026-12-01T03:00:00.000Z');
const periodos = [{ inicio, fim, rotulo: 'nov' }] as const;
const dentro = new Date('2026-11-12T12:00:00.000Z');
const fora = new Date('2026-12-12T12:00:00.000Z');

describe('fluxo de caixa financeiro', () => {
  it('separa pagamentos realizados das contas ainda previstas', () => {
    const [m] = consolidarFluxoCaixa([
      { tipo: 'RECEBER', valorCentavos: 40000, status: 'PAGO', pagoEm: dentro, vencimento: fora },
      { tipo: 'PAGAR', valorCentavos: 50000, status: 'PAGO', pagoEm: dentro, vencimento: dentro },
      { tipo: 'RECEBER', valorCentavos: 30000, status: 'PENDENTE', pagoEm: null, vencimento: dentro },
      { tipo: 'PAGAR', valorCentavos: 10000, status: 'APROVADO', pagoEm: null, vencimento: dentro },
      { tipo: 'PAGAR', valorCentavos: 99000, status: 'CANCELADO', pagoEm: null, vencimento: dentro },
    ], [...periodos]);
    expect(m).toMatchObject({
      entradas: 40000, saidas: 50000, saldo: -10000, acumuladoPeriodo: -10000,
      entradasPrevistas: 30000, saidasPrevistas: 10000, saldoPrevisto: 20000,
    });
  });
  it('não inclui datas fora do intervalo ou no limite final', () => {
    const [m] = consolidarFluxoCaixa([
      { tipo: 'RECEBER', valorCentavos: 300, status: 'PAGO', pagoEm: fim, vencimento: dentro },
      { tipo: 'RECEBER', valorCentavos: 100, status: 'PAGO', pagoEm: inicio, vencimento: fora },
    ], [...periodos]);
    expect(m.entradas).toBe(100);
  });
  it('mantém o saldo acumulado negativo, sem fingir saldo bancário', () => {
    const itens = consolidarFluxoCaixa([
      { tipo: 'PAGAR', valorCentavos: 200, status: 'PAGO', pagoEm: dentro, vencimento: dentro },
    ], [...periodos]);
    expect(itens[0]?.acumuladoPeriodo).toBe(-200);
  });
});
