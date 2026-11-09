/** Regras puras de segmentação de avisos de aulas.
 * Nunca transformar um filtro inválido em envio geral.
 */
export type FiltroDeTurma = {
  origem: 'AUTOMACAO_LEMBRETE_AULA';
  exigeSegmentacaoTurma: true;
  segmento: 'MATRICULADOS_TURMA';
  turmaId: string;
  aulaId: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ehAvisoRestritoTurma(filtro: Record<string, unknown>): boolean {
  return filtro.exigeSegmentacaoTurma === true ||
    filtro.origem === 'AUTOMACAO_LEMBRETE_AULA' ||
    filtro.segmento === 'MATRICULADOS_TURMA' ||
    'turmaId' in filtro || 'aulaId' in filtro;
}

export function validarFiltroTurma(filtro: Record<string, unknown>): FiltroDeTurma {
  if (filtro.origem !== 'AUTOMACAO_LEMBRETE_AULA' ||
    filtro.exigeSegmentacaoTurma !== true ||
    filtro.segmento !== 'MATRICULADOS_TURMA' ||
    typeof filtro.turmaId !== 'string' ||
    typeof filtro.aulaId !== 'string' ||
    !UUID.test(filtro.turmaId) || !UUID.test(filtro.aulaId)) {
    throw new Error('Lembrete de aula sem segmentação válida de turma.');
  }
  return {
    origem: 'AUTOMACAO_LEMBRETE_AULA',
    exigeSegmentacaoTurma: true,
    segmento: 'MATRICULADOS_TURMA',
    turmaId: filtro.turmaId,
    aulaId: filtro.aulaId,
  };
}

/** Somente alunos ativos da turma, com conta e consentimento válidos. */
export function selecionarDestinatariosTurma(
  matriculas: ReadonlyArray<{ pessoaId: string; status: string }>,
  pessoas: ReadonlyArray<{
    id: string;
    contaAtiva: boolean;
    consentimento: boolean;
    exclusaoSolicitada: boolean;
    anonimizada: boolean;
  }>,
): string[] {
  const matriculados = new Set(
    matriculas.filter(m => m.status === 'ATIVA').map(m => m.pessoaId),
  );
  return [...new Set(pessoas.filter(p =>
    matriculados.has(p.id) &&
    p.contaAtiva && p.consentimento &&
    !p.exclusaoSolicitada && !p.anonimizada,
  ).map(p => p.id))];
}
