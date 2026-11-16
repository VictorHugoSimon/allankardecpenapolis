import { describe, expect, it } from 'vitest';
import { perfisDoSegmento, SEGMENTOS_COMUNICACAO } from './segmentosComunicacao';

describe('segmentação compartilhada de comunicados', () => {
  it('abrange os quatro segmentos permitidos', () => {
    expect(SEGMENTOS_COMUNICACAO).toEqual(['TODOS', 'MEMBROS', 'VOLUNTARIOS', 'INSTRUTORES']);
  });
  it('seleciona os mesmos perfis para prévia e publicação', () => {
    expect(perfisDoSegmento('TODOS')).toEqual(['MEMBRO', 'VISITANTE', 'VOLUNTARIO', 'INSTRUTOR']);
    expect(perfisDoSegmento('MEMBROS')).toEqual(['MEMBRO']);
    expect(perfisDoSegmento('VOLUNTARIOS')).toEqual(['VOLUNTARIO']);
    expect(perfisDoSegmento('INSTRUTORES')).toEqual(['INSTRUTOR']);
  });
  it('não repete perfis em um segmento', () => {
    for (const segmento of SEGMENTOS_COMUNICACAO) {
      const perfis = perfisDoSegmento(segmento);
      expect(perfis.length).toBeGreaterThan(0);
      expect(new Set(perfis).size).toBe(perfis.length);
    }
  });
});
