import { describe, expect, it } from 'vitest';
import { diffCampos, mascararIp } from '../src/auditoria';
import {
  formatarCentavos,
  formatarData,
  formatarDataExtenso,
  formatarHora,
  iniciais,
} from '../src/format';

describe('formatação pt-BR', () => {
  it('formata moeda', () => {
    expect(formatarCentavos(286200)).toBe('R$ 2.862,00');
    expect(formatarCentavos(18990)).toBe('R$ 189,90');
  });

  it('formata datas no fuso de Penápolis', () => {
    const t = new Date('2026-10-02T22:54:00Z'); // 19:54 em Penápolis
    expect(formatarData(t)).toBe('02/10/2026');
    expect(formatarHora(t)).toBe('19:54');
    expect(formatarDataExtenso(t)).toBe('Sexta-feira, 02 de outubro de 2026');
  });

  it('gera iniciais', () => {
    expect(iniciais('Antônio Ferreira')).toBe('AF');
    expect(iniciais('João Batista da Rocha')).toBe('JR');
    expect(iniciais('Maria')).toBe('M');
  });
});

describe('auditoria', () => {
  it('grava só os campos alterados', () => {
    expect(
      diffCampos({ valor: 84200, status: 'PENDENTE' }, { valor: 86200, status: 'PENDENTE' }),
    ).toEqual({
      antes: { valor: 84200 },
      depois: { valor: 86200 },
    });
    expect(diffCampos(null, { a: 1 })).toEqual({ antes: null, depois: { a: 1 } });
  });

  it('mascara IP', () => {
    expect(mascararIp('177.38.10.20')).toBe('177.38.x.x');
    expect(mascararIp(null)).toBe('—');
  });
});
