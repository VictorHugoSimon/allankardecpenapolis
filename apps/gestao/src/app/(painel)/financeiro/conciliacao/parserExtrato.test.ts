import { describe, expect, it } from 'vitest';
import { prepararPreviaExtrato } from './parserExtrato';

describe('prévia de extrato bancário CSV', () => {
  it('interpreta decimal brasileiro, aspas e duplicidades internas', () => {
    const csv = 'data;descricao;valor\r\n04/11/2026;"PIX; doação";1.234,56\r\n04/11/2026;"PIX; doação";1.234,56\r\n05/11/2026;Despesa;-20,00\r\n';
    const p = prepararPreviaExtrato(csv);
    expect(p.creditosCentavos).toBe(246912);
    expect(p.debitosCentavos).toBe(2000);
    expect(p.duplicadas).toBe(1);
    expect(p.linhas[1]?.duplicadaNoArquivo).toBe(true);
  });
  it.each([
    'data;descricao;valor\n31/02/2026;Inexistente;10,00',
    'data;descricao;valor\n04/11/2026;Sem centavos;10.20',
    'data;descricao;valor\n04/11/2026;Zero;0,00',
    'data;descricao;valor\n04/11/2026;"Aspas;10,00',
    'data;descricao;valor\n04/11/2026;A;1,00;4',
  ])('rejeita CSV inconsistente', (csv) => {
    expect(() => prepararPreviaExtrato(csv)).toThrow();
  });
});
