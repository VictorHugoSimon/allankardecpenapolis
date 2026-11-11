import { describe, expect, it } from 'vitest';
import {
  atrasoRetentativaMs,
  CONCORRENCIA_PUSH,
  destinoInternoPush,
  dividirEmLotes,
  TAMANHO_CLAIM_PUSH,
} from './regrasFilaPush';

describe('fila de notificações', () => {
  it('divide 1.000 destinos em claims de 50 e sublotes de até 10 sem perdas', () => {
    const destinos = Array.from({ length: 1_000 }, (_, indice) => `dispositivo-${indice}`);
    const claims = dividirEmLotes(destinos, TAMANHO_CLAIM_PUSH);
    expect(claims).toHaveLength(20);
    expect(claims.every((claim) => claim.length <= 50)).toBe(true);
    const lotes = claims.flatMap((claim) => dividirEmLotes(claim, CONCORRENCIA_PUSH));
    expect(lotes).toHaveLength(100);
    expect(lotes.every((lote) => lote.length <= 10)).toBe(true);
    expect(lotes.flat()).toEqual(destinos);
    expect(new Set(lotes.flat()).size).toBe(1_000);
  });

  it('não processa lote vazio e recusa tamanho inválido', () => {
    expect(dividirEmLotes([], CONCORRENCIA_PUSH)).toEqual([]);
    for (const tamanho of [0, -1, 1.5, Number.NaN]) {
      expect(() => dividirEmLotes([1], tamanho)).toThrow('Tamanho de lote inválido.');
    }
  });

  it('aplica espera exponencial limitada a 16 minutos', () => {
    expect([1, 2, 3, 4, 5, 6].map(atrasoRetentativaMs)).toEqual([
      60_000, 120_000, 240_000, 480_000, 960_000, 960_000,
    ]);
  });

  it('não aceita contagens inválidas', () => {
    expect(() => atrasoRetentativaMs(0)).toThrow();
    expect(() => atrasoRetentativaMs(-1)).toThrow();
    expect(() => atrasoRetentativaMs(1.5)).toThrow();
  });

  it('aceita somente links internos e protege contra redirecionamentos externos', () => {
    expect(destinoInternoPush('/agenda')).toBe('/agenda');
    expect(destinoInternoPush('/notificacoes?origem=ceak')).toBe('/notificacoes?origem=ceak');
    expect(destinoInternoPush('/agenda#proximos')).toBe('/agenda#proximos');
    for (const url of [
      null,
      undefined,
      'https://example.org',
      '//example.org',
      '/\\example.org',
      '/foo\\\\bar',
      '/%5cexample.org',
      '/%2fexample.org',
      '/%2F%2Fexample.org',
      '/agenda%0d%0a',
      '/agenda\n//example.org',
      'javascript:alert(1)',
      123,
    ]) {
      expect(destinoInternoPush(url)).toBe('/notificacoes');
    }
  });
});
