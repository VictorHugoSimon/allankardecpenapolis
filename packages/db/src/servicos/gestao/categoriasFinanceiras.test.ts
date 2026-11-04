import { describe, expect, it } from 'vitest';
import { validarCategoriaFinanceira } from './categoriasFinanceiras';

describe('validação de categorias financeiras', () => {
  it('normaliza espaços sem criar categorias fictícias', () => {
    expect(validarCategoriaFinanceira({ nome: '  Doações   reais  ', tipo: 'RECEBER' }))
      .toEqual({ nome: 'Doações reais', tipo: 'RECEBER' });
  });
  it('rejeita nomes vazios ou maiores que 80 caracteres', () => {
    expect(() => validarCategoriaFinanceira({ nome: '  ', tipo: 'PAGAR' })).toThrow();
    expect(() => validarCategoriaFinanceira({ nome: 'x'.repeat(81), tipo: 'PAGAR' })).toThrow();
  });
  it('rejeita tipo desconhecido', () => {
    expect(() => validarCategoriaFinanceira({ nome: 'Despesas', tipo: 'INVÁLIDO' as 'PAGAR' }))
      .toThrow();
  });
});
