import { type Logger } from '@ceak/core/logger';
import { partesData } from '@ceak/core/format';
import { STATUS_LANCAMENTO, STATUS_RECEBER, TRANSICOES_LANCAMENTO } from '@ceak/core/regras';
import { registrarAuditoria } from '../../auditoria';
import { type StatusLancamento, type TipoLancamento } from '../../generated/prisma/enums';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';
import { mes } from './periodo';

const DIA = 86_400_000;
/** Colunas `@db.Date`: meio-dia para não cair no dia anterior em UTC−3. */
const civil = (d: Date) => new Date(d.getTime() + 12 * 3_600_000);
const dataBR = (d: Date) => {
  const p = partesData(civil(d));
  return `${String(p.dia).padStart(2, '0')}/${String(p.mes + 1).padStart(2, '0')}/${p.ano}`;
};

/**
 * Status exibido: conta pendente ou aprovada com vencimento passado aparece como
 * Vencido, sem esperar o job diário.
 */
function statusEfetivo(status: StatusLancamento, vencimento: Date, hoje: Date): StatusLancamento {
  if ((status === 'PENDENTE' || status === 'APROVADO') && civil(vencimento) < hoje)
    return 'VENCIDO';
  return status;
}

/** Dashboard: KPIs do último mês fechado, 6 meses de receita × despesa e composição. */
export async function dashboardFinanceiro(ctx: ContextoRls, agora = new Date()) {
  return comRls(ctx, async (tx) => {
    const ref = mes(agora, -1);
    const seis = mes(agora, -6);
    const pagos = await tx.lancamento.findMany({
      where: { status: 'PAGO', pagoEm: { gte: seis.inicio, lt: ref.fim } },
      select: {
        tipo: true,
        valorCentavos: true,
        pagoEm: true,
        categoria: { select: { nome: true } },
      },
    });
    const meses = Array.from({ length: 6 }, (_, i) => mes(agora, i - 6));
    const serie = meses.map((m) => {
      const doMes = pagos.filter((l) => l.pagoEm! >= m.inicio && l.pagoEm! < m.fim);
      const soma = (t: TipoLancamento) =>
        doMes.filter((l) => l.tipo === t).reduce((a, l) => a + l.valorCentavos, 0);
      return { rotulo: m.curto, receitas: soma('RECEBER'), despesas: soma('PAGAR') };
    });
    const doRef = pagos.filter((l) => l.pagoEm! >= ref.inicio && l.pagoEm! < ref.fim);
    const porCategoria = (t: TipoLancamento) => {
      const m = new Map<string, number>();
      for (const l of doRef.filter((x) => x.tipo === t))
        m.set(l.categoria.nome, (m.get(l.categoria.nome) ?? 0) + l.valorCentavos);
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nome, valor]) => ({ nome, valor }));
    };
    const ultimo = serie[serie.length - 1]!;
    const receitasPorOrigem = porCategoria('RECEBER');
    const v = (nome: string) => receitasPorOrigem.find((r) => r.nome === nome)?.valor ?? 0;
    return {
      mes: ref.rotulo,
      periodo: `${meses[0]!.curto}–${ref.curto}`,
      kpis: {
        receitas: ultimo.receitas,
        despesas: ultimo.despesas,
        saldo: ultimo.receitas - ultimo.despesas,
        doacoes: v('Doações'),
        loja: v('Loja'),
      },
      serie,
      receitasPorOrigem,
      despesasPorCategoria: porCategoria('PAGAR'),
    };
  });
}

/** Contas a pagar ou a receber do mês (por vencimento), com totais. */
export async function contas(
  ctx: ContextoRls,
  tipo: TipoLancamento,
  ref: Date,
  agora = new Date(),
) {
  const m = mes(ref);
  const hoje = new Date(agora.getTime() - (agora.getTime() % DIA));
  return comRls(ctx, async (tx) => {
    const ls = await tx.lancamento.findMany({
      where: {
        tipo,
        OR: [
          { vencimento: { gte: m.inicio, lt: m.fim } },
          // Vencidas de meses anteriores continuam na lista até serem pagas.
          { vencimento: { lt: m.inicio }, status: { in: ['PENDENTE', 'APROVADO', 'VENCIDO'] } },
        ],
        // Consolidados mensais do histórico não aparecem como contas.
        contraparte: { notIn: ['Fornecedores diversos', 'Receitas consolidadas'] },
      },
      orderBy: [{ vencimento: 'asc' }, { criadoEm: 'asc' }],
      select: {
        id: true,
        contraparte: true,
        descricao: true,
        valorCentavos: true,
        vencimento: true,
        status: true,
        responsavel: true,
        categoria: { select: { nome: true } },
        centroCusto: { select: { nome: true } },
      },
    });
    const rotulos = tipo === 'RECEBER' ? STATUS_RECEBER : STATUS_LANCAMENTO;
    const linhas = ls.map((l) => {
      const st = statusEfetivo(l.status, l.vencimento, hoje);
      const [rotulo, tom] = rotulos[st] ?? [st, 'neutral'];
      return {
        id: l.id,
        contraparte: l.contraparte,
        descricao: l.descricao,
        categoria: l.categoria.nome,
        centroCusto: l.centroCusto?.nome ?? '—',
        vencimento: dataBR(l.vencimento),
        valorCentavos: l.valorCentavos,
        status: st,
        rotulo,
        tom,
        responsavel: l.responsavel ?? '—',
        acoes: TRANSICOES_LANCAMENTO[st] ?? [],
      };
    });
    return {
      mes: `${m.rotulo.charAt(0).toUpperCase()}${m.rotulo.slice(1)} de ${partesData(new Date(m.inicio.getTime() + DIA)).ano}`,
      total: linhas
        .filter((l) => l.status !== 'CANCELADO')
        .reduce((a, l) => a + l.valorCentavos, 0),
      linhas,
    };
  });
}

export async function opcoesLancamento(ctx: ContextoRls) {
  return comRls(ctx, async (tx) => {
    const [categorias, centros] = await Promise.all([
      tx.categoriaFinanceira.findMany({
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true, tipo: true },
      }),
      tx.centroCusto.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
    ]);
    return { categorias, centros };
  });
}

export interface NovoLancamento {
  tipo: TipoLancamento;
  contraparte: string;
  descricao: string;
  categoriaId: string;
  centroCustoId?: string;
  valorCentavos: number;
  vencimento: Date;
}

/** Lança uma conta (sempre Pendente: o pagamento precisa de aprovação). */
export async function criarLancamento(
  ctx: ContextoRls & { usuarioId: string },
  dados: NovoLancamento,
  autor: { nome: string; ip: string | null },
  deps: { log: Logger },
) {
  const l = await comRls(ctx, async (tx) => {
    const cat = await tx.categoriaFinanceira.findUnique({
      where: { id: dados.categoriaId },
      select: { tipo: true },
    });
    if (!cat || cat.tipo !== dados.tipo)
      throw new ErroNegocio('Escolha uma categoria válida.', 'categoria');
    const novo = await tx.lancamento.create({
      data: { ...dados, status: 'PENDENTE', responsavel: autor.nome },
      select: {
        id: true,
        contraparte: true,
        descricao: true,
        valorCentavos: true,
        vencimento: true,
        tipo: true,
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'criou lançamento',
      entidade: 'Lancamento',
      entidadeId: novo.id,
      antes: null,
      depois: {
        tipo: novo.tipo,
        contraparte: novo.contraparte,
        valorCentavos: novo.valorCentavos,
        vencimento: dataBR(novo.vencimento),
        status: 'PENDENTE',
      },
      ip: autor.ip,
    });
    if (dados.tipo === 'PAGAR') {
      await tx.aprovacao.create({
        data: {
          tipo: 'FINANCEIRO',
          titulo: `Pagamento ${novo.contraparte} — ${novo.descricao} · ${(novo.valorCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
          detalhe: `Vence ${dataBR(novo.vencimento).slice(0, 5)} · lançado por ${autor.nome}`,
          entidade: 'Lancamento',
          entidadeId: novo.id,
          solicitanteId: ctx.usuarioId,
        },
      });
    }
    return novo;
  });
  deps.log.info('FINANCEIRO', `lancamento.criado · ${l.tipo} · ${l.contraparte}`, {
    rota: '/financeiro',
    status: 201,
  });
  return l;
}

/** Muda o status de uma conta seguindo as transições permitidas (com auditoria). */
export async function mudarStatusLancamento(
  ctx: ContextoRls & { usuarioId: string },
  id: string,
  novo: StatusLancamento,
  autor: { ip: string | null },
  deps: { log: Logger },
  agora = new Date(),
) {
  const hoje = new Date(agora.getTime() - (agora.getTime() % DIA));
  await comRls(ctx, async (tx) => {
    const l = await tx.lancamento.findUnique({
      where: { id },
      select: { status: true, vencimento: true, contraparte: true },
    });
    if (!l) throw new ErroNegocio('Lançamento não encontrado.', 'nao_encontrado');
    const atual = statusEfetivo(l.status, l.vencimento, hoje);
    if (!(TRANSICOES_LANCAMENTO[atual] ?? []).includes(novo)) {
      throw new ErroNegocio('Esta mudança de status não é permitida.', 'transicao');
    }
    await tx.lancamento.update({
      where: { id },
      data: { status: novo, pagoEm: novo === 'PAGO' ? agora : undefined },
    });
    // Aprovar ou cancelar pelo financeiro resolve a pendência da Central de aprovações.
    if (novo === 'APROVADO' || novo === 'CANCELADO') {
      await tx.aprovacao.updateMany({
        where: { entidade: 'Lancamento', entidadeId: id, decisao: 'PENDENTE' },
        data: {
          decisao: novo === 'APROVADO' ? 'APROVADO' : 'REJEITADO',
          responsavelId: ctx.usuarioId,
          decididoEm: agora,
        },
      });
    }
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: `alterou status do lançamento`,
      entidade: 'Lancamento',
      entidadeId: id,
      antes: { status: l.status },
      depois: { status: novo },
      ip: autor.ip,
    });
    deps.log.info('FINANCEIRO', `lancamento.${novo.toLowerCase()} · ${l.contraparte}`, {
      rota: '/financeiro',
      status: 200,
    });
  });
}
