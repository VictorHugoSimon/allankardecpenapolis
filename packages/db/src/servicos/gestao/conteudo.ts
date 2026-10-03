import { type SocialProvider } from '@ceak/core/adapters';
import { formatarHora, partesData, slugify } from '@ceak/core/format';
import { type Logger } from '@ceak/core/logger';
import { CANAL_LABEL, STATUS_CONTEUDO } from '@ceak/core/regras';
import { registrarAuditoria } from '../../auditoria';
import { prisma } from '../../client';
import { type Canal } from '../../generated/prisma/enums';
import { type Tx } from '../../rls';
import { ErroNegocio } from '../inscricoes';

const dd = (n: number) => String(n).padStart(2, '0');
const diaMes = (d: Date) => {
  const p = partesData(d);
  return `${dd(p.dia)}/${dd(p.mes + 1)}`;
};

/** Canais editáveis no editor, na ordem das abas. */
export const CANAIS_EDITOR = [
  'BLOG',
  'FACEBOOK',
  'INSTAGRAM',
  'GOOGLE_BUSINESS',
] as const satisfies Canal[];

function rotuloCanais(canais: string[]): string {
  const nomes = canais.map((c) => CANAL_LABEL[c as keyof typeof CANAL_LABEL] ?? c);
  if (canais.includes('BLOG') && canais.length >= 3) return `Blog + ${canais.length - 1} redes`;
  return nomes.join(', ');
}

/** KPIs, tabela de conteúdos e calendário editorial da semana. */
export async function painelConteudo(f: { canal?: string; semana?: Date }, agora = new Date()) {
  const [grupos, conteudos] = await Promise.all([
    prisma.conteudo.groupBy({ by: ['status'], _count: true }),
    prisma.conteudo.findMany({
      orderBy: [{ atualizadoEm: 'desc' }],
      take: 40,
      select: {
        id: true,
        titulo: true,
        fonte: true,
        status: true,
        geradoPorIa: true,
        criadoEm: true,
        agendadoPara: true,
        publicadoEm: true,
        responsavel: { select: { pessoa: { select: { nome: true } } } },
        versoes: { select: { canal: true } },
      },
    }),
  ]);
  const n = (...s: string[]) =>
    grupos.filter((g) => s.includes(g.status)).reduce((a, g) => a + g._count, 0);

  // Semana (segunda a domingo) do calendário editorial.
  const ref = f.semana ?? agora;
  const p = partesData(ref);
  const diaSemana = (['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const).indexOf(
    p.diaSemanaCurto as 'Dom',
  );
  const segunda = new Date(
    new Date(`${p.chaveDia}T00:00:00-03:00`).getTime() - ((diaSemana + 6) % 7) * 86_400_000,
  );
  const fimSemana = new Date(segunda.getTime() + 7 * 86_400_000);
  const [programados, eventos] = await Promise.all([
    prisma.conteudoVersao.findMany({
      where: {
        canal: { in: [...CANAIS_EDITOR] },
        conteudo: {
          OR: [
            {
              agendadoPara: { gte: segunda, lt: fimSemana },
              status: { in: ['AGENDADO', 'APROVADO'] },
            },
            { publicadoEm: { gte: segunda, lt: fimSemana }, status: 'PUBLICADO' },
          ],
        },
      },
      select: {
        canal: true,
        conteudo: { select: { titulo: true, agendadoPara: true, publicadoEm: true } },
      },
    }),
    prisma.evento.findMany({
      where: {
        inicio: { gte: segunda, lt: fimSemana },
        publico: true,
        status: { in: ['CONFIRMADO', 'EM_ANDAMENTO'] },
      },
      select: { titulo: true, inicio: true },
    }),
  ]);
  const itens = [
    ...programados.map((v) => {
      const quando = v.conteudo.agendadoPara ?? v.conteudo.publicadoEm!;
      const canal =
        v.canal === 'GOOGLE_BUSINESS' ? 'Google' : CANAL_LABEL[v.canal as keyof typeof CANAL_LABEL];
      return { canal, quando, titulo: v.conteudo.titulo };
    }),
    ...eventos.map((e) => ({ canal: 'Eventos', quando: e.inicio, titulo: e.titulo })),
  ].filter((i) => !f.canal || f.canal === 'Todos' || i.canal === f.canal);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda.getTime() + i * 86_400_000 + 12 * 3_600_000);
    const pd = partesData(d);
    return {
      rotulo: `${pd.diaSemanaCurto} ${dd(pd.dia)}`,
      itens: itens
        .filter((x) => partesData(x.quando).chaveDia === pd.chaveDia)
        .sort((a, b) => a.quando.getTime() - b.quando.getTime())
        .map((x) => ({ canal: x.canal, hora: formatarHora(x.quando), titulo: x.titulo })),
    };
  });
  const pf = partesData(new Date(fimSemana.getTime() - 12 * 3_600_000));
  const ps = partesData(new Date(segunda.getTime() + 12 * 3_600_000));
  return {
    kpis: {
      publicados: n('PUBLICADO'),
      aguardando: n('REVISAO', 'RASCUNHO_IA'),
      agendados: n('AGENDADO', 'APROVADO'),
      falhas: n('ERRO'),
    },
    conteudos: conteudos.map((c) => {
      const [status, tom] = STATUS_CONTEUDO[c.status] ?? [c.status, 'neutral'];
      const nome = c.responsavel?.pessoa.nome ?? '—';
      return {
        id: c.id,
        titulo: c.titulo,
        fonte: c.fonte,
        canais: rotuloCanais(c.versoes.map((v) => v.canal)),
        status,
        tom,
        data:
          c.status === 'AGENDADO' && c.agendadoPara
            ? `${diaMes(c.agendadoPara)} ${formatarHora(c.agendadoPara)}`
            : diaMes(c.publicadoEm ?? c.criadoEm),
        responsavel:
          c.geradoPorIa && ['PROCESSANDO', 'RASCUNHO_IA'].includes(c.status)
            ? c.status === 'PROCESSANDO'
              ? 'IA'
              : `IA → ${nome}`
            : nome,
        revisar: ['REVISAO', 'RASCUNHO_IA'].includes(c.status),
      };
    }),
    semana: {
      rotulo: `semana ${dd(ps.dia)}–${dd(pf.dia)} ${pf.mesLongo.slice(0, 3)}`,
      dias,
    },
  };
}

/** Conteúdo completo para o editor. */
export async function conteudoParaEditor(id: string) {
  const c = await prisma.conteudo.findUnique({
    where: { id },
    include: {
      versoes: true,
      evento: { select: { inicio: true, gravacaoDuracaoMin: true, titulo: true } },
      responsavel: { select: { pessoa: { select: { nome: true } } } },
      aprovacoes: {
        orderBy: { criadoEm: 'desc' },
        take: 1,
        select: {
          decisao: true,
          decididoEm: true,
          comentario: true,
          responsavel: { select: { pessoa: { select: { nome: true } } } },
        },
      },
    },
  });
  if (!c) return null;
  const versao = (canal: string) => c.versoes.find((v) => v.canal === canal);
  const [status, tom] = STATUS_CONTEUDO[c.status] ?? [c.status, 'neutral'];
  const ultima = c.aprovacoes[0];
  return {
    id: c.id,
    titulo: c.titulo,
    status: c.status,
    statusLabel: status,
    tom,
    geradoPorIa: c.geradoPorIa,
    textoOriginal: c.textoOriginal,
    origem: c.evento
      ? `Transcrição automática · gravação de ${diaMes(c.evento.inicio)}${c.evento.gravacaoDuracaoMin ? ` · ${c.evento.gravacaoDuracaoMin} min` : ''}`
      : c.fonte,
    resumo: c.resumo,
    seoTitulo: c.seoTitulo,
    seoDescricao: c.seoDescricao,
    slug: c.slug ?? slugify(c.titulo),
    tags: c.tags,
    imagemUrl: c.imagemUrl,
    fontes: c.fontes,
    agendadoPara: c.agendadoPara,
    publicadoEm: c.publicadoEm,
    erro: c.erro,
    canais: CANAIS_EDITOR.filter((k) => versao(k)).map((k) => ({
      canal: k,
      rotulo: CANAL_LABEL[k],
      texto: versao(k)!.texto,
      publicadoEm: versao(k)!.publicadoEm,
      erro: versao(k)!.erro,
    })),
    decisao:
      ultima && ultima.decisao !== 'PENDENTE'
        ? {
            decisao: ultima.decisao,
            por: ultima.responsavel?.pessoa.nome ?? '—',
            em: ultima.decididoEm,
            comentario: ultima.comentario,
          }
        : null,
  };
}

interface Autor {
  usuarioId: string;
  ip: string | null;
}

async function carregar(tx: Tx, id: string) {
  const c = await tx.conteudo.findUnique({
    where: { id },
    select: { id: true, titulo: true, status: true, agendadoPara: true, slug: true },
  });
  if (!c) throw new ErroNegocio('Conteúdo não encontrado.', 'nao_encontrado');
  return c;
}

/**
 * Salva a edição. Conteúdo já aprovado ou agendado volta para Revisão:
 * qualquer alteração precisa de nova aprovação humana.
 */
export async function salvarConteudo(
  id: string,
  dados: {
    titulo: string;
    versoes: Partial<Record<(typeof CANAIS_EDITOR)[number], string>>;
    resumo?: string;
    seoTitulo?: string;
    seoDescricao?: string;
    tags?: string[];
  },
  autor: Autor,
) {
  return prisma.$transaction(async (tx) => {
    const c = await carregar(tx, id);
    if (c.status === 'PUBLICADO') {
      throw new ErroNegocio(
        'Conteúdo publicado não pode ser editado. Crie uma nova versão.',
        'publicado',
      );
    }
    const voltaParaRevisao = ['APROVADO', 'AGENDADO'].includes(c.status);
    const novoStatus = voltaParaRevisao ? 'REVISAO' : c.status;
    await tx.conteudo.update({
      where: { id },
      data: {
        titulo: dados.titulo,
        resumo: dados.resumo,
        seoTitulo: dados.seoTitulo,
        seoDescricao: dados.seoDescricao,
        tags: dados.tags,
        status: novoStatus,
        agendadoPara: voltaParaRevisao ? null : undefined,
      },
    });
    for (const [canal, texto] of Object.entries(dados.versoes)) {
      if (typeof texto !== 'string') continue;
      await tx.conteudoVersao.updateMany({
        where: { conteudoId: id, canal: canal as Canal },
        data: { texto },
      });
    }
    if (voltaParaRevisao) {
      await tx.aprovacao.create({
        data: {
          tipo: 'CONTEUDO',
          titulo: dados.titulo,
          detalhe: 'Editado após aprovação · nova revisão necessária',
          entidade: 'Conteudo',
          entidadeId: id,
          conteudoId: id,
          solicitanteId: autor.usuarioId,
        },
      });
    }
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'editou conteúdo',
      entidade: 'Conteudo',
      entidadeId: id,
      antes: { titulo: c.titulo, status: c.status },
      depois: { titulo: dados.titulo, status: novoStatus },
      ip: autor.ip,
    });
    return { status: novoStatus, voltouParaRevisao: voltaParaRevisao };
  });
}

/** Envia um rascunho (ou conteúdo rejeitado) para revisão humana. */
export async function enviarParaRevisao(id: string, autor: Autor) {
  return prisma.$transaction(async (tx) => {
    const c = await carregar(tx, id);
    if (!['CAPTURADO', 'RASCUNHO_IA', 'REJEITADO'].includes(c.status)) {
      throw new ErroNegocio('Este conteúdo já está em revisão ou aprovado.', 'status_invalido');
    }
    await tx.conteudo.update({ where: { id }, data: { status: 'REVISAO' } });
    const pendente = await tx.aprovacao.count({ where: { conteudoId: id, decisao: 'PENDENTE' } });
    if (!pendente) {
      await tx.aprovacao.create({
        data: {
          tipo: 'CONTEUDO',
          titulo: c.titulo,
          detalhe: 'Enviado para revisão',
          entidade: 'Conteudo',
          entidadeId: id,
          conteudoId: id,
          solicitanteId: autor.usuarioId,
        },
      });
    }
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'enviou conteúdo para revisão',
      entidade: 'Conteudo',
      entidadeId: id,
      antes: { status: c.status },
      depois: { status: 'REVISAO' },
      ip: autor.ip,
    });
  });
}

/**
 * Decisão humana sobre o conteúdo (aprovar ou rejeitar). Fecha a aprovação
 * pendente e grava a auditoria na mesma transação.
 */
export async function decidirConteudo(
  tx: Tx,
  id: string,
  decisao: 'APROVADO' | 'REJEITADO',
  autor: Autor & { comentario?: string },
) {
  const c = await carregar(tx, id);
  if (!['REVISAO', 'RASCUNHO_IA'].includes(c.status)) {
    throw new ErroNegocio('Este conteúdo não está aguardando aprovação.', 'status_invalido');
  }
  await tx.conteudo.update({ where: { id }, data: { status: decisao } });
  await tx.aprovacao.updateMany({
    where: { conteudoId: id, decisao: 'PENDENTE' },
    data: {
      decisao,
      responsavelId: autor.usuarioId,
      decididoEm: new Date(),
      comentario: autor.comentario,
    },
  });
  await registrarAuditoria(tx, {
    usuarioId: autor.usuarioId,
    acao: decisao === 'APROVADO' ? 'aprovou conteúdo' : 'rejeitou conteúdo',
    entidade: 'Conteudo',
    entidadeId: id,
    antes: { status: c.status },
    depois: { status: decisao, ...(autor.comentario ? { comentario: autor.comentario } : {}) },
    ip: autor.ip,
  });
}

export async function aprovarOuRejeitarConteudo(
  id: string,
  decisao: 'APROVADO' | 'REJEITADO',
  autor: Autor & { comentario?: string },
  deps: { log: Logger },
) {
  await prisma.$transaction((tx) => decidirConteudo(tx, id, decisao, autor));
  deps.log.info(
    'AUDITORIA',
    `conteudo.${decisao === 'APROVADO' ? 'aprovado' : 'rejeitado'} · ${id}`,
    {
      rota: '/conteudo',
      status: 200,
    },
  );
}

/** Agenda a publicação de um conteúdo aprovado. */
export async function agendarConteudo(id: string, quando: Date, autor: Autor) {
  if (quando.getTime() <= Date.now())
    throw new ErroNegocio('Escolha uma data futura.', 'data_passada');
  return prisma.$transaction(async (tx) => {
    const c = await carregar(tx, id);
    if (!['APROVADO', 'AGENDADO'].includes(c.status)) {
      throw new ErroNegocio('Só conteúdo aprovado pode ser agendado.', 'nao_aprovado');
    }
    await tx.conteudo.update({ where: { id }, data: { status: 'AGENDADO', agendadoPara: quando } });
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'agendou publicação',
      entidade: 'Conteudo',
      entidadeId: id,
      antes: { status: c.status, agendadoPara: c.agendadoPara?.toISOString() ?? null },
      depois: { status: 'AGENDADO', agendadoPara: quando.toISOString() },
      ip: autor.ip,
    });
  });
}

export interface ResultadoPublicacao {
  publicados: string[];
  naFila: string[];
}

/**
 * Publica um conteúdo APROVADO ou AGENDADO: o Blog vai para o site e as redes
 * passam pelos adapters sociais. Canal com integração indisponível fica na fila
 * (com o erro registrado) sem bloquear os demais.
 */
export async function publicarConteudo(
  id: string,
  autor: Autor,
  deps: {
    social: Partial<Record<'FACEBOOK' | 'INSTAGRAM' | 'GOOGLE_BUSINESS', SocialProvider>>;
    log: Logger;
    siteUrl: string;
  },
): Promise<ResultadoPublicacao> {
  const c = await prisma.conteudo.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      status: true,
      slug: true,
      resumo: true,
      categoria: true,
      versoes: { select: { canal: true, texto: true, publicadoEm: true } },
    },
  });
  if (!c) throw new ErroNegocio('Conteúdo não encontrado.', 'nao_encontrado');
  if (!['APROVADO', 'AGENDADO'].includes(c.status)) {
    throw new ErroNegocio(
      'Só conteúdo aprovado por um responsável pode ser publicado.',
      'nao_aprovado',
    );
  }
  const integracoes = await prisma.integracao.findMany({ select: { chave: true, status: true } });
  const conectado = (chave: string) =>
    integracoes.find((i) => i.chave === chave)?.status !== 'ATENCAO' &&
    integracoes.find((i) => i.chave === chave)?.status !== 'ERRO';
  const agora = new Date();
  let slug = c.slug;
  if (!slug && c.versoes.some((v) => v.canal === 'BLOG')) {
    const base = slugify(c.titulo.replace(/[“”"]/g, ''));
    const usados = await prisma.conteudo.count({ where: { slug: { startsWith: base } } });
    slug = usados ? `${base}-${usados + 1}` : base;
  }
  const link = slug ? `${deps.siteUrl.replace(/\/$/, '')}/blog/${slug}` : undefined;
  const publicados: string[] = [];
  const naFila: string[] = [];
  const resultados: {
    canal: Canal;
    publicadoEm?: Date;
    idExterno?: string;
    urlExterna?: string;
    erro?: string;
  }[] = [];
  for (const v of c.versoes) {
    if (v.publicadoEm) continue;
    if (v.canal === 'BLOG') {
      resultados.push({ canal: 'BLOG', publicadoEm: agora, urlExterna: link });
      publicados.push('Blog');
      continue;
    }
    const chave = { FACEBOOK: 'facebook', INSTAGRAM: 'instagram', GOOGLE_BUSINESS: 'google' }[
      v.canal as string
    ];
    const provider = deps.social[v.canal as 'FACEBOOK'];
    const rotulo =
      v.canal === 'GOOGLE_BUSINESS' ? 'Google' : CANAL_LABEL[v.canal as keyof typeof CANAL_LABEL];
    if (!chave || !provider) continue;
    if (!conectado(chave)) {
      resultados.push({ canal: v.canal, erro: 'Integração indisponível (token) · na fila' });
      naFila.push(rotulo);
      continue;
    }
    try {
      const r = await provider.publicar(v.texto, { link });
      resultados.push({
        canal: v.canal,
        publicadoEm: r.publicadaEm,
        idExterno: r.idExterno,
        urlExterna: r.url,
      });
      publicados.push(rotulo);
    } catch (e) {
      resultados.push({ canal: v.canal, erro: String(e instanceof Error ? e.message : e) });
      naFila.push(rotulo);
      deps.log.warn('INTEGRACOES', `publicacao.falha · ${rotulo}`, {
        rota: '/conteudo',
        status: 502,
      });
    }
  }
  await prisma.$transaction(async (tx) => {
    for (const r of resultados) {
      await tx.conteudoVersao.updateMany({
        where: { conteudoId: id, canal: r.canal },
        data: {
          publicadoEm: r.publicadoEm ?? null,
          idExterno: r.idExterno,
          urlExterna: r.urlExterna,
          erro: r.erro ?? null,
        },
      });
    }
    await tx.conteudo.update({
      where: { id },
      data: {
        status: 'PUBLICADO',
        publicadoEm: agora,
        slug,
        lead: c.resumo ?? undefined,
        categoria: c.categoria ?? 'Palestras',
        erro: naFila.length ? `Na fila: ${naFila.join(', ')}` : null,
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'publicou conteúdo',
      entidade: 'Conteudo',
      entidadeId: id,
      antes: { status: c.status },
      depois: { status: 'PUBLICADO', canais: publicados, naFila },
      ip: autor.ip,
    });
  });
  deps.log.info(
    'INTEGRACOES',
    `conteudo.publicado · ${publicados.join(', ')}${naFila.length ? ` · fila: ${naFila.join(', ')}` : ''}`,
    {
      rota: '/conteudo',
      status: 200,
    },
  );
  return { publicados, naFila };
}

/** Conteúdo escrito por uma pessoa: nasce Capturado e segue para revisão humana. */
export async function criarConteudo(
  dados: { titulo: string; fonte: string; canais: (typeof CANAIS_EDITOR)[number][]; texto: string },
  autor: Autor,
) {
  return prisma.$transaction(async (tx) => {
    const c = await tx.conteudo.create({
      data: {
        titulo: dados.titulo,
        fonte: dados.fonte,
        status: 'CAPTURADO',
        responsavelId: autor.usuarioId,
        textoOriginal: dados.texto,
        tags: [],
        fontes: [],
        versoes: { create: dados.canais.map((canal) => ({ canal, texto: dados.texto })) },
      },
      select: { id: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'criou conteúdo',
      entidade: 'Conteudo',
      entidadeId: c.id,
      antes: null,
      depois: { titulo: dados.titulo, canais: dados.canais, status: 'CAPTURADO' },
      ip: autor.ip,
    });
    return c;
  });
}
