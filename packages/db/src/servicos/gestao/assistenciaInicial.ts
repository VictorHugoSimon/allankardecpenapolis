import { registrarAuditoria } from '../../auditoria';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';

type ContextoEquipe = ContextoRls & { usuarioId: string };
export type EtapaAssistencia = 'PENDENTE' | 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA';

export function podeGerirAssistencia(ctx: ContextoRls): boolean {
  return ctx.perfil === 'ADMINISTRADOR' || ctx.perfil === 'DIRETORIA' ||
    (ctx.perfil === 'COORDENADOR' && ctx.coordAssistencia === true);
}

/** Fluxo supervisionado. Nunca reabre um atendimento encerrado automaticamente. */
export function conferirTransicaoAssistencia(atual: EtapaAssistencia, destino: EtapaAssistencia) {
  const permitidas: Record<EtapaAssistencia, EtapaAssistencia[]> = {
    PENDENTE: ['AGENDADA', 'CANCELADA'],
    AGENDADA: ['CONCLUIDA', 'CANCELADA'],
    CONCLUIDA: [],
    CANCELADA: [],
  };
  if (!permitidas[atual]?.includes(destino))
    throw new ErroNegocio('Mudança de situação não permitida para esta solicitação.', 'transicao');
}

/** Não consulta tabela de relatos nem retorna telefone, e-mail ou nome completo. */
export async function painelAssistenciaInicial(ctx: ContextoRls) {
  if (!podeGerirAssistencia(ctx)) {
    return { permitido: false as const, total: 0, pendentes: 0, agendadas: 0, linhas: [] };
  }
  return comRls(ctx, async tx => {
    const [pendentes, agendadas, recentes] = await Promise.all([
      tx.solicitacaoAssistencia.count({ where: { status: 'PENDENTE' } }),
      tx.solicitacaoAssistencia.count({ where: { status: 'AGENDADA' } }),
      tx.solicitacaoAssistencia.findMany({
        orderBy: { criadoEm: 'desc' }, take: 100,
        select: { id: true, tipo: true, nomeExibicao: true, data: true, status: true, criadoEm: true },
      }),
    ]);
    return { permitido: true as const, total: pendentes + agendadas, pendentes, agendadas, linhas: recentes };
  });
}

export async function alterarSituacaoAssistencia(
  ctx: ContextoEquipe,
  id: string,
  destino: EtapaAssistencia,
  ip: string | null,
) {
  if (!podeGerirAssistencia(ctx)) throw new ErroNegocio('Sem permissão para alterar solicitações.', 'sem_permissao');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ErroNegocio('Identificador inválido.', 'identificador');
  return comRls(ctx, async tx => {
    const atual = await tx.solicitacaoAssistencia.findUnique({
      where: { id }, select: { id: true, status: true, data: true },
    });
    if (!atual) throw new ErroNegocio('Solicitação não encontrada.', 'nao_encontrada');
    conferirTransicaoAssistencia(atual.status, destino);
    // Não permite marcar como agendado sem uma data existente.
    if (destino === 'AGENDADA' && !atual.data)
      throw new ErroNegocio('Defina uma data de atendimento antes de agendar.', 'sem_data');
    const gravado = await tx.solicitacaoAssistencia.updateMany({
      where: { id, status: atual.status },
      data: { status: destino },
    });
    if (gravado.count !== 1) throw new ErroNegocio('Solicitação alterada por outra pessoa. Atualize a página.', 'concorrencia');
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId, acao: 'alterou situação de solicitação de assistência',
      entidade: 'SolicitacaoAssistencia', entidadeId: id,
      antes: { status: atual.status }, depois: { status: destino }, ip,
    });
    return { status: destino };
  });
}
