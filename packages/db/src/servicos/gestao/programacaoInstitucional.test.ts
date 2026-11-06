import { describe, expect, it } from 'vitest';
import { PROGRAMACAO_VAZIA, validarProgramacaoSemanal } from './programacaoInstitucional';

describe('programação semanal institucional', () => {
  it('inicia vazia sem gerar dias ou horários fictícios', () => {
    const resultado = validarProgramacaoSemanal(PROGRAMACAO_VAZIA);
    expect(Object.values(resultado).every((atividade) => atividade === '')).toBe(true);
  });
  it('aceita uma programação real por dia sem obrigar os demais', () => {
    const resultado = validarProgramacaoSemanal({
      ...PROGRAMACAO_VAZIA,
      'Quinta-feira': '  Estudo confirmado às 19h  ',
    });
    expect(resultado['Quinta-feira']).toBe('Estudo confirmado às 19h');
    expect(resultado['Domingo']).toBe('');
  });
  it('rejeita atividades excessivamente longas e valores inválidos', () => {
    expect(() =>
      validarProgramacaoSemanal({ ...PROGRAMACAO_VAZIA, 'Segunda-feira': 'x'.repeat(161) }),
    ).toThrow();
    expect(() =>
      validarProgramacaoSemanal({ ...PROGRAMACAO_VAZIA, 'Terça-feira': null as unknown as string }),
    ).toThrow();
  });
});
