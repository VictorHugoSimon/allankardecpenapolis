import { formatarCentavos } from '@ceak/core/format';
import { podeAcessar, type Perfil } from '@ceak/core/rbac';
import { prisma } from '../../client';
import { comRls, type ContextoRls } from '../../rls';
import { dataCurtaHora } from './atividades';

export interface ResultadoBusca {
  grupo: 'Pessoas' | 'Eventos' | 'Lançamentos' | 'Conteúdos';
  titulo: string;
  detalhe: string;
  href: string;
}

/** Busca do topo: só procura nos módulos liberados para o perfil (e sob RLS). */
export async function buscaGlobal(
  ctx: ContextoRls & { perfil: Perfil },
  termo: string,
): Promise<ResultadoBusca[]> {
  const q = termo.trim().slice(0, 80);
  if (q.length < 2) return [];
  const ci = { contains: q, mode: 'insensitive' as const };
  return comRls(ctx, async (tx) => {
    const [pessoas, eventos, lancamentos, conteudos] = await Promise.all([
      podeAcessar(ctx.perfil, 'pessoas')
        ? tx.pessoa.findMany({
            where: { anonimizadaEm: null, OR: [{ nome: ci }, { email: ci }] },
            take: 8,
            orderBy: { nome: 'asc' },
            select: { id: true, nome: true, email: true },
          })
        : [],
      podeAcessar(ctx.perfil, 'agenda') || podeAcessar(ctx.perfil, 'eventos')
        ? tx.evento.findMany({
            where: { titulo: ci },
            take: 8,
            orderBy: { inicio: 'desc' },
            select: { id: true, titulo: true, inicio: true },
          })
        : [],
      podeAcessar(ctx.perfil, 'financeiro')
        ? tx.lancamento.findMany({
            where: {
              OR: [{ contraparte: ci }, { descricao: ci }],
              contraparte: { notIn: ['Fornecedores diversos', 'Receitas consolidadas'] },
            },
            take: 8,
            orderBy: { vencimento: 'desc' },
            select: {
              id: true,
              contraparte: true,
              descricao: true,
              valorCentavos: true,
              tipo: true,
            },
          })
        : [],
      podeAcessar(ctx.perfil, 'conteudo')
        ? prisma.conteudo.findMany({
            where: { titulo: ci },
            take: 8,
            orderBy: { atualizadoEm: 'desc' },
            select: { id: true, titulo: true, fonte: true },
          })
        : [],
    ]);
    return [
      ...pessoas.map((p) => ({
        grupo: 'Pessoas' as const,
        titulo: p.nome,
        detalhe: p.email ?? '',
        href: `/pessoas/${p.id}`,
      })),
      ...eventos.map((e) => ({
        grupo: 'Eventos' as const,
        titulo: e.titulo,
        detalhe: dataCurtaHora(e.inicio),
        href: `/eventos?id=${e.id}`,
      })),
      ...lancamentos.map((l) => ({
        grupo: 'Lançamentos' as const,
        titulo: `${l.contraparte} — ${l.descricao}`,
        detalhe: formatarCentavos(l.valorCentavos),
        href: l.tipo === 'PAGAR' ? '/financeiro/pagar' : '/financeiro/receber',
      })),
      ...conteudos.map((c) => ({
        grupo: 'Conteúdos' as const,
        titulo: c.titulo,
        detalhe: c.fonte,
        href: `/conteudo/${c.id}`,
      })),
    ];
  });
}
