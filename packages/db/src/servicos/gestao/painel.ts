import { formatarCentavos } from '@ceak/core/format';
import { podeAcessar, type Modulo, type Perfil } from '@ceak/core/rbac';
import { prisma } from '../../client';
import { comRls, type ContextoRls } from '../../rls';
import { mes } from './periodo';

const PERFIS_MEMBRO = [
  'MEMBRO',
  'VOLUNTARIO',
  'INSTRUTOR',
  'COORDENADOR',
  'SECRETARIA',
  'TESOURARIA',
  'DIRETORIA',
  'ADMINISTRADOR',
] as const;

const DIA = 86_400_000;

export interface Alerta {
  titulo: string;
  detalhe: string;
  tom: 'err' | 'warn' | 'ok';
  href: string;
  modulo: Modulo;
}

/** Alertas da Central (filtrados pelos módulos do perfil). */
export async function alertasDoPainel(perfil: Perfil, agora = new Date()): Promise<Alerta[]> {
  const hoje = new Date(agora.getTime() - (agora.getTime() % DIA));
  const [vencidos, estoque, integracoes, conteudos] = await Promise.all([
    prisma.lancamento.findMany({
      where: {
        tipo: 'PAGAR',
        OR: [
          { status: 'VENCIDO' },
          { status: { in: ['PENDENTE', 'APROVADO'] }, vencimento: { lt: hoje } },
        ],
      },
      orderBy: { vencimento: 'asc' },
      select: { contraparte: true, valorCentavos: true, vencimento: true },
    }),
    prisma.$queryRaw<{ nome: string; saldo: string; minimo: string; unidade: string }[]>`
      SELECT nome, saldo::text, minimo::text, unidade::text FROM item_estoque
      WHERE minimo IS NOT NULL AND saldo < minimo ORDER BY saldo / NULLIF(minimo, 0) LIMIT 3`,
    prisma.integracao.findMany({
      where: { status: { in: ['ATENCAO', 'ERRO'] } },
      select: { nome: true, descricao: true, status: true, ultimoErro: true },
    }),
    prisma.aprovacao.count({ where: { decisao: 'PENDENTE', tipo: 'CONTEUDO' } }),
  ]);
  const un = (u: string) =>
    ({ KG: 'kg', UN: 'un.', PECA: 'peças', CESTA: 'cestas', REAIS: '' })[u] ?? '';
  const n = (v: string) => Number(v).toLocaleString('pt-BR');
  const alertas: Alerta[] = [];
  const v = vencidos[0];
  if (v) {
    const dd = new Date(v.vencimento.getTime() + 12 * 3_600_000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    alertas.push({
      titulo: vencidos.length > 1 ? `${vencidos.length} pagamentos vencidos` : 'Pagamento vencido',
      detalhe: `${v.contraparte} · ${formatarCentavos(v.valorCentavos)} · venceu ${dd}`,
      tom: 'err',
      href: '/financeiro/pagar',
      modulo: 'financeiro',
    });
  }
  for (const e of estoque.slice(0, 1)) {
    alertas.push({
      titulo: 'Estoque baixo',
      detalhe: `${e.nome} · ${n(e.saldo)} ${un(e.unidade)} (mínimo ${n(e.minimo)} ${un(e.unidade)})`,
      tom: 'warn',
      href: '/estoque',
      modulo: 'estoque',
    });
  }
  for (const i of integracoes) {
    alertas.push({
      titulo: i.nome,
      detalhe: i.ultimoErro ? 'Token expirado · publicações pausadas' : i.descricao,
      tom: i.status === 'ERRO' ? 'err' : 'warn',
      href: '/integracoes',
      modulo: 'integracoes',
    });
  }
  if (conteudos) {
    alertas.push({
      titulo: 'Conteúdos aguardando aprovação',
      detalhe: `${conteudos} ${conteudos === 1 ? 'item' : 'itens'}`,
      tom: 'ok',
      href: '/aprovacoes?tipo=CONTEUDO',
      modulo: 'aprovacoes',
    });
  }
  return alertas.filter((a) => podeAcessar(perfil, a.modulo));
}

/** Indicadores do Command Center. */
export async function painelGeral(ctx: ContextoRls & { perfil: Perfil }, agora = new Date()) {
  const m = mes(agora);
  const anterior = mes(agora, -1);
  const trinta = new Date(agora.getTime() - 30 * DIA);
  const sessenta = new Date(agora.getTime() - 60 * DIA);
  const noventa = new Date(agora.getTime() - 90 * DIA);
  const semanas = 12;
  const inicioSemanas = new Date(agora.getTime() - semanas * 7 * DIA);
  const ativo = { anonimizadaEm: null };

  const [
    pessoas,
    pessoasNoMes,
    membros,
    membrosNoMes,
    visitantes,
    checkins30,
    eventosMes,
    alunos,
    turmasAtivas,
    voluntarios,
    areas,
    checkinsSemana,
    avaliacoes,
    retorno,
    aprovacoesPorTipo,
    integracoes,
  ] = await Promise.all([
    prisma.pessoa.count({ where: ativo }),
    prisma.pessoa.count({ where: { ...ativo, criadoEm: { gte: m.inicio } } }),
    prisma.pessoa.count({
      where: { ...ativo, status: 'ATIVO', perfil: { in: [...PERFIS_MEMBRO] } },
    }),
    prisma.pessoa.count({ where: { ...ativo, membroDesde: { gte: m.inicio } } }),
    prisma.pessoa.count({
      where: {
        ...ativo,
        perfil: 'VISITANTE',
        OR: [{ criadoEm: { gte: trinta } }, { checkins: { some: { criadoEm: { gte: trinta } } } }],
      },
    }),
    prisma.checkin.count({ where: { criadoEm: { gte: trinta } } }),
    prisma.evento.count({
      where: { publico: true, inicio: { gte: m.inicio, lt: m.fim }, status: { not: 'CANCELADO' } },
    }),
    prisma.matricula.findMany({
      where: { status: { in: ['ATIVA', 'EM_RISCO'] } },
      distinct: ['pessoaId'],
      select: { pessoaId: true },
    }),
    prisma.turma.count({ where: { status: { not: 'ENCERRADA' } } }),
    prisma.voluntario.count({ where: { ativo: true } }),
    prisma.area.count(),
    prisma.$queryRaw<{ semana: number; n: number }[]>`
      SELECT floor(extract(epoch FROM (${agora}::timestamptz - criado_em)) / 604800)::int AS semana,
             count(*)::int AS n
      FROM checkin WHERE criado_em >= ${inicioSemanas} GROUP BY 1`,
    prisma.avaliacao.findMany({
      where: { criadoEm: { gte: noventa } },
      select: { nps: true, conteudo: true, clareza: true, aplicabilidade: true },
    }),
    prisma.$queryRaw<{ base: number; voltaram: number }[]>`
      SELECT count(*)::int AS base,
             count(*) FILTER (WHERE EXISTS (
               SELECT 1 FROM checkin c2 WHERE c2.pessoa_id = a.pessoa_id AND c2.criado_em >= ${trinta}
             ))::int AS voltaram
      FROM (SELECT DISTINCT pessoa_id FROM checkin
            WHERE criado_em >= ${sessenta} AND criado_em < ${trinta}) a`,
    prisma.aprovacao.groupBy({ by: ['tipo'], where: { decisao: 'PENDENTE' }, _count: true }),
    prisma.integracao.findMany({ orderBy: { nome: 'asc' }, select: { nome: true, status: true } }),
  ]);

  const porSemana = Array.from({ length: semanas }, (_, i) => {
    const s = semanas - 1 - i;
    return checkinsSemana.find((x) => x.semana === s)?.n ?? 0;
  });
  const promotores = avaliacoes.filter((a) => a.nps >= 9).length;
  const detratores = avaliacoes.filter((a) => a.nps <= 6).length;
  const nps = avaliacoes.length
    ? Math.round(((promotores - detratores) / avaliacoes.length) * 100)
    : null;
  const notas = avaliacoes.flatMap((a) =>
    [a.conteudo, a.clareza, a.aplicabilidade].filter((x): x is number => x != null),
  );
  const mediaNotas = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  const pessoasComCheckin = await prisma.checkin.findMany({
    where: { criadoEm: { gte: trinta } },
    distinct: ['pessoaId'],
    select: { pessoaId: true },
  });
  const r = retorno[0];

  const financeiro = podeAcessar(ctx.perfil, 'financeiro')
    ? await comRls(ctx, async (tx) => {
        const somas = await tx.lancamento.groupBy({
          by: ['tipo'],
          where: { status: 'PAGO', pagoEm: { gte: anterior.inicio, lt: anterior.fim } },
          _sum: { valorCentavos: true },
        });
        const v = (t: 'PAGAR' | 'RECEBER') =>
          somas.find((s) => s.tipo === t)?._sum.valorCentavos ?? 0;
        return { mes: anterior.rotulo, receitas: v('RECEBER'), despesas: v('PAGAR') };
      })
    : null;

  const ROTULO_APROVACAO = {
    CONTEUDO: 'Conteúdo',
    FINANCEIRO: 'Financeiro',
    CAMPANHA: 'Campanhas',
    COMUNICACAO: 'Comunicações',
    PRODUTO: 'Produtos',
    IA: 'IA',
    EVENTO: 'Eventos',
  } as const;

  return {
    kpis: {
      pessoas,
      pessoasNoMes,
      membros,
      membrosNoMes,
      visitantes,
      checkins30,
      eventosMes,
      alunos: alunos.length,
      turmasAtivas,
      voluntarios,
      areas,
    },
    engajamento: {
      porSemana,
      taxaRetorno: r && r.base ? Math.round((r.voltaram / r.base) * 100) : null,
      frequenciaMedia: pessoasComCheckin.length ? checkins30 / pessoasComCheckin.length : null,
      nps,
      mediaNotas,
    },
    financeiro,
    aprovacoes: (Object.keys(ROTULO_APROVACAO) as (keyof typeof ROTULO_APROVACAO)[])
      .filter((t) => t !== 'EVENTO')
      .map((t) => ({
        tipo: t,
        rotulo: ROTULO_APROVACAO[t],
        total: aprovacoesPorTipo.find((a) => a.tipo === t)?._count ?? 0,
      })),
    saude: [
      { nome: 'Website', ok: true },
      { nome: 'App', ok: true },
      { nome: 'Banco', ok: true },
      ...integracoes.map((i) => ({ nome: i.nome, ok: i.status === 'CONECTADO' })),
    ],
  };
}

/** Quadros menores do painel (Loja, Conteúdo, Automações), conforme o perfil. */
export async function quadrosDoPainel(perfil: Perfil, agora = new Date()) {
  const m = mes(agora, -1);
  const inicioDia = new Date(agora.getTime() - 24 * 3_600_000);
  const [loja, conteudo, automacoes] = await Promise.all([
    podeAcessar(perfil, 'loja')
      ? Promise.all([
          prisma.produto.count({ where: { status: 'ATIVO' } }),
          prisma.pedido.aggregate({
            where: { pagoEm: { gte: m.inicio, lt: m.fim } },
            _count: true,
            _sum: { totalCentavos: true },
          }),
        ]).then(([ativos, p]) => ({
          mes: m.rotulo,
          produtosAtivos: ativos,
          pedidos: p._count,
          vendas: p._sum.totalCentavos ?? 0,
          ticket: p._count ? Math.round((p._sum.totalCentavos ?? 0) / p._count) : 0,
        }))
      : null,
    podeAcessar(perfil, 'conteudo')
      ? prisma.conteudo.groupBy({ by: ['status'], _count: true }).then((g) => {
          const n = (...s: string[]) =>
            g.filter((x) => s.includes(x.status)).reduce((a, x) => a + x._count, 0);
          return {
            publicados: n('PUBLICADO'),
            aguardando: n('REVISAO', 'RASCUNHO_IA'),
            agendados: n('AGENDADO', 'APROVADO'),
            falhas: n('ERRO'),
          };
        })
      : null,
    podeAcessar(perfil, 'automacoes')
      ? prisma.execucao
          .groupBy({ by: ['status'], where: { iniciadaEm: { gte: inicioDia } }, _count: true })
          .then((g) => {
            const n = (s: string) => g.find((x) => x.status === s)?._count ?? 0;
            const total = g.reduce((a, x) => a + x._count, 0);
            return {
              execucoes: total,
              sucesso: total ? Math.round((n('SUCESSO') / total) * 1000) / 10 : null,
              falhas: n('FALHA'),
            };
          })
      : null,
  ]);
  return { loja, conteudo, automacoes };
}
