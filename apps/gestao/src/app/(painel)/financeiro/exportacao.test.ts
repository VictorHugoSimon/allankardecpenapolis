import { describe, expect, it } from 'vitest';
import { gerarCsvContas } from './exportacao';

describe('exportação da tesouraria', () => {
  const linha = {
    contraparte: 'Pessoa; com vírgula, e "aspas"',
    descricao: 'Recebimento',
    categoria: 'Doações',
    centroCusto: 'Acolhimento',
    vencimento: '04/11/2026',
    valorCentavos: 12345,
    rotulo: 'Pago',
    responsavel: 'Tesouraria',
  };
  it('exporta BOM, valores em reais e campos escapados', () => {
    const csv = gerarCsvContas('RECEBER', [linha]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"123,45"');
    expect(csv).toContain('"Pessoa; com vírgula, e ""aspas"""');
    expect(csv).toContain('"Origem"');
  });
  it.each(['=HYPERLINK("x")', '+SUM(1,1)', '-2+3', '@SUM(A1:A2)', '\t=1+1', '\r=1+1'])(
    'protege célula iniciada por fórmula: %s',
    (descricao) => {
      const csv = gerarCsvContas('PAGAR', [{ ...linha, descricao }]);
      expect(csv).toContain('"\'' + descricao.replace(/"/g, '""') + '"');
    },
  );
  it('não deixa de exportar um mês sem lançamentos', () => {
    const csv = gerarCsvContas('PAGAR', []);
    expect(csv).toContain('"Fornecedor"');
    expect(csv.trim().split('\r\n')).toHaveLength(1);
  });
});
