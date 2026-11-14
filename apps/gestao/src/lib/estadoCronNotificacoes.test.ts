import { describe, expect, it } from 'vitest';
import { estadoCronNotificacoes } from './estadoCronNotificacoes';

describe('estado da automação diária', () => {
  const agora = new Date('2026-11-14T12:00:00Z');
  it('apresenta aviso antes do primeiro registro', () => {
    expect(estadoCronNotificacoes(null, agora)).toBe('sem_registro');
  });
  it('aceita execução diária dentro da tolerância de três horas', () => {
    expect(
      estadoCronNotificacoes(
        { criadoEm: new Date(agora.getTime() - 27 * 60 * 60_000), nivel: 'INFO', status: 200 },
        agora,
      ),
    ).toBe('regular');
  });
  it('detecta execução atrasada', () => {
    expect(
      estadoCronNotificacoes(
        { criadoEm: new Date(agora.getTime() - 28 * 60 * 60_000), nivel: 'INFO', status: 200 },
        agora,
      ),
    ).toBe('atrasado');
  });
  it('prioriza erro operacional sobre a idade do registro', () => {
    expect(estadoCronNotificacoes({ criadoEm: agora, nivel: 'ERROR', status: 500 }, agora)).toBe(
      'falha',
    );
    expect(estadoCronNotificacoes({ criadoEm: agora, nivel: 'WARN', status: 207 }, agora)).toBe(
      'falha',
    );
  });
});
