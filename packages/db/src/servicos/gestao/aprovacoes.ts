import { type Logger } from '@ceak/core/logger';
import { partesData } from '@ceak/core/format';
import { podeAcessar, type Modulo, type Perfil } from '@ceak/core/rbac';
import { TIPO_APROVACAO_LABEL } from '@ceak/core/regras';
import { registrarAuditoria } from '../../auditoria';
import { prisma } from '../../client';
import { type TipoAprovacao } from '../../generated/prisma/enums';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';
import { decidirConteudo } from './conteudo';

/** Módulo necessário para decidir cada tipo de aprovação. */
const MODULO_DO_TIPO: Record<TipoAprovacao, Modulo> = {
  CONTEUDO: 'conteudo',
  FINANCEIRO: 'financeiro',
  CAMPANHA: 'doacoes',
  COMUNICACAO: 'comunicacao',
  PRODUTO: 'loja',
  IA: 'ia',
  EVENTO: 'eventos',
};

export const TIPOS_APROVACAO = Object.keys(TIPO_APROVACAO_LABEL).filter(
  (t) => t !== 'EVENTO',
) as TipoAprovacao[];

export function podeDecidir(perfil: Perfil, tipo: TipoAprovacao): boolean {
  return podeAcessar(perfil, 'aprovacoes') && podeAcessar(perfil, MODULO_DO_TIPO[tipo]);
}

const LINK_EDITAR: Partial<Record<TipoAprovacao, (entidadeId: string) => string>> = {
  CONTEUDO: (id) => `/conteudo/${id}`,
  FINANCEIRO: () => '/financeiro/pagar',
};

/** Contadores por tipo e lista de pendências (só os tipos que o perfil pode decidir). */
export async function centralAprovacoes(perfil: Perfil, tipo?: string) {
  const tipos = TIPOS_APROVACAO.filter((t) => podeDecidir(perfil, t));
  const filtro = tipos.includes(tipo as TipoAprovacao) ? (tipo as TipoAprovacao) : undefined;
  const [grupos, pendentes] = await Promise.all([
    prisma.aprovacao.groupBy({
      by: ['tipo'],
      where: { decisao: 'PENDENTE', tipo: { in: tipos } },
      _count: true,
    }),
    prisma.aprovacao.findMany({
      where: { decisao: 'PENDENTE', tipo: filtro ?? { in: tipos } },
      orderBy: { criadoEm: 'asc' },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        detalhe: true,
        entidadeId: true,
        criadoEm: true,
      },
    }),
  ]);
  return {
    filtro: filtro ?? null,
    contadores: tipos.map((t) => ({
      tipo: t,
      rotulo: TIPO_APROVACAO_LABEL[t],
      total: grupos.find((g) => g.tipo === t)?._count ?? 0,
    })),
    pendentes: pendentes.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      rotulo: TIPO_APROVACAO_LABEL[a.tipo],
      titulo: a.titulo,
      detalhe: a.detalhe ?? '',
      editar: LINK_EDITAR[a.tipo]?.(a.entidadeId) ?? null,
    })),
  };
}

export async function totalPendentes(perfil: Perfil) {
  const tipos = TIPOS_APROVACAO.filter((t) => podeDecidir(perfil, t));
  return tipos.length
    ? prisma.aprovacao.count({ where: { decisao: 'PENDENTE', tipo: { in: tipos } } })
    : 0;
}

/**
 * Decide uma aprovação. Cada decisão gera auditoria; conteúdo e financeiro
 * também mudam o status do item aprovado (na mesma transação).
 */
export async function decidirAprovacao(
  ctx: ContextoRls & { perfil: Perfil; usuarioId: string },
  id: string,
  decisao: 'APROVADO' | 'REJEITADO',
  opcoes: { comentario?: string; ip: string | null },
  deps: { log: Logger },
) {
  const a = await prisma.aprovacao.findUnique({ where: { id } });
  if (!a || a.decisao !== 'PENDENTE')
    throw new ErroNegocio('Esta aprovação já foi decidida.', 'decidida');
  if (!podeDecidir(ctx.perfil, a.tipo)) {
    deps.log.warn('SEGURANCA', `aprovacao.negada · ${a.tipo}`, {
      rota: '/aprovacoes',
      status: 403,
    });
    throw new ErroNegocio('Seu perfil não pode decidir este tipo de aprovação.', 'sem_permissao');
  }
  const autor = { usuarioId: ctx.usuarioId, ip: opcoes.ip, comentario: opcoes.comentario };
  if (a.tipo === 'CONTEUDO' && a.conteudoId) {
    await prisma.$transaction((tx) => decidirConteudo(tx, a.conteudoId!, decisao, autor));
  } else if (a.tipo === 'FINANCEIRO' && a.entidade === 'Lancamento') {
    // Lançamentos ficam sob RLS do financeiro.
    await comRls(ctx, async (tx) => {
      const l = await tx.lancamento.findUnique({
        where: { id: a.entidadeId },
        select: { status: true },
      });
      if (l && decisao === 'APROVADO' && ['PENDENTE', 'VENCIDO'].includes(l.status)) {
        await tx.lancamento.update({ where: { id: a.entidadeId }, data: { status: 'APROVADO' } });
      }
      if (l && decisao === 'REJEITADO' && l.status === 'PENDENTE') {
        await tx.lancamento.update({ where: { id: a.entidadeId }, data: { status: 'CANCELADO' } });
      }
      await tx.aprovacao.update({
        where: { id },
        data: {
          decisao,
          responsavelId: ctx.usuarioId,
          decididoEm: new Date(),
          comentario: opcoes.comentario,
        },
      });
      await registrarAuditoria(tx, {
        usuarioId: ctx.usuarioId,
        acao: decisao === 'APROVADO' ? 'aprovou lançamento' : 'rejeitou lançamento',
        entidade: 'Lancamento',
        entidadeId: a.entidadeId,
        antes: { status: l?.status ?? null },
        depois: {
          status: l
            ? decisao === 'APROVADO'
              ? 'APROVADO'
              : l.status === 'PENDENTE'
                ? 'CANCELADO'
                : l.status
            : null,
        },
        ip: opcoes.ip,
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.aprovacao.update({
        where: { id },
        data: {
          decisao,
          responsavelId: ctx.usuarioId,
          decididoEm: new Date(),
          comentario: opcoes.comentario,
        },
      });
      await registrarAuditoria(tx, {
        usuarioId: ctx.usuarioId,
        acao: decisao === 'APROVADO' ? 'aprovou item' : 'rejeitou item',
        entidade: 'Aprovacao',
        entidadeId: id,
        antes: { decisao: 'PENDENTE', titulo: a.titulo },
        depois: { decisao },
        ip: opcoes.ip,
      });
    });
  }
  if (decisao === 'REJEITADO' && a.solicitanteId) {
    const autorPessoa = await prisma.usuario.findUnique({
      where: { id: a.solicitanteId },
      select: { pessoaId: true },
    });
    if (autorPessoa) {
      await prisma.notificacao.create({
        data: {
          pessoaId: autorPessoa.pessoaId,
          categoria: 'Aprovações',
          titulo: 'Item devolvido para ajustes',
          corpo: `${a.titulo}${opcoes.comentario ? ` · ${opcoes.comentario}` : ''}`,
        },
      });
    }
  }
  deps.log.info(
    'AUDITORIA',
    `aprovacao.${decisao.toLowerCase()} · ${TIPO_APROVACAO_LABEL[a.tipo]}`,
    {
      rota: '/aprovacoes',
      status: 200,
    },
  );
  return { tipo: a.tipo };
}

/** Histórico de decisões (para a trilha no Editor e na Central). */
export async function ultimasDecisoes(n = 5) {
  const ds = await prisma.aprovacao.findMany({
    where: { decisao: { not: 'PENDENTE' } },
    orderBy: { decididoEm: 'desc' },
    take: n,
    select: {
      titulo: true,
      decisao: true,
      decididoEm: true,
      responsavel: { select: { pessoa: { select: { nome: true } } } },
    },
  });
  return ds.map((d) => ({
    titulo: d.titulo,
    decisao: d.decisao === 'APROVADO' ? 'Aprovado' : 'Rejeitado',
    por: d.responsavel?.pessoa.nome ?? '—',
    quando: d.decididoEm ? partesData(d.decididoEm) : null,
  }));
}
