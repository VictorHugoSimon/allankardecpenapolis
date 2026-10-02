import { describe, expect, it } from 'vitest';
import {
  nomeReservado,
  normalizarCarrinho,
  percentual,
  rotuloDisponibilidade,
  servicoPorSlug,
} from '../src/regras';

describe('regras', () => {
  it('rótulo de disponibilidade da loja', () => {
    expect(rotuloDisponibilidade(12, false)).toEqual({ texto: '12 em estoque', alerta: false });
    expect(rotuloDisponibilidade(3, true)).toEqual({ texto: '3 disponíveis', alerta: false });
    expect(rotuloDisponibilidade(1, true)).toEqual({ texto: 'Última unidade', alerta: true });
    expect(rotuloDisponibilidade(0, false).texto).toBe('Esgotado');
  });

  it('nome reservado da assistência', () => {
    expect(nomeReservado('Carla Nogueira')).toBe('Carla N.');
    expect(nomeReservado('João Batista da Rocha')).toBe('João R.');
    expect(nomeReservado('Ana')).toBe('Ana');
  });

  it('percentual limitado', () => {
    expect(percentual(378, 500)).toBe(75);
    expect(percentual(10, 0)).toBe(0);
    expect(percentual(900, 500)).toBe(100);
  });

  it('normaliza carrinho', () => {
    expect(
      normalizarCarrinho([
        { produtoId: 'a', quantidade: 1 },
        { produtoId: 'a', quantidade: 2 },
        { produtoId: 'b', quantidade: 0 },
        { produtoId: 'c', quantidade: 99 },
      ]),
    ).toEqual([
      { produtoId: 'a', quantidade: 3 },
      { produtoId: 'c', quantidade: 20 },
    ]);
  });

  it('encontra serviço por slug', () => {
    expect(servicoPorSlug('tratamento-espiritual')?.nome).toBe('Tratamento espiritual');
    expect(servicoPorSlug('x')).toBeUndefined();
  });
});
