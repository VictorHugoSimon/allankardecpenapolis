import { describe, expect, it } from 'vitest';
import { conferirConciliacao } from './confirmarConciliacao';

const pago = {
  tipo: 'RECEBER' as const,
  status: 'PAGO',
  valorCentavos: 15000,
  pagoEm: new Date('2026-11-04T15:00:00.000Z'),
};

describe('regras da confirmação manual de conciliação', () => {
  it('valida crédito pago com valor idêntico', () => {
    expect(() => conferirConciliacao(15000, pago)).not.toThrow();
  });
  it('valida débito pago apenas com sinal negativo', () => {
    expect(() => conferirConciliacao(-15000, { ...pago, tipo: 'PAGAR' })).not.toThrow();
    expect(() => conferirConciliacao(15000, { ...pago, tipo: 'PAGAR' })).toThrow();
  });
  it('não permite valor divergente', () => {
    expect(() => conferirConciliacao(14999, pago)).toThrow(/valor e a natureza/);
  });
  it('não permite lançamento pendente ou pagamento sem data', () => {
    expect(() => conferirConciliacao(15000, { ...pago, status: 'PENDENTE' })).toThrow(/pagos/);
    expect(() => conferirConciliacao(15000, { ...pago, pagoEm: null })).toThrow(/pagos/);
  });
});
