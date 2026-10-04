import { describe, expect, it } from 'vitest';
import {
  base32,
  cifrarSegredo,
  codigoTotp,
  decifrarSegredo,
  deBase32,
  gerarCodigosRecuperacao,
  gerarSegredoTotp,
  uriTotp,
  verificarTotp,
} from '../src/auth/totp';

// RFC 6238, apêndice B (SHA-1): segredo ASCII "12345678901234567890".
const SEGREDO_RFC = base32(Buffer.from('12345678901234567890'));

describe('TOTP', () => {
  it('base32 vai e volta', () => {
    const b = Buffer.from('CEAK Penápolis');
    expect(deBase32(base32(b))).toEqual(b);
    expect(gerarSegredoTotp()).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('confere os vetores da RFC 6238 (8 dígitos)', () => {
    expect(codigoTotp(SEGREDO_RFC, Math.floor(59 / 30), 8)).toBe('94287082');
    expect(codigoTotp(SEGREDO_RFC, Math.floor(1111111109 / 30), 8)).toBe('07081804');
    expect(codigoTotp(SEGREDO_RFC, Math.floor(1234567890 / 30), 8)).toBe('89005924');
    expect(codigoTotp(SEGREDO_RFC, Math.floor(2000000000 / 30), 8)).toBe('69279037');
  });

  it('aceita um passo de tolerância e recusa código repetido', () => {
    const agora = 1_700_000_000_000;
    const p = Math.floor(agora / 30_000);
    const atual = codigoTotp(SEGREDO_RFC, p);
    expect(verificarTotp(SEGREDO_RFC, atual, { agora })).toBe(p);
    expect(verificarTotp(SEGREDO_RFC, codigoTotp(SEGREDO_RFC, p - 1), { agora })).toBe(p - 1);
    expect(verificarTotp(SEGREDO_RFC, codigoTotp(SEGREDO_RFC, p - 2), { agora })).toBeNull();
    expect(verificarTotp(SEGREDO_RFC, atual, { agora, ultimoPasso: p })).toBeNull();
    expect(verificarTotp(SEGREDO_RFC, 'abc123', { agora })).toBeNull();
  });

  it('URI do autenticador', () => {
    expect(uriTotp('ABC', 'maria@ceak')).toBe(
      'otpauth://totp/CEAK%20Gest%C3%A3o%3Amaria%40ceak?secret=ABC&issuer=CEAK+Gest%C3%A3o&algorithm=SHA1&digits=6&period=30',
    );
  });

  it('segredo cifrado só abre com a mesma chave', () => {
    const k = 'k'.repeat(40);
    const c = cifrarSegredo('SEGREDO', k);
    expect(c).not.toContain('SEGREDO');
    expect(decifrarSegredo(c, k)).toBe('SEGREDO');
    expect(() => decifrarSegredo(c, 'x'.repeat(40))).toThrow();
  });

  it('códigos de recuperação únicos', () => {
    const cs = gerarCodigosRecuperacao();
    expect(cs).toHaveLength(8);
    expect(new Set(cs).size).toBe(8);
    expect(cs[0]).toMatch(/^[a-z2-7]{4}-[a-z2-7]{4}$/);
  });
});
