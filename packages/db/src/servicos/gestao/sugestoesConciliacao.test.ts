import { describe, expect, it } from 'vitest';
import {
  sugerirCorrespondencias,
  type CandidatoLancamento,
  type MovimentoParaSugestao,
} from './sugestoesConciliacao';

const lancamento: CandidatoLancamento = {
  id: 'l1',
  tipo: 'RECEBER',
  valorCentavos: 12500,
  status: 'PAGO',
  pagoEm: new Date('2026-11-04T16:00:00Z'),
  contraparte: 'Doação',
};
const extrato: MovimentoParaSugestao = {
  id: 'e1',
  data: new Date('2026-11-05T00:00:00Z'),
  valorCentavos: 12500,
  lancamentoId: null,
  status: 'PENDENTE',
};

describe('sugestões de conciliação', () => {
  it('sugere apenas uma correspondência compatível, sem alterar dados', () => {
    const original = { ...extrato };
    const [r] = sugerirCorrespondencias([extrato], [lancamento]);
    expect(r?.candidato?.id).toBe('l1');
    expect(r?.motivo).toContain('confirmação humana');
    expect(extrato).toEqual(original);
  });

  it('não sugere natureza errada, valor diferente ou conta ainda não paga', () => {
    for (const diferente of [
      { ...lancamento, tipo: 'PAGAR' as const },
      { ...lancamento, valorCentavos: 10000 },
      { ...lancamento, status: 'APROVADO' },
      { ...lancamento, pagoEm: null },
    ]) {
      expect(sugerirCorrespondencias([extrato], [diferente])[0]?.candidato).toBeNull();
    }
  });

  it('recusa a sugestão quando há mais de um pagamento possível', () => {
    const [r] = sugerirCorrespondencias([extrato], [lancamento, { ...lancamento, id: 'l2' }]);
    expect(r?.candidato).toBeNull();
    expect(r?.quantidadeCandidatos).toBe(2);
  });

  it('não oferece pagamento vinculado anteriormente', () => {
    const jaVinculado = { ...extrato, id: 'e2', lancamentoId: 'l1', status: 'CONCILIADO' };
    expect(sugerirCorrespondencias([extrato, jaVinculado], [lancamento])[0]?.candidato).toBeNull();
  });

  it('não sugere o mesmo pagamento para duas linhas iguais', () => {
    const r = sugerirCorrespondencias([extrato, { ...extrato, id: 'e2' }], [lancamento]);
    expect(r.every((item) => item.candidato === null)).toBe(true);
    expect(r[0]?.motivo).toContain('disputa');
  });

  it('rejeita lançamento fora da janela de 3 dias', () => {
    const antigo = { ...lancamento, pagoEm: new Date('2026-10-20T16:00:00Z') };
    expect(sugerirCorrespondencias([extrato], [antigo])[0]?.candidato).toBeNull();
  });
});
