import { describe, expect, it } from 'vitest';
import { prepararHorarioAtividade } from './horario';

describe('horário da agenda no primeiro uso', () => {
  it('gera início e fim corretos no horário de Penápolis', () => {
    const d = prepararHorarioAtividade('2026-11-04', '20:00', 90);
    expect(d.inicio.toISOString()).toBe('2026-11-04T23:00:00.000Z');
    expect(d.fim.toISOString()).toBe('2026-11-05T00:30:00.000Z');
  });
  it.each([
    ['2026-02-31', '20:00', 60],
    ['2026-13-01', '20:00', 60],
    ['2026-11-04', '24:00', 60],
    ['2026-11-04', '19:60', 60],
    ['2026-11-04', '20:00', 0],
    ['2026-11-04', '20:00', 900],
  ] as const)('rejeita data e duração inválidas', (data, hora, duracao) => {
    expect(() => prepararHorarioAtividade(data, hora, duracao)).toThrow();
  });
});
