import { describe, expect, it } from 'vitest';
import { tokenCheckin, tokenCheckinValido, urlCheckin } from '../src/regras/checkin';
import {
  checkinAberto,
  conquistasAlcancadas,
  frequencia,
  textoVisitaDoMes,
} from '../src/regras/membro';
import { avaliacaoSchema } from '../src/validacao';

describe('check-in', () => {
  const id = '7f9c0f4e-1d1a-4c55-9a43-0a6c2f4b8a11';
  it('token assinado por evento', () => {
    const t = tokenCheckin(id, 'segredo');
    expect(t).toHaveLength(22);
    expect(tokenCheckinValido(id, t, 'segredo')).toBe(true);
    expect(tokenCheckinValido(id, t, 'outro')).toBe(false);
    expect(tokenCheckinValido('00000000-0000-0000-0000-000000000000', t, 'segredo')).toBe(false);
    expect(tokenCheckinValido(id, null, 'segredo')).toBe(false);
    expect(urlCheckin('http://app/', id, 'segredo')).toBe(`http://app/checkin?evento=${id}&t=${t}`);
  });

  it('janela de check-in', () => {
    const inicio = new Date('2026-10-02T23:00:00Z');
    expect(checkinAberto(inicio, null, new Date('2026-10-02T21:30:00Z'))).toBe(true);
    expect(checkinAberto(inicio, null, new Date('2026-10-02T20:30:00Z'))).toBe(false);
    expect(checkinAberto(inicio, null, new Date('2026-10-03T02:59:00Z'))).toBe(true);
    expect(
      checkinAberto(inicio, new Date('2026-10-03T00:30:00Z'), new Date('2026-10-03T01:00:00Z')),
    ).toBe(false);
  });
});

describe('jornada', () => {
  it('conquistas por marcos pessoais', () => {
    expect(
      conquistasAlcancadas({
        checkins: 0,
        presencasEstudo: 0,
        voluntariados: 0,
        campanhasApoiadas: 0,
      }),
    ).toEqual([]);
    expect(
      conquistasAlcancadas({
        checkins: 5,
        presencasEstudo: 1,
        voluntariados: 0,
        campanhasApoiadas: 1,
      }),
    ).toEqual(['primeira-visita', '5-encontros', 'primeiro-estudo', 'campanha-solidaria']);
  });

  it('textos e frequência', () => {
    expect(textoVisitaDoMes(8, 'outubro')).toBe('8ª visita em outubro registrada na sua jornada');
    expect(frequencia(14, 16)).toBe(88);
    expect(frequencia(0, 0)).toBe(0);
  });
});

describe('avaliação', () => {
  it('valida NPS e estrelas', () => {
    expect(avaliacaoSchema.parse({ nps: '9', conteudo: '5', comentario: '  ' })).toMatchObject({
      nps: 9,
      conteudo: 5,
      comentario: undefined,
    });
    expect(avaliacaoSchema.safeParse({ nps: 11 }).success).toBe(false);
    expect(avaliacaoSchema.safeParse({}).success).toBe(false);
    expect(avaliacaoSchema.safeParse({ nps: 5, clareza: 6 }).success).toBe(false);
  });
});
