/**
 * Trilha de auditoria. Toda alteração em financeiro, perfis, aprovações e
 * assistência grava um registro (usuário, ação, entidade, antes, depois, IP, data).
 * A gravação fica em `@ceak/db` (`registrarAuditoria`); aqui estão os tipos e o diff.
 */
export const ENTIDADES_AUDITADAS = [
  'Lancamento',
  'ExtratoLinha',
  'Doacao',
  'Usuario',
  'Aprovacao',
  'Conteudo',
  'Campanha',
  'SolicitacaoAssistencia',
  'Pedido',
  'ItemEstoque',
  'Integracao',
  'Automacao',
] as const;
export type EntidadeAuditada = (typeof ENTIDADES_AUDITADAS)[number];

export interface RegistroAuditoria {
  usuarioId: string | null;
  acao: string;
  entidade: EntidadeAuditada;
  entidadeId: string;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  ip: string | null;
}

/** Mantém só os campos que mudaram, para gravar antes/depois enxutos. */
export function diffCampos(
  antes: Record<string, unknown> | null,
  depois: Record<string, unknown> | null,
): { antes: Record<string, unknown> | null; depois: Record<string, unknown> | null } {
  if (!antes || !depois) return { antes, depois };
  const a: Record<string, unknown> = {};
  const d: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(antes), ...Object.keys(depois)])) {
    if (JSON.stringify(antes[k]) !== JSON.stringify(depois[k])) {
      a[k] = antes[k];
      d[k] = depois[k];
    }
  }
  return { antes: a, depois: d };
}

/** Mascara o IP para exibição (ex.: 177.38.x.x), como no Logs Center. */
export function mascararIp(ip: string | null | undefined): string {
  if (!ip) return '—';
  const v4 = ip.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (v4) return `${v4[1]}.${v4[2]}.x.x`;
  return ip.split(':').slice(0, 3).join(':') + ':…';
}
