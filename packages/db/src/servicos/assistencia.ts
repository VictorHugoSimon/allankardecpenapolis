import { type WhatsAppProvider } from '@ceak/core/adapters';
import { type Logger } from '@ceak/core/logger';
import { formatarData, formatarHora } from '@ceak/core/format';
import { nomeReservado, type ServicoAjuda } from '@ceak/core/regras';
import { type SolicitacaoAjudaInput } from '@ceak/core/validacao';
import { registrarAuditoria } from '../auditoria';
import { prisma } from '../client';
import { ErroNegocio } from './inscricoes';
import { encontrarOuCriarPessoa } from './pessoas';

export interface VagaDisponivel {
  id: string;
  inicio: Date;
  restantes: number;
}

/** Horários futuros com vagas restantes para o tipo de atendimento. */
export async function listarVagas(
  tipo: ServicoAjuda['tipo'],
  agora = new Date(),
): Promise<VagaDisponivel[]> {
  const vagas = await prisma.vagaAssistencia.findMany({
    where: { ativa: true, inicio: { gt: agora }, OR: [{ tipo: null }, { tipo }] },
    orderBy: { inicio: 'asc' },
    take: 12,
    select: {
      id: true,
      inicio: true,
      vagas: true,
      _count: { select: { solicitacoes: { where: { status: { not: 'CANCELADA' } } } } },
    },
  });
  return vagas
    .map((v) => ({ id: v.id, inicio: v.inicio, restantes: v.vagas - v._count.solicitacoes }))
    .filter((v) => v.restantes > 0);
}

/**
 * Registra a solicitação de atendimento e reserva a vaga (com bloqueio de linha
 * para não vender a mesma vaga duas vezes). O relato vai para a tabela restrita.
 */
export async function solicitarAtendimento(
  servico: ServicoAjuda,
  dados: SolicitacaoAjudaInput,
  deps: { whatsapp: WhatsAppProvider; log: Logger; ip: string | null },
  /** Pedido feito pelo App: vincula à pessoa da sessão (e guarda o WhatsApp, se faltava). */
  opcoes: { pessoaId?: string } = {},
) {
  const resultado = await prisma.$transaction(async (tx) => {
    const [vaga] = await tx.$queryRaw<
      { id: string; inicio: Date; vagas: number; ativa: boolean }[]
    >`
      SELECT id, inicio, vagas, ativa FROM vaga_assistencia WHERE id = ${dados.vagaId}::uuid FOR UPDATE`;
    if (!vaga || !vaga.ativa || vaga.inicio <= new Date()) {
      throw new ErroNegocio(
        'Este horário não está mais disponível. Escolha outra data.',
        'vaga_indisponivel',
      );
    }
    const ocupadas = await tx.solicitacaoAssistencia.count({
      where: { vagaId: vaga.id, status: { not: 'CANCELADA' } },
    });
    if (ocupadas >= vaga.vagas) {
      throw new ErroNegocio(
        'As vagas deste horário acabaram. Escolha outra data.',
        'vaga_esgotada',
      );
    }
    const pessoa = opcoes.pessoaId
      ? { id: opcoes.pessoaId }
      : await encontrarOuCriarPessoa(tx, { nome: dados.nome, whatsapp: dados.whatsapp });
    if (opcoes.pessoaId) {
      await tx.pessoa.updateMany({
        where: { id: opcoes.pessoaId, whatsapp: null },
        data: { whatsapp: dados.whatsapp },
      });
    }
    const sol = await tx.solicitacaoAssistencia.create({
      data: {
        tipo: servico.tipo,
        pessoaId: pessoa.id,
        nomeExibicao: nomeReservado(dados.nome),
        contato: dados.whatsapp,
        data: vaga.inicio,
        vagaId: vaga.id,
        status: 'AGENDADA',
        relato: dados.relato ? { create: { texto: dados.relato } } : undefined,
      },
      select: { id: true },
    });
    // Auditoria sem o conteúdo do relato (dado sensível).
    await registrarAuditoria(tx, {
      usuarioId: null,
      acao: 'solicitou atendimento pelo site',
      entidade: 'SolicitacaoAssistencia',
      entidadeId: sol.id,
      antes: null,
      depois: { tipo: servico.tipo, data: vaga.inicio.toISOString(), comRelato: !!dados.relato },
      ip: deps.ip,
    });
    return { id: sol.id, inicio: vaga.inicio };
  });
  deps.log.info('APLICACAO', `assistencia.solicitada · ${servico.nome}`, {
    rota: '/preciso-de-ajuda',
    status: 201,
  });
  await deps.whatsapp
    .enviar(
      dados.whatsapp,
      `${servico.nome} confirmado para ${formatarData(resultado.inicio)} às ${formatarHora(resultado.inicio)}. Chegue 15 minutos antes e procure a recepção.`,
    )
    .catch(() => undefined);
  return resultado;
}
