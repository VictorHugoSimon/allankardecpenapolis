/** Única regra de seleção de perfis usada na prévia e na publicação. */
export const SEGMENTOS_COMUNICACAO = ['TODOS', 'MEMBROS', 'VOLUNTARIOS', 'INSTRUTORES'] as const;
export type SegmentoComunicacao = (typeof SEGMENTOS_COMUNICACAO)[number];
export type PerfilComunicacao = 'MEMBRO' | 'VISITANTE' | 'VOLUNTARIO' | 'INSTRUTOR';

export function perfisDoSegmento(segmento: SegmentoComunicacao): PerfilComunicacao[] {
  switch (segmento) {
    case 'MEMBROS':
      return ['MEMBRO'];
    case 'VOLUNTARIOS':
      return ['VOLUNTARIO'];
    case 'INSTRUTORES':
      return ['INSTRUTOR'];
    case 'TODOS':
      return ['MEMBRO', 'VISITANTE', 'VOLUNTARIO', 'INSTRUTOR'];
  }
}
