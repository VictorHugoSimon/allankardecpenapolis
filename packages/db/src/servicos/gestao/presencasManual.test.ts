import { describe, expect, it } from 'vitest';
import { validarNovaAula, validarChamada } from './presencasManual';

const pessoa1 = '123e4567-e89b-42d3-a456-426614174001';
const pessoa2 = '123e4567-e89b-42d3-a456-426614174002';
const turma = '123e4567-e89b-42d3-a456-426614174000';

describe('aulas e chamada com alunos reais', () => {
  it('valida dados da aula e a data', () => {
    expect(validarNovaAula({ turmaId: turma, numero: 1, titulo: ' Primeira aula ', data: '2026-11-04' }).titulo)
      .toBe('Primeira aula');
    expect(() => validarNovaAula({ turmaId: turma, numero: 1, titulo: 'Aula', data: '2026-02-31' })).toThrow();
  });
  it('exige marcação de todos os alunos, incluindo ausentes', () => {
    expect(validarChamada([pessoa1,pessoa2], [
      { pessoaId:pessoa1,presente:true }, { pessoaId:pessoa2,presente:false },
    ])).toHaveLength(2);
    expect(() => validarChamada([pessoa1,pessoa2],[{pessoaId:pessoa1,presente:true}])).toThrow();
  });
  it('impede pessoa externa ou duplicação', () => {
    expect(() => validarChamada([pessoa1,pessoa2],[
      {pessoaId:pessoa1,presente:true},{pessoaId:pessoa1,presente:false},
    ])).toThrow();
  });
});
