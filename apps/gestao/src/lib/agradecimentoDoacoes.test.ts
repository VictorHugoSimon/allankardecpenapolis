import { describe, expect, it } from 'vitest';
import { agradecimentoElegivel, mensagemAgradecimento } from './agradecimentoDoacoes';

const data = new Date('2026-11-09T12:00:00.000Z');
const base = {
  statusPagamento: 'PAGO', pagoEm: data, reciboEmitidoEm: data,
  pessoaId: '123e4567-e89b-42d3-a456-426614174000',
  consentimentoEm: data, exclusaoSolicitadaEm: null,
  anonimizadaEm: null, usuarioAtivo: true,
};

describe('agradecimentos privados a doadores', () => {
  it('exige contribuição paga, recibo emitido, identidade e consentimento', () => {
    expect(agradecimentoElegivel(base)).toBe(true);
    expect(agradecimentoElegivel({ ...base, statusPagamento: 'ESTORNADO' })).toBe(false);
    expect(agradecimentoElegivel({ ...base, statusPagamento: 'AGUARDANDO' })).toBe(false);
    expect(agradecimentoElegivel({ ...base, pagoEm: null })).toBe(false);
    expect(agradecimentoElegivel({ ...base, reciboEmitidoEm: null })).toBe(false);
    expect(agradecimentoElegivel({ ...base, pessoaId: null })).toBe(false);
    expect(agradecimentoElegivel({ ...base, consentimentoEm: null })).toBe(false);
    expect(agradecimentoElegivel({ ...base, usuarioAtivo: false })).toBe(false);
    expect(agradecimentoElegivel({ ...base, exclusaoSolicitadaEm: data })).toBe(false);
    expect(agradecimentoElegivel({ ...base, anonimizadaEm: data })).toBe(false);
  });
  it('não inclui valor, número de doação ou dados bancários no texto', () => {
    const s = mensagemAgradecimento('Maria', 'campanha de alimentos');
    expect(s).toContain('Maria');
    expect(s).toContain('campanha de alimentos');
    expect(s).not.toMatch(/pix|r\$|conta bancária/i);
  });
});
