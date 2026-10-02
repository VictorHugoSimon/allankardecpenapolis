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

describe('datas do site', async () => {
  const f = await import('../src/format');
  const sexta20h = new Date('2026-10-02T23:00:00Z'); // 20h em Penápolis

  it('partes da data', () => {
    expect(f.partesData(sexta20h)).toMatchObject({
      dia: 2,
      diaSemana: 'Sexta-feira',
      diaSemanaCurto: 'Sex',
      mesCurto: 'OUT',
      chaveDia: '2026-10-02',
    });
  });

  it('horários', () => {
    expect(f.formatarHorario(sexta20h)).toBe('20h00');
    expect(
      f.formatarHorario(new Date('2026-10-17T11:00:00Z'), new Date('2026-10-17T15:00:00Z')),
    ).toBe('8h às 12h');
    expect(f.formatarHoraCurta(new Date('2026-10-03T22:30:00Z'))).toBe('19h30');
  });

  it('datas curtas', () => {
    expect(f.formatarDataCurta(new Date('2026-09-29T13:00:00Z'))).toBe('29 set 2026');
    expect(f.formatarDiaSemanaData(new Date('2026-10-05T23:00:00Z'))).toBe('Seg, 05/10');
    expect(f.formatarMesAno(new Date('2026-09-01T15:00:00Z'))).toBe('Setembro de 2026');
    expect(f.inicioDoDia(sexta20h).toISOString()).toBe('2026-10-02T03:00:00.000Z');
  });
});
