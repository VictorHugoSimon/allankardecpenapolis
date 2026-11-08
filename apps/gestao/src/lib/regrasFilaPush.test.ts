import { describe, expect, it } from 'vitest';
import { atrasoRetentativaMs, destinoInternoPush } from './regrasFilaPush';

describe('fila de notificações', () => {
  it('aplica espera exponencial limitada a 16 minutos', () => {
    expect([1, 2, 3, 4, 5, 6].map(atrasoRetentativaMs))
      .toEqual([60_000, 120_000, 240_000, 480_000, 960_000, 960_000]);
  });

  it('não aceita contagens inválidas', () => {
    expect(() => atrasoRetentativaMs(0)).toThrow();
    expect(() => atrasoRetentativaMs(-1)).toThrow();
    expect(() => atrasoRetentativaMs(1.5)).toThrow();
  });

  it('aceita somente links internos e protege contra redirecionamentos externos', () => {
    expect(destinoInternoPush('/agenda')).toBe('/agenda');
    expect(destinoInternoPush('/notificacoes?origem=ceak')).toBe('/notificacoes?origem=ceak');
    for (const url of [null, undefined, 'https://example.org', '//example.org',
      '/\\example.org', 'javascript:alert(1)', 123]) {
      expect(destinoInternoPush(url)).toBe('/notificacoes');
    }
  });
});
