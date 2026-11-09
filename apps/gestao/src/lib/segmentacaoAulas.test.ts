import { describe, expect, it } from 'vitest';
import {
  ehAvisoRestritoTurma,
  selecionarDestinatariosTurma,
  validarFiltroTurma,
} from './segmentacaoAulas';

const turmaId = '123e4567-e89b-42d3-a456-426614174000';
const aulaId = '123e4567-e89b-42d3-a456-426614174001';

describe('segmentação de aulas (nunca ampliar público)', () => {
  const valido = {
    origem: 'AUTOMACAO_LEMBRETE_AULA',
    exigeSegmentacaoTurma: true,
    segmento: 'MATRICULADOS_TURMA',
    turmaId,
    aulaId,
  };

  it('valida apenas uma segmentação restrita completa', () => {
    expect(validarFiltroTurma(valido)).toEqual(valido);
    for (const chave of Object.keys(valido)) {
      expect(() => validarFiltroTurma({ ...valido, [chave]: undefined })).toThrow();
    }
  });

  it('não aceita IDs falsos, filtros mistos nem segmento TODOS', () => {
    expect(() => validarFiltroTurma({ ...valido, turmaId: '../../todos' })).toThrow();
    expect(() => validarFiltroTurma({ ...valido, aulaId: 'qualquer-coisa' })).toThrow();
    expect(() => validarFiltroTurma({ ...valido, segmento: 'TODOS' })).toThrow();
    expect(ehAvisoRestritoTurma({ turmaId })).toBe(true);
    expect(ehAvisoRestritoTurma({ segmento: 'MATRICULADOS_TURMA' })).toBe(true);
    expect(ehAvisoRestritoTurma({ origem: 'AUTOMACAO_LEMBRETE_AULA' })).toBe(true);
    expect(ehAvisoRestritoTurma({ segmento: 'TODOS' })).toBe(false);
  });

  it('envia somente a alunos com matrícula ativa, conta ativa e consentimento', () => {
    const matriculas = [
      { pessoaId: 'A', status: 'ATIVA' },
      { pessoaId: 'B', status: 'TRANCADA' },
      { pessoaId: 'C', status: 'ATIVA' },
      { pessoaId: 'D', status: 'ATIVA' },
      { pessoaId: 'E', status: 'ATIVA' },
      { pessoaId: 'F', status: 'ATIVA' },
    ];
    const pessoa = (id: string, extras: Partial<{
      contaAtiva: boolean;
      consentimento: boolean;
      exclusaoSolicitada: boolean;
      anonimizada: boolean;
    }> = {}) => ({
      id,
      contaAtiva: true,
      consentimento: true,
      exclusaoSolicitada: false,
      anonimizada: false,
      ...extras,
    });
    const destinatarios = selecionarDestinatariosTurma(matriculas, [
      pessoa('A'),
      pessoa('A'),
      pessoa('B'),
      pessoa('C', { consentimento: false }),
      pessoa('D', { contaAtiva: false }),
      pessoa('E', { exclusaoSolicitada: true }),
      pessoa('F', { anonimizada: true }),
      pessoa('G'),
    ]);
    expect(destinatarios).toEqual(['A']);
  });

  it('turma sem matrícula ativa produz lista vazia, nunca envio geral', () => {
    expect(selecionarDestinatariosTurma([], [{
      id: 'A', contaAtiva: true, consentimento: true,
      exclusaoSolicitada: false, anonimizada: false,
    }])).toEqual([]);
  });
});
