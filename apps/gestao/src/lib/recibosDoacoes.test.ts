import { describe, expect, it } from 'vitest';
import { podeEmitirRecibo, reciboJaEmitido, referenciaReciboInterno } from './recibosDoacoes';

const data = new Date('2026-11-09T12:00:00.000Z');
const id = '123e4567-e89b-42d3-a456-426614174000';

describe('recibo interno não fiscal', () => {
  it('só permite nova emissão de doação paga e confirmada', () => {
    expect(podeEmitirRecibo({ statusPagamento: 'PAGO', pagoEm: data, reciboEmitidoEm: null })).toBe(
      true,
    );
    for (const statusPagamento of ['AGUARDANDO', 'EXPIRADO', 'CANCELADO', 'ESTORNADO']) {
      expect(podeEmitirRecibo({ statusPagamento, pagoEm: data, reciboEmitidoEm: null })).toBe(
        false,
      );
    }
    expect(podeEmitirRecibo({ statusPagamento: 'PAGO', pagoEm: null, reciboEmitidoEm: null })).toBe(
      false,
    );
  });

  it('repetição da operação não autoriza segunda emissão', () => {
    const doacao = { statusPagamento: 'PAGO', pagoEm: data, reciboEmitidoEm: data };
    expect(podeEmitirRecibo(doacao)).toBe(false);
    expect(reciboJaEmitido(doacao)).toBe(true);
    expect(reciboJaEmitido({ ...doacao, statusPagamento: 'ESTORNADO' })).toBe(false);
  });

  it('mantém referência estável não fiscal sem expor nome ou e-mail', () => {
    expect(referenciaReciboInterno(id, data)).toBe(
      'CEAK-2026-123E4567-E89B-42D3-A456-426614174000',
    );
    expect(() => referenciaReciboInterno('invalido', data)).toThrow();
  });
});
