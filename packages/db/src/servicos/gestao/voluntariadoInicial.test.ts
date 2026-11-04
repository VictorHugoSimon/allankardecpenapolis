import { describe, expect, it } from 'vitest';
import { validarAreaVoluntariado, validarPeriodoEscala } from './voluntariadoInicial';

describe('voluntariado sem dados fictícios', () => {
  it('normaliza área e valida quantidade de vagas', () => {
    expect(validarAreaVoluntariado({ nome: '  Apoio   aos  eventos ', necessidade: 2 }))
      .toMatchObject({ nome: 'Apoio aos eventos', necessidade: 2 });
    expect(() => validarAreaVoluntariado({ nome: 'X', necessidade: 1 })).toThrow();
    expect(() => validarAreaVoluntariado({ nome: 'Recepção', necessidade: -1 })).toThrow();
  });
  it('exige período válido para uma escala', () => {
    const inicio = new Date('2026-11-06T16:00:00Z');
    const fim = new Date('2026-11-06T19:00:00Z');
    expect(validarPeriodoEscala(inicio, fim)).toEqual({ inicio, fim });
    expect(() => validarPeriodoEscala(fim, inicio)).toThrow();
    expect(() => validarPeriodoEscala(inicio, new Date('2026-11-08T00:00:00Z'))).toThrow();
    expect(() => validarPeriodoEscala(new Date('invalid'), fim)).toThrow();
  });
});
