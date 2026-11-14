/** Estado operacional da rotina diária. Não consulta banco nem executa jobs. */
export type EstadoCron = 'sem_registro' | 'regular' | 'atrasado' | 'falha';

export function estadoCronNotificacoes(
  ultimo: { criadoEm: Date; nivel: string; status: number | null } | null,
  agora: Date,
): EstadoCron {
  if (!ultimo) return 'sem_registro';
  if (ultimo.nivel === 'ERROR' || ultimo.nivel === 'WARN' || (ultimo.status ?? 500) >= 400) {
    return 'falha';
  }
  // O cron é diário e pode sofrer atraso de execução na infraestrutura.
  // Não gerar falso alarme antes de um dia inteiro mais 3h de tolerância.
  const idadeMs = agora.getTime() - ultimo.criadoEm.getTime();
  if (idadeMs > 27 * 60 * 60_000) return 'atrasado';
  return 'regular';
}
