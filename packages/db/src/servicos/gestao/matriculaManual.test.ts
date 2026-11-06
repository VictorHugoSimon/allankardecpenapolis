import { describe, expect, it } from 'vitest';
import { validarMatriculaManual } from './matriculaManual';

describe('matrícula manual', () => {
  const valido = {
    turmaId: '123e4567-e89b-42d3-a456-426614174000',
    pessoaId: '123e4567-e89b-42d3-a456-426614174001',
  };
  it('aceita IDs válidos sem criar dados', () => {
    expect(validarMatriculaManual(valido)).toEqual(valido);
  });
  it('rejeita identificadores inválidos', () => {
    expect(() => validarMatriculaManual({ ...valido, pessoaId: 'nao-e-uuid' })).toThrow();
  });
});
