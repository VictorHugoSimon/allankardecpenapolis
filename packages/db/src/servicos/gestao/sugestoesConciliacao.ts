/**
 * Sugestões não vinculantes de conciliação bancária.
 * Só considera pagamentos efetivamente registrados como PAGO, com valor e
 * natureza idênticos e data de pagamento a até três dias da linha do extrato.
 * Ambiguidade nunca é resolvida automaticamente.
 */
export interface CandidatoLancamento {
  id: string;
  tipo: 'PAGAR' | 'RECEBER';
  valorCentavos: number;
  status: string;
  pagoEm: Date | null;
  contraparte: string;
}

export interface MovimentoParaSugestao {
  id: string;
  data: Date;
  valorCentavos: number;
  lancamentoId: string | null;
  status: string;
}

export interface SugestaoConciliacao {
  extratoId: string;
  candidato: { id: string; contraparte: string; dataPagamento: string } | null;
  quantidadeCandidatos: number;
  motivo: string;
}

function diaCivilSP(data: Date): string {
  // O pagamento é TIMESTAMPTZ. Comparar o dia bancário em São Paulo.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}

function diferencaDias(a: string, b: string): number {
  const millis = (d: string) => Date.parse(d + 'T00:00:00Z');
  return Math.abs((millis(a) - millis(b)) / 86_400_000);
}

export function sugerirCorrespondencias(
  movimentos: MovimentoParaSugestao[],
  lancamentos: CandidatoLancamento[],
): SugestaoConciliacao[] {
  const candidatosDisponiveis = lancamentos.filter((l) => l.status === 'PAGO' && l.pagoEm !== null);
  // Um lançamento já vinculado a qualquer linha não pode ser oferecido novamente.
  const vinculados = new Set(movimentos.map((m) => m.lancamentoId).filter(Boolean));
  const preliminares = movimentos.map((m) => {
    if (m.lancamentoId || m.status === 'CONCILIADO') {
      return { movimento: m, candidatos: [] as CandidatoLancamento[], bloqueado: true };
    }
    const diaExtrato = m.data.toISOString().slice(0, 10); // @db.Date
    const candidatos = candidatosDisponiveis.filter((l) => {
      if (vinculados.has(l.id)) return false;
      const valorAssinado = (l.tipo === 'RECEBER' ? 1 : -1) * l.valorCentavos;
      return (
        valorAssinado === m.valorCentavos && diferencaDias(diaExtrato, diaCivilSP(l.pagoEm!)) <= 3
      );
    });
    return { movimento: m, candidatos, bloqueado: false };
  });

  // Não sugerir o mesmo lançamento como par único para duas movimentações.
  const ocorrencias = new Map<string, number>();
  for (const item of preliminares) {
    if (item.candidatos.length !== 1) continue;
    const id = item.candidatos[0]!.id;
    ocorrencias.set(id, (ocorrencias.get(id) ?? 0) + 1);
  }

  return preliminares.map(({ movimento, candidatos, bloqueado }) => {
    const unico = candidatos.length === 1 ? candidatos[0]! : null;
    const repetido = unico && (ocorrencias.get(unico.id) ?? 0) > 1;
    const candidato = unico && !repetido ? unico : null;
    return {
      extratoId: movimento.id,
      candidato: candidato
        ? {
            id: candidato.id,
            contraparte: candidato.contraparte,
            dataPagamento: diaCivilSP(candidato.pagoEm!),
          }
        : null,
      quantidadeCandidatos: candidatos.length,
      motivo: bloqueado
        ? 'Já vinculado ou conciliado'
        : repetido
          ? 'Mais de uma linha do extrato disputa o mesmo lançamento'
          : candidatos.length > 1
            ? 'Vários lançamentos possíveis — análise manual necessária'
            : candidatos.length === 0
              ? 'Nenhum pagamento compatível no período'
              : 'Valor, natureza e data compatíveis — requer confirmação humana',
    };
  });
}
