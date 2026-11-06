import { describe, expect, it } from 'vitest';
import { conferirTransicaoAssistencia, podeGerirAssistencia } from './assistenciaInicial';

const contexto = {
  usuarioId: 'u',
  pessoaId: 'p',
  perfil: 'COORDENADOR' as const,
  coordAssistencia: false,
};
describe('assistência com acesso reservado', () => {
  it('reserva gestão à coordenação de assistência designada', () => {
    expect(podeGerirAssistencia(contexto)).toBe(false);
    expect(podeGerirAssistencia({ ...contexto, coordAssistencia: true })).toBe(true);
    expect(podeGerirAssistencia({ ...contexto, perfil: 'VOLUNTARIO' as const })).toBe(false);
  });
  it('permite o fluxo supervisionado de solicitações', () => {
    expect(() => conferirTransicaoAssistencia('PENDENTE', 'AGENDADA')).not.toThrow();
    expect(() => conferirTransicaoAssistencia('AGENDADA', 'CONCLUIDA')).not.toThrow();
    expect(() => conferirTransicaoAssistencia('PENDENTE', 'CONCLUIDA')).toThrow();
    expect(() => conferirTransicaoAssistencia('CONCLUIDA', 'PENDENTE')).toThrow();
  });
});
