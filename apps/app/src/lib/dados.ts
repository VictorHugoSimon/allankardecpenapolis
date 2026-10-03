import 'server-only';
import { categoryColors } from '@ceak/ui/tokens';
import {
  formatarCentavos,
  formatarHora,
  inicioDoDia,
  mesmoDia,
  partesData,
} from '@ceak/core/format';
import { percentual } from '@ceak/core/regras';
import { prisma } from '@ceak/db';

/** Colunas `@db.Date` chegam como meia-noite UTC; desloca para o meio do dia civil. */
const dataCivil = (d: Date) => new Date(d.getTime() + 12 * 3_600_000);
const dd = (n: number) => String(n).padStart(2, '0');

/** "02/10" */
export function diaMes(d: Date): string {
  const p = partesData(d);
  return `${dd(p.dia)}/${dd(p.mes + 1)}`;
}

/** "Hoje", "Amanhã" ou "Sex 09/10" (rótulo curto de dia, relativo a hoje). */
export function diaRelativo(d: Date, agora = new Date()): string {
  if (mesmoDia(d, agora)) return 'Hoje';
  if (mesmoDia(d, new Date(agora.getTime() + 86_400_000))) return 'Amanhã';
  const p = partesData(d);
  return `${p.diaSemanaCurto} ${diaMes(d)}`;
}

// ─── Agenda ──────────────────────────────────────────────────────────────

export const CATEGORIA_EVENTO = {
  PALESTRA: 'Palestras',
  ESTUDO: 'Estudos',
  CURSO: 'Cursos',
  EVENTO: 'Eventos',
  ASSISTENCIA: 'Assistência',
  CAMPANHA: 'Campanhas',
} as const;

const STATUS_PUBLICOS = ['CONFIRMADO', 'EM_ANDAMENTO', 'ENCERRADO'] as const;
const ondePublico = { publico: true, status: { in: [...STATUS_PUBLICOS] } };

const selectEvento = {
  id: true,
  slug: true,
  tipo: true,
  titulo: true,
  descricao: true,
  inicio: true,
  fim: true,
  local: true,
  responsavel: true,
  status: true,
  transmissaoUrl: true,
  gravacaoUrl: true,
  gravacaoDuracaoMin: true,
  materialUrl: true,
  palestrante: { select: { nome: true } },
} as const;

type EventoDb = Awaited<
  ReturnType<typeof prisma.evento.findFirstOrThrow<{ select: typeof selectEvento }>>
>;

function mapearEvento(e: EventoDb) {
  const categoria = CATEGORIA_EVENTO[e.tipo];
  const p = partesData(e.inicio);
  const fim = e.fim ? partesData(e.fim) : null;
  const hora = formatarHora(e.inicio);
  return {
    id: e.id,
    slug: e.slug,
    tipo: e.tipo,
    categoria,
    cor: categoryColors[categoria],
    titulo: e.tipo === 'PALESTRA' ? `Palestra Pública: ${e.titulo}` : e.titulo,
    tituloCurto: e.titulo,
    descricao: e.descricao ?? '',
    inicio: e.inicio,
    fim: e.fim,
    /** "20:00" ou "08:00 às 12:00" (formato do App). */
    horario:
      fim && e.fim && e.fim.getTime() - e.inicio.getTime() >= 3 * 3_600_000
        ? `${hora} às ${formatarHora(e.fim)}`
        : hora,
    hora,
    dia: dd(p.dia),
    diaSemanaCurto: p.diaSemanaCurto.toUpperCase(),
    local: e.local ?? 'CEAK',
    quem: e.palestrante?.nome ?? e.responsavel ?? 'CEAK',
    status: e.status,
    transmissaoUrl: e.transmissaoUrl,
    gravacaoUrl: e.gravacaoUrl,
    gravacaoDuracaoMin: e.gravacaoDuracaoMin,
    materialUrl: e.materialUrl,
  };
}
export type EventoApp = ReturnType<typeof mapearEvento>;

/** Próximas atividades públicas (a partir de hoje). */
export async function agenda(agora = new Date(), n = 20) {
  const evs = await prisma.evento.findMany({
    where: {
      ...ondePublico,
      status: { in: ['CONFIRMADO', 'EM_ANDAMENTO'] },
      inicio: { gte: inicioDoDia(agora) },
    },
    orderBy: { inicio: 'asc' },
    take: n,
    select: selectEvento,
  });
  return evs.map(mapearEvento);
}

export async function eventoPorSlug(slug: string) {
  const e = await prisma.evento.findFirst({
    where: { slug, ...ondePublico },
    select: selectEvento,
  });
  return e ? mapearEvento(e) : null;
}

/** Palestra de hoje ou a próxima (atalho "Palestra" do App). */
export async function proximaPalestra(agora = new Date()) {
  const e = await prisma.evento.findFirst({
    where: {
      ...ondePublico,
      tipo: 'PALESTRA',
      status: { in: ['CONFIRMADO', 'EM_ANDAMENTO'] },
      inicio: { gte: inicioDoDia(agora) },
    },
    orderBy: { inicio: 'asc' },
    select: selectEvento,
  });
  return e ? mapearEvento(e) : null;
}

export async function palestraAnterior(antesDe: Date) {
  const e = await prisma.evento.findFirst({
    where: { ...ondePublico, tipo: 'PALESTRA', inicio: { lt: inicioDoDia(antesDe) } },
    orderBy: { inicio: 'desc' },
    select: selectEvento,
  });
  return e ? mapearEvento(e) : null;
}

export async function palestrasFuturas(agora = new Date(), n = 3) {
  const evs = await prisma.evento.findMany({
    where: {
      ...ondePublico,
      tipo: 'PALESTRA',
      status: { in: ['CONFIRMADO', 'EM_ANDAMENTO'] },
      inicio: { gte: inicioDoDia(agora) },
    },
    orderBy: { inicio: 'asc' },
    take: n,
    select: selectEvento,
  });
  return evs.map(mapearEvento);
}

export async function gravacoes(n = 4) {
  const evs = await prisma.evento.findMany({
    where: { ...ondePublico, tipo: 'PALESTRA', gravacaoUrl: { not: null } },
    orderBy: { inicio: 'desc' },
    take: n,
    select: selectEvento,
  });
  return evs.map(mapearEvento);
}

// ─── Biblioteca ─────────────────────────────────────────────────────────

export const FILTROS_BIBLIOTECA = {
  Livros: 'LIVRO',
  PDFs: 'PDF',
  Artigos: 'ARTIGO',
  Vídeos: 'VIDEO',
  Áudios: 'AUDIO',
  Palestras: 'PALESTRA',
} as const;

const SELO_TIPO: Record<string, string> = {
  LIVRO: 'LIVRO',
  PDF: 'PDF',
  ARTIGO: 'TXT',
  VIDEO: 'VÍDEO',
  AUDIO: 'ÁUDIO',
  PALESTRA: 'VÍDEO',
};

export async function biblioteca(f: { q?: string; tipo?: string }) {
  const tipo =
    f.tipo && f.tipo in FILTROS_BIBLIOTECA
      ? FILTROS_BIBLIOTECA[f.tipo as keyof typeof FILTROS_BIBLIOTECA]
      : undefined;
  const q = f.q?.trim().slice(0, 80);
  const contem = (campo: string) => ({ [campo]: { contains: q, mode: 'insensitive' as const } });
  const itens = await prisma.itemBiblioteca.findMany({
    where: {
      ...(tipo ? { tipo } : {}),
      ...(q
        ? {
            OR: [
              contem('titulo'),
              contem('autor'),
              contem('tema'),
              contem('curso'),
              { assuntos: { has: q } },
            ],
          }
        : {}),
    },
    orderBy: { criadoEm: 'asc' },
    take: 60,
  });
  return itens.map((i) => ({
    id: i.id,
    titulo: i.titulo,
    autor: i.autor,
    selo: SELO_TIPO[i.tipo] ?? i.tipo,
    url: i.url,
  }));
}

// ─── Campanha, loja ─────────────────────────────────────────────────────

const UNIDADE_META = {
  UN: 'unidades',
  KG: 'kg',
  PECA: 'peças',
  CESTA: 'cestas',
  REAIS: '',
} as const;

export async function campanhaEmDestaque() {
  const c = await prisma.campanha.findFirst({
    where: { status: 'ATIVA', destaque: true },
    orderBy: { fim: 'asc' },
  });
  if (!c) return null;
  const reais = c.unidade === 'REAIS';
  const fim = c.fim ? partesData(dataCivil(c.fim)) : null;
  return {
    id: c.id,
    slug: c.slug,
    titulo: c.titulo,
    arrecadado: reais ? formatarCentavos(c.arrecadado) : c.arrecadado.toLocaleString('pt-BR'),
    meta: reais
      ? formatarCentavos(c.meta)
      : `${c.meta.toLocaleString('pt-BR')} ${UNIDADE_META[c.unidade]}`,
    percentual: percentual(c.arrecadado, c.meta),
    ate: fim ? `${dd(fim.dia)}/${dd(fim.mes + 1)}` : null,
  };
}

export async function campanhaPorTitulo(titulo: string) {
  return prisma.campanha.findFirst({
    where: { status: 'ATIVA', titulo },
    select: { id: true },
  });
}

/** Selos curtos dos cards da loja no App. */
const ORIGEM_CURTA = {
  DOADO: 'Doado',
  FEITO_POR_VOLUNTARIAS: 'Voluntárias',
  LIVRARIA: 'Livraria',
} as const;

export async function produtosDaLoja(n = 6) {
  const ps = await prisma.produto.findMany({
    where: { status: 'ATIVO' },
    orderBy: { criadoEm: 'asc' },
    take: n,
    select: { id: true, slug: true, nome: true, precoCentavos: true, origem: true },
  });
  return ps.map((p) => ({
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    preco: formatarCentavos(p.precoCentavos),
    origem: ORIGEM_CURTA[p.origem],
  }));
}
