import 'server-only';
import { categoryColors } from '@ceak/ui/tokens';
import { formatarCentavos, formatarHorario, inicioDoDia, partesData } from '@ceak/core/format';
import {
  ESTADO_PRODUTO_LABEL,
  ORIGEM_PRODUTO_LABEL,
  percentual,
  rotuloDisponibilidade,
} from '@ceak/core/regras';
import { prisma } from '@ceak/db';
import { urlEvento } from './urls';

/**
 * Consultas do site público. Só expõem dados públicos: eventos aprovados,
 * conteúdos PUBLICADOS (aprovação humana obrigatória), produtos ativos e
 * a prestação de contas aprovada pela diretoria.
 */

/** Colunas `@db.Date` chegam como meia-noite UTC; desloca para o meio do dia civil. */
const dataCivil = (d: Date) => new Date(d.getTime() + 12 * 3_600_000);

// ─── Agenda ──────────────────────────────────────────────────────────────

export const CATEGORIA_EVENTO = {
  PALESTRA: 'Palestras',
  ESTUDO: 'Estudos',
  CURSO: 'Cursos',
  EVENTO: 'Eventos',
  ASSISTENCIA: 'Assistência',
  CAMPANHA: 'Campanhas',
} as const;
export type TipoEventoSite = keyof typeof CATEGORIA_EVENTO;
export type CategoriaEvento = (typeof CATEGORIA_EVENTO)[TipoEventoSite];

export const FILTROS_AGENDA = [
  'Todos',
  'Palestras',
  'Estudos',
  'Cursos',
  'Eventos',
  'Assistência',
  'Campanhas',
] as const;

/** "Estudos" inclui os cursos (como no protótipo). */
const TIPOS_DO_FILTRO: Record<string, TipoEventoSite[]> = {
  Palestras: ['PALESTRA'],
  Estudos: ['ESTUDO', 'CURSO'],
  Cursos: ['CURSO'],
  Eventos: ['EVENTO'],
  Assistência: ['ASSISTENCIA'],
  Campanhas: ['CAMPANHA'],
};

const STATUS_PUBLICOS = ['CONFIRMADO', 'EM_ANDAMENTO', 'ENCERRADO'] as const;

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
  inscricaoAberta: true,
  palestrante: { select: { nome: true } },
} as const;

type EventoDb = Awaited<
  ReturnType<typeof prisma.evento.findFirstOrThrow<{ select: typeof selectEvento }>>
>;

export function mapearEvento(e: EventoDb) {
  const categoria = CATEGORIA_EVENTO[e.tipo];
  const p = partesData(e.inicio);
  return {
    id: e.id,
    slug: e.slug,
    tipo: e.tipo,
    categoria,
    cor: categoryColors[categoria],
    /** Título de exibição em listas ("Palestra Pública: …"). */
    titulo: e.tipo === 'PALESTRA' ? `Palestra Pública: ${e.titulo}` : e.titulo,
    tituloCurto: e.titulo,
    descricao: e.descricao ?? '',
    inicio: e.inicio,
    fim: e.fim,
    horario: formatarHorario(e.inicio, e.fim),
    dia: p.dia,
    diaSemana: p.diaSemana,
    diaSemanaCurto: p.diaSemanaCurto,
    mesCurto: p.mesCurto,
    mesLongo: p.mesLongo,
    /** "30/09" */
    dataNumerica: `${String(p.dia).padStart(2, '0')}/${String(p.mes + 1).padStart(2, '0')}`,
    local: e.local ?? 'CEAK',
    quem: e.palestrante?.nome ?? e.responsavel ?? 'CEAK',
    status: e.status,
    transmissaoUrl: e.transmissaoUrl,
    gravacaoUrl: e.gravacaoUrl,
    gravacaoDuracaoMin: e.gravacaoDuracaoMin,
    materialUrl: e.materialUrl,
    inscricaoAberta: e.inscricaoAberta && e.status !== 'ENCERRADO',
    url: urlEvento(e),
  };
}
export type EventoSite = ReturnType<typeof mapearEvento>;

const ondePublico = { publico: true, status: { in: [...STATUS_PUBLICOS] } };

export async function eventosDoMes(ano: number, mes: number, filtro: string = 'Todos') {
  const inicio = new Date(`${ano}-${String(mes + 1).padStart(2, '0')}-01T00:00:00-03:00`);
  const fim = new Date(
    `${mes === 11 ? ano + 1 : ano}-${String(((mes + 1) % 12) + 1).padStart(2, '0')}-01T00:00:00-03:00`,
  );
  const tipos = TIPOS_DO_FILTRO[filtro];
  const evs = await prisma.evento.findMany({
    where: {
      ...ondePublico,
      inicio: { gte: inicio, lt: fim },
      ...(tipos ? { tipo: { in: tipos } } : {}),
    },
    orderBy: { inicio: 'asc' },
    select: selectEvento,
  });
  return evs.map(mapearEvento);
}

export async function proximasAtividades(n = 4, agora = new Date()) {
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

export async function palestrasFuturas(agora = new Date()) {
  const evs = await prisma.evento.findMany({
    where: {
      ...ondePublico,
      tipo: 'PALESTRA',
      status: { in: ['CONFIRMADO', 'EM_ANDAMENTO'] },
      inicio: { gte: inicioDoDia(agora) },
    },
    orderBy: { inicio: 'asc' },
    take: 12,
    select: selectEvento,
  });
  return evs.map(mapearEvento);
}

export async function gravacoes(n = 6) {
  const evs = await prisma.evento.findMany({
    where: { ...ondePublico, tipo: 'PALESTRA', gravacaoUrl: { not: null } },
    orderBy: { inicio: 'desc' },
    take: n,
    select: selectEvento,
  });
  return evs.map(mapearEvento);
}

/** Palestra com transmissão em andamento (faixa "Estamos ao vivo"). */
export async function transmissaoAoVivo() {
  const e = await prisma.evento.findFirst({
    where: { ...ondePublico, status: 'EM_ANDAMENTO', transmissaoUrl: { not: null } },
    orderBy: { inicio: 'desc' },
    select: selectEvento,
  });
  return e ? mapearEvento(e) : null;
}

export async function eventoPorSlug(slug: string) {
  const e = await prisma.evento.findFirst({
    where: { slug, ...ondePublico },
    select: selectEvento,
  });
  return e ? mapearEvento(e) : null;
}

// ─── Estudos ─────────────────────────────────────────────────────────────

export async function cursos() {
  return prisma.curso.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
    select: {
      slug: true,
      nome: true,
      descricao: true,
      publico: true,
      encontros: true,
      duracao: true,
      statusInscricao: true,
    },
  });
}

/** Cards de estudos da home: curso em destaque + turma com resumo público. */
export async function estudosEmDestaque(agora = new Date()) {
  const cs = await prisma.curso.findMany({
    where: { ativo: true, destaque: true },
    orderBy: { ordem: 'asc' },
    select: {
      slug: true,
      nome: true,
      tag: true,
      turmas: {
        where: { resumoPublico: { not: null }, status: { not: 'ENCERRADA' } },
        take: 1,
        select: {
          resumoPublico: true,
          etapaAtual: true,
          progressoPct: true,
          _count: { select: { matriculas: true } },
          aulas: {
            where: { data: { gte: agora } },
            orderBy: { data: 'asc' },
            take: 1,
            select: { data: true },
          },
        },
      },
    },
  });
  return cs
    .filter((c) => c.turmas[0])
    .map((c) => {
      const t = c.turmas[0]!;
      return {
        slug: c.slug,
        nome: c.nome,
        tag: c.tag ?? '',
        resumo: (t.resumoPublico ?? '').replace('{n}', String(t._count.matriculas)),
        etapa: t.etapaAtual ?? '',
        progresso: t.progressoPct,
        proximo: t.aulas[0]?.data ?? null,
      };
    });
}

// ─── Blog ────────────────────────────────────────────────────────────────

export const CATEGORIAS_BLOG = [
  'Todos',
  'Palestras',
  'Estudos',
  'Solidariedade',
  'Eventos',
  'Assistência',
  'Institucional',
] as const;

/** Legenda dos placeholders até as fotos reais chegarem. */
export const FOTO_POR_CATEGORIA: Record<string, string> = {
  Solidariedade: 'foto da triagem de roupas',
  Palestras: 'foto do salão',
  Estudos: 'foto de grupo de estudo',
  Eventos: 'foto do bazar',
  Assistência: 'foto da sala de atendimento',
  Institucional: 'foto da biblioteca',
};

const ondePostPublicado = {
  status: 'PUBLICADO' as const,
  slug: { not: null },
  publicadoEm: { not: null },
};

export async function posts(categoria?: string, take = 24) {
  const ps = await prisma.conteudo.findMany({
    where: { ...ondePostPublicado, ...(categoria && categoria !== 'Todos' ? { categoria } : {}) },
    orderBy: { publicadoEm: 'desc' },
    take,
    select: {
      slug: true,
      titulo: true,
      categoria: true,
      lead: true,
      publicadoEm: true,
      imagemUrl: true,
    },
  });
  return ps.map((p) => ({
    slug: p.slug!,
    titulo: p.titulo,
    categoria: p.categoria ?? 'Institucional',
    lead: p.lead ?? '',
    publicadoEm: p.publicadoEm!,
    imagemUrl: p.imagemUrl,
    foto: FOTO_POR_CATEGORIA[p.categoria ?? ''] ?? 'foto do artigo',
  }));
}

export async function postPorSlug(slug: string) {
  const p = await prisma.conteudo.findFirst({
    where: { ...ondePostPublicado, slug },
    select: {
      slug: true,
      titulo: true,
      categoria: true,
      lead: true,
      autorExibicao: true,
      publicadoEm: true,
      imagemUrl: true,
      seoTitulo: true,
      seoDescricao: true,
      versoes: { where: { canal: 'BLOG' }, select: { texto: true } },
    },
  });
  if (!p) return null;
  return {
    slug: p.slug!,
    titulo: p.titulo,
    categoria: p.categoria ?? 'Institucional',
    lead: p.lead ?? '',
    autor: p.autorExibicao ?? 'CEAK',
    publicadoEm: p.publicadoEm!,
    imagemUrl: p.imagemUrl,
    foto: FOTO_POR_CATEGORIA[p.categoria ?? ''] ?? 'foto do artigo',
    seoTitulo: p.seoTitulo,
    seoDescricao: p.seoDescricao,
    paragrafos: (p.versoes[0]?.texto ?? '').split(/\n{2,}/).filter(Boolean),
  };
}

// ─── Biblioteca ─────────────────────────────────────────────────────────

export const TIPOS_BIBLIOTECA = {
  Livros: 'LIVRO',
  PDFs: 'PDF',
  Artigos: 'ARTIGO',
  Vídeos: 'VIDEO',
  Áudios: 'AUDIO',
  Palestras: 'PALESTRA',
} as const;

export const FILTROS_BIBLIOTECA = {
  assunto: ['Reencarnação', 'Mediunidade', 'Família', 'Prece'],
  autor: ['Allan Kardec', 'André Luiz', 'Emmanuel'],
  curso: ['ESDE', 'Evangelho', 'Mediunidade'],
  tema: ['Obras básicas', 'Vida espiritual'],
} as const;

export interface FiltroBiblioteca {
  q?: string;
  tipo?: string;
  assunto?: string;
  autor?: string;
  curso?: string;
  tema?: string;
}

export async function itensBiblioteca(f: FiltroBiblioteca) {
  const tipo =
    f.tipo && f.tipo in TIPOS_BIBLIOTECA
      ? TIPOS_BIBLIOTECA[f.tipo as keyof typeof TIPOS_BIBLIOTECA]
      : undefined;
  const q = f.q?.trim();
  const itens = await prisma.itemBiblioteca.findMany({
    where: {
      ...(tipo ? { tipo } : {}),
      ...(f.assunto ? { OR: [{ assuntos: { has: f.assunto } }, { tema: f.assunto }] } : {}),
      ...(f.autor ? { autor: { contains: f.autor, mode: 'insensitive' as const } } : {}),
      ...(f.curso ? { curso: f.curso } : {}),
      ...(f.tema ? { tema: f.tema } : {}),
      ...(q
        ? {
            AND: [
              {
                OR: [
                  { titulo: { contains: q, mode: 'insensitive' as const } },
                  { autor: { contains: q, mode: 'insensitive' as const } },
                  { tema: { contains: q, mode: 'insensitive' as const } },
                  { curso: { contains: q, mode: 'insensitive' as const } },
                  { assuntos: { has: q } },
                ],
              },
            ],
          }
        : {}),
    },
    orderBy: { criadoEm: 'asc' },
    take: 60,
  });
  const rotuloTipo = Object.fromEntries(Object.entries(TIPOS_BIBLIOTECA).map(([k, v]) => [v, k]));
  return itens.map((i) => ({
    id: i.id,
    titulo: i.titulo,
    autor: i.autor,
    tema: i.tema,
    tipo: rotuloTipo[i.tipo]!,
    url: i.url,
    cta:
      i.tipo === 'LIVRO'
        ? 'Reservar empréstimo'
        : i.tipo === 'VIDEO' || i.tipo === 'PALESTRA'
          ? 'Assistir'
          : i.tipo === 'AUDIO'
            ? 'Ouvir'
            : 'Abrir',
  }));
}

// ─── Campanhas ───────────────────────────────────────────────────────────

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
    include: { itens: true },
  });
  return c ? mapearCampanha(c) : null;
}

export async function campanhaPorSlug(slug: string) {
  const c = await prisma.campanha.findFirst({
    where: { slug, status: { in: ['ATIVA', 'ENCERRADA'] } },
    include: { itens: true },
  });
  return c ? mapearCampanha(c) : null;
}

function mapearCampanha(
  c: Awaited<ReturnType<typeof prisma.campanha.findFirstOrThrow<{ include: { itens: true } }>>>,
) {
  const reais = c.unidade === 'REAIS';
  const fmt = (v: number) => (reais ? formatarCentavos(v) : v.toLocaleString('pt-BR'));
  const fim = c.fim ? partesData(dataCivil(c.fim)) : null;
  return {
    slug: c.slug,
    titulo: c.titulo,
    descricao: c.descricao ?? '',
    arrecadado: fmt(c.arrecadado),
    meta: reais ? fmt(c.meta) : `${c.meta.toLocaleString('pt-BR')} ${UNIDADE_META[c.unidade]}`,
    percentual: percentual(c.arrecadado, c.meta),
    ate: fim ? `${fim.dia} de ${fim.mesLongo}` : null,
    pontosColeta: c.pontosColeta,
    itens: c.itens.map((i) => ({
      nome: i.nome,
      recebido: i.recebido,
      meta: i.meta,
      percentual: percentual(i.recebido, i.meta),
    })),
  };
}
export type CampanhaSite = ReturnType<typeof mapearCampanha>;

// ─── Loja ────────────────────────────────────────────────────────────────

export const CATEGORIAS_LOJA = [
  'Todos',
  'Livros',
  'Roupas',
  'Artesanato',
  'Objetos',
  'Itens doados',
  'Outros',
] as const;

const selectProduto = {
  id: true,
  slug: true,
  nome: true,
  categoria: true,
  descricao: true,
  precoCentavos: true,
  origem: true,
  estado: true,
  status: true,
  imagens: true,
  itemEstoque: { select: { saldo: true } },
} as const;

function mapearProduto(
  p: Awaited<ReturnType<typeof prisma.produto.findFirstOrThrow<{ select: typeof selectProduto }>>>,
) {
  const saldo = p.itemEstoque ? Number(p.itemEstoque.saldo) : 0;
  const disp = rotuloDisponibilidade(saldo, p.origem === 'DOADO');
  return {
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    categoria: p.categoria,
    descricao: p.descricao ?? '',
    precoCentavos: p.precoCentavos,
    preco: formatarCentavos(p.precoCentavos),
    origem: ORIGEM_PRODUTO_LABEL[p.origem],
    estado: ESTADO_PRODUTO_LABEL[p.estado],
    saldo,
    disponibilidade: disp.texto,
    alerta: disp.alerta,
    imagens: p.imagens,
  };
}
export type ProdutoSite = ReturnType<typeof mapearProduto>;

export async function produtos(categoria?: string) {
  const ps = await prisma.produto.findMany({
    where: {
      status: { in: ['ATIVO', 'ESGOTADO'] },
      ...(categoria && categoria !== 'Todos'
        ? categoria === 'Outros'
          ? { categoria: { notIn: CATEGORIAS_LOJA.filter((c) => c !== 'Todos' && c !== 'Outros') } }
          : { categoria }
        : {}),
    },
    orderBy: { criadoEm: 'asc' },
    select: selectProduto,
  });
  return ps.map(mapearProduto);
}

export async function produtosEmDestaque() {
  const slugs = [
    'o-evangelho-segundo-o-espiritismo',
    'pano-de-prato-bordado-a-mao',
    'nosso-lar-andre-luiz',
    'manta-de-croche',
  ];
  const ps = await prisma.produto.findMany({
    where: { status: 'ATIVO', slug: { in: slugs } },
    select: selectProduto,
  });
  const ordenados = slugs.map((s) => ps.find((p) => p.slug === s)).filter((p) => !!p);
  const lista = ordenados.length
    ? ordenados
    : await prisma.produto.findMany({ where: { status: 'ATIVO' }, take: 4, select: selectProduto });
  return lista.map(mapearProduto);
}

export async function produtoPorSlug(slug: string) {
  const p = await prisma.produto.findFirst({
    where: { slug, status: { in: ['ATIVO', 'ESGOTADO'] } },
    select: selectProduto,
  });
  return p ? mapearProduto(p) : null;
}

export async function produtosPorIds(ids: string[]) {
  const ps = await prisma.produto.findMany({
    where: { id: { in: ids }, status: { in: ['ATIVO', 'ESGOTADO'] } },
    select: selectProduto,
  });
  return ps.map(mapearProduto);
}

// ─── Transparência ──────────────────────────────────────────────────────

interface LinhaValor {
  rotulo: string;
  centavos: number;
}
interface Impacto {
  valor: string;
  rotulo: string;
  rotuloResumo?: string;
}

export async function prestacaoDeContas() {
  const p = await prisma.prestacaoContas.findFirst({
    where: { publicada: true },
    orderBy: { mes: 'desc' },
  });
  if (!p) return null;
  const origens = p.origens as unknown as LinhaValor[];
  const aplicacoes = p.aplicacoes as unknown as LinhaValor[];
  const impacto = p.impacto as unknown as Impacto[];
  const resumido = (c: number) => formatarCentavos(c).replace(/,00$/, '');
  return {
    mes: dataCivil(p.mes),
    receitas: resumido(p.receitasCentavos),
    despesas: resumido(p.despesasCentavos),
    resultado: resumido(p.receitasCentavos - p.despesasCentavos),
    origens: origens.map((o) => ({ rotulo: o.rotulo, valor: resumido(o.centavos) })),
    aplicacoes: aplicacoes.map((o) => ({ rotulo: o.rotulo, valor: resumido(o.centavos) })),
    doacoes: resumido(origens.find((o) => o.rotulo === 'Doações')?.centavos ?? 0),
    impacto,
  };
}

export async function documentosTransparencia() {
  return prisma.documentoTransparencia.findMany({ orderBy: { ordem: 'asc' } });
}
