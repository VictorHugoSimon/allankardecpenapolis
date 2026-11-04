import { describe, expect, it } from 'vitest';
import { diagnosticarLinha, type LinhaExtratoConciliacao } from './conciliacao';

const base: LinhaExtratoConciliacao = {
  id: 'extrato-1',
  data: new Date('2026-11-04T00:00:00.000Z'),
  descricao: 'Crédito',
  valorCentavos: 2500,
  lancamentoId: 'lanc-1',
  status: 'SUGERIDO',
  referencia: null,
  lancamento: {
    id: 'lanc-1',
    tipo: 'RECEBER',
    valorCentavos: 2500,
    status: 'PAGO',
    pagoEm: new Date('2026-11-04T12:00:00.000Z'),
    contraparte: 'Contribuição',
  },
};

describe('conferência de extrato sem mutações', () => {
  it('reconhece crédito vinculado de igual valor', () => {
    expect(diagnosticarLinha(base)).toMatchObject({
      esperado: 2500,
      divergente: false,
      alerta: null,
    });
  });
  it('reconhece débito correto por sinal negativo', () => {
    const linha = {
      ...base,
      valorCentavos: -2500,
      lancamento: { ...base.lancamento!, tipo: 'PAGAR' as const },
    };
    expect(diagnosticarLinha(linha)).toMatchObject({ esperado: -2500, divergente: false });
  });
  it('marca divergência de valor ou natureza', () => {
    expect(diagnosticarLinha({ ...base, valorCentavos: -2500 })).toMatchObject({
      divergente: true,
      alerta: 'Valor ou natureza diferente do lançamento vinculado',
    });
  });
  it('sinaliza conciliação sem lançamento, mantendo o estado original', () => {
    const r = diagnosticarLinha({
      ...base,
      status: 'CONCILIADO',
      lancamentoId: null,
      lancamento: null,
    });
    expect(r.status).toBe('CONCILIADO');
    expect(r.alerta).toContain('sem lançamento');
  });
  it('sinaliza vínculo cujo lançamento não foi pago', () => {
    expect(
      diagnosticarLinha({ ...base, lancamento: { ...base.lancamento!, status: 'PENDENTE' } })
        .alerta,
    ).toContain('não está pago');
  });
});
