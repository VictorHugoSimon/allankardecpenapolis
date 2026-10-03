import { hashSenha } from '@ceak/core/auth';
import { type Logger } from '@ceak/core/logger';
import { inicioDoDia, partesData } from '@ceak/core/format';
import {
  checkinAberto,
  conquistasAlcancadas,
  frequencia,
  ICONE_CONQUISTA,
  textoVisitaDoMes,
} from '@ceak/core/regras';
import { TERMO_LGPD_VERSAO, type AvaliacaoInput, type CadastroInput } from '@ceak/core/validacao';
import { registrarAuditoria } from '../auditoria';
import { prisma } from '../client';
import { type Tx } from '../rls';
import { ErroNegocio } from './inscricoes';

/**
 * Serviços do CEAK App. Todas as consultas são filtradas pela pessoa da sessão:
 * a jornada é pessoal e nunca é comparada com a de outras pessoas.
 */

// ─── Cadastro ───────────────────────────────────────────────────────────

/** Cria a conta de um novo participante (perfil Visitante; a secretaria promove a Membro). */
export async function cadastrarParticipante(dados: CadastroInput) {
  const ja = await prisma.usuario.findUnique({
    where: { email: dados.email },
    select: { id: true },
  });
  if (ja)
    throw new ErroNegocio(
      'Já existe uma conta com este e-mail. Use "Entrar" ou recupere a senha.',
      'email_em_uso',
    );
  const senhaHash = await hashSenha(dados.senha);
  return prisma.$transaction(async (tx) => {
    // Reaproveita o cadastro de quem já se inscreveu ou pediu atendimento pelo site.
    const existente = await tx.pessoa.findFirst({
      where: {
        anonimizadaEm: null,
        usuario: null,
        OR: [{ email: dados.email }, ...(dados.whatsapp ? [{ whatsapp: dados.whatsapp }] : [])],
      },
      select: { id: true },
    });
    const consentimento = { consentimentoEm: new Date(), consentimentoVersao: TERMO_LGPD_VERSAO };
    const pessoa = existente
      ? await tx.pessoa.update({
          where: { id: existente.id },
          data: {
            nome: dados.nome,
            email: dados.email,
            whatsapp: dados.whatsapp ?? undefined,
            ...consentimento,
          },
          select: { id: true },
        })
      : await tx.pessoa.create({
          data: {
            nome: dados.nome,
            email: dados.email,
            whatsapp: dados.whatsapp,
            perfil: 'VISITANTE',
            status: 'NOVO',
            primeiraVisitaEm: dados.primeiraVez ? new Date() : undefined,
            ...consentimento,
          },
          select: { id: true },
        });
    const usuario = await tx.usuario.create({
      data: {
        pessoaId: pessoa.id,
        email: dados.email,
        perfil: 'VISITANTE',
        credencial: { create: { senhaHash } },
      },
      select: { id: true, email: true },
    });
    return { pessoaId: pessoa.id, usuarioId: usuario.id, email: usuario.email };
  });
}

// ─── Check-in ───────────────────────────────────────────────────────────

const STATUS_CHECKIN = ['CONFIRMADO', 'EM_ANDAMENTO'] as const;

/** Atividade de hoje para o check-in (prefere a palestra mais próxima do horário atual). */
export async function atividadeParaCheckin(agora = new Date()) {
  const inicio = inicioDoDia(agora);
  const fim = new Date(inicio.getTime() + 86_400_000);
  const evs = await prisma.evento.findMany({
    where: { publico: true, status: { in: [...STATUS_CHECKIN] }, inicio: { gte: inicio, lt: fim } },
    orderBy: { inicio: 'asc' },
    select: {
      id: true,
      slug: true,
      titulo: true,
      tipo: true,
      inicio: true,
      fim: true,
      local: true,
      palestrante: { select: { nome: true } },
      responsavel: true,
    },
  });
  const abertos = evs.filter((e) => checkinAberto(e.inicio, e.fim, agora));
  const escolhido =
    abertos.find((e) => e.tipo === 'PALESTRA') ??
    abertos[0] ??
    evs.find((e) => e.tipo === 'PALESTRA') ??
    evs[0];
  if (!escolhido) return null;
  return { ...escolhido, aberto: checkinAberto(escolhido.inicio, escolhido.fim, agora) };
}

async function contagens(tx: Tx | typeof prisma, pessoaId: string, agora: Date) {
  const [checkins, presencasEstudo, voluntariados, campanhasApoiadas] = await Promise.all([
    tx.checkin.count({ where: { pessoaId } }),
    tx.presenca.count({ where: { pessoaId, presente: true } }),
    tx.escala.count({ where: { voluntario: { pessoaId }, fim: { lt: agora } } }),
    tx.doacao.count({ where: { pessoaId, campanhaId: { not: null }, statusPagamento: 'PAGO' } }),
  ]);
  return { checkins, presencasEstudo, voluntariados, campanhasApoiadas };
}

/** Concede as conquistas alcançadas que ainda não foram registradas. Retorna os títulos novos. */
export async function atualizarConquistas(
  tx: Tx,
  pessoaId: string,
  agora = new Date(),
): Promise<string[]> {
  const devidas = conquistasAlcancadas(await contagens(tx, pessoaId, agora));
  if (!devidas.length) return [];
  const [catalogo, ja] = await Promise.all([
    tx.conquista.findMany({
      where: { chave: { in: devidas } },
      select: { id: true, titulo: true },
    }),
    tx.conquistaPessoa.findMany({ where: { pessoaId }, select: { conquistaId: true } }),
  ]);
  const tem = new Set(ja.map((c) => c.conquistaId));
  const novas = catalogo.filter((c) => !tem.has(c.id));
  if (novas.length) {
    await tx.conquistaPessoa.createMany({
      data: novas.map((c) => ({ pessoaId, conquistaId: c.id })),
      skipDuplicates: true,
    });
  }
  return novas.map((c) => c.titulo);
}

export interface ResultadoCheckin {
  registradoEm: Date;
  jaRegistrado: boolean;
  visitaDoMes: string;
  conquistas: string[];
  evento: { titulo: string; tipo: string } | null;
}

/**
 * Registra a presença da pessoa na atividade. Pelo QR, o token assinado precisa
 * conferir; a confirmação manual vale só para a atividade aberta de hoje.
 */
export async function fazerCheckin(
  pessoaId: string,
  entrada: { eventoId: string; origem: 'QR' | 'MANUAL'; tokenValido: boolean },
  deps: { log: Logger },
  agora = new Date(),
): Promise<ResultadoCheckin> {
  if (entrada.origem === 'QR' && !entrada.tokenValido) {
    deps.log.warn('SEGURANCA', 'checkin: QR Code inválido', { rota: '/checkin', status: 400 });
    throw new ErroNegocio(
      'Este QR Code não é válido. Use o código afixado na entrada do salão.',
      'qr_invalido',
    );
  }
  const evento = await prisma.evento.findUnique({
    where: { id: entrada.eventoId },
    select: { id: true, titulo: true, tipo: true, inicio: true, fim: true, status: true },
  });
  if (
    !evento ||
    !(STATUS_CHECKIN as readonly string[]).includes(evento.status) ||
    !checkinAberto(evento.inicio, evento.fim, agora)
  ) {
    throw new ErroNegocio('O check-in desta atividade não está aberto agora.', 'fora_do_horario');
  }
  const r = await prisma.$transaction(async (tx) => {
    const existente = await tx.checkin.findUnique({
      where: { pessoaId_eventoId: { pessoaId, eventoId: evento.id } },
      select: { criadoEm: true },
    });
    const registradoEm =
      existente?.criadoEm ??
      (
        await tx.checkin.create({
          data: { pessoaId, eventoId: evento.id, origem: entrada.origem, criadoEm: agora },
          select: { criadoEm: true },
        })
      ).criadoEm;
    const p = partesData(agora);
    const inicioMes = new Date(`${p.ano}-${String(p.mes + 1).padStart(2, '0')}-01T00:00:00-03:00`);
    const visitas = await tx.checkin.count({ where: { pessoaId, criadoEm: { gte: inicioMes } } });
    const conquistas = existente ? [] : await atualizarConquistas(tx, pessoaId, agora);
    if (!existente) {
      await tx.pessoa.updateMany({
        where: { id: pessoaId, primeiraVisitaEm: null },
        data: { primeiraVisitaEm: agora },
      });
    }
    return {
      registradoEm,
      jaRegistrado: !!existente,
      visitaDoMes: textoVisitaDoMes(visitas, p.mesLongo),
      conquistas,
    };
  });
  deps.log.info('APLICACAO', `checkin.${entrada.origem.toLowerCase()} · ${evento.titulo}`, {
    rota: '/checkin',
    status: r.jaRegistrado ? 200 : 201,
  });
  return { ...r, evento: { titulo: evento.titulo, tipo: evento.tipo } };
}

// ─── Início e jornada ────────────────────────────────────────────────────

function inicioDoMes(agora: Date) {
  const p = partesData(agora);
  return new Date(`${p.ano}-${String(p.mes + 1).padStart(2, '0')}-01T00:00:00-03:00`);
}

export async function estatisticasDoMes(pessoaId: string, agora = new Date()) {
  const desde = inicioDoMes(agora);
  const [visitas, estudos, voluntariados, campanhas] = await Promise.all([
    prisma.checkin.count({ where: { pessoaId, criadoEm: { gte: desde } } }),
    prisma.presenca.count({
      where: { pessoaId, presente: true, aula: { data: { gte: desde, lte: agora } } },
    }),
    prisma.escala.count({
      where: { voluntario: { pessoaId }, inicio: { gte: desde }, fim: { lte: agora } },
    }),
    prisma.doacao.findMany({
      where: {
        pessoaId,
        campanhaId: { not: null },
        statusPagamento: 'PAGO',
        criadoEm: { gte: desde },
      },
      distinct: ['campanhaId'],
      select: { campanhaId: true },
    }),
  ]);
  return { visitas, estudos, voluntariados, campanhas: campanhas.length };
}

/** Última palestra com check-in da pessoa, encerrada e ainda sem avaliação (até 14 dias). */
export async function avaliacaoPendente(pessoaId: string, agora = new Date()) {
  const c = await prisma.checkin.findFirst({
    where: {
      pessoaId,
      evento: {
        tipo: 'PALESTRA',
        status: 'ENCERRADO',
        inicio: { gte: new Date(agora.getTime() - 14 * 86_400_000), lte: agora },
        avaliacoes: { none: { pessoaId } },
      },
    },
    orderBy: { criadoEm: 'desc' },
    select: {
      evento: {
        select: { slug: true, titulo: true, inicio: true, palestrante: { select: { nome: true } } },
      },
    },
  });
  return c?.evento ?? null;
}

export async function jornada(pessoaId: string, agora = new Date()) {
  const [mes, catalogo, obtidas, checkins, doacoes, escalas, presencas, avaliacoes] =
    await Promise.all([
      estatisticasDoMes(pessoaId, agora),
      prisma.conquista.findMany({ orderBy: { ordem: 'asc' } }),
      prisma.conquistaPessoa.findMany({ where: { pessoaId }, include: { conquista: true } }),
      prisma.checkin.findMany({
        where: { pessoaId },
        orderBy: { criadoEm: 'desc' },
        take: 10,
        select: { criadoEm: true, evento: { select: { titulo: true, tipo: true } } },
      }),
      prisma.doacao.findMany({
        where: { pessoaId, statusPagamento: 'PAGO' },
        orderBy: { criadoEm: 'desc' },
        take: 10,
        select: { criadoEm: true, valorCentavos: true, itemDescricao: true, destino: true },
      }),
      prisma.escala.findMany({
        where: { voluntario: { pessoaId }, fim: { lte: agora } },
        orderBy: { inicio: 'desc' },
        take: 10,
        select: { inicio: true, fim: true, funcao: true, area: { select: { nome: true } } },
      }),
      prisma.presenca.findMany({
        where: { pessoaId, presente: true },
        orderBy: { aula: { data: 'desc' } },
        take: 5,
        select: {
          aula: {
            select: {
              numero: true,
              data: true,
              modulo: true,
              turma: { select: { curso: { select: { sigla: true } } } },
            },
          },
        },
      }),
      prisma.avaliacao.findMany({
        where: { pessoaId },
        orderBy: { criadoEm: 'desc' },
        take: 5,
        select: { criadoEm: true, evento: { select: { titulo: true } } },
      }),
    ]);
  const horas = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 3_600_000);
  const tl = [
    ...checkins.map((c) => ({
      quando: c.criadoEm,
      texto: `Check-in · ${c.evento ? (c.evento.tipo === 'PALESTRA' ? 'Palestra Pública' : c.evento.titulo) : 'CEAK'}`,
      hora: true,
    })),
    ...doacoes.map((d) => ({
      quando: d.criadoEm,
      texto: `Doação ${d.destino.startsWith('Campanha') ? `à ${d.destino}` : `· ${d.destino}`} · ${
        d.itemDescricao ??
        (d.valorCentavos
          ? (d.valorCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : '')
      }`,
      hora: false,
    })),
    ...escalas.map((e) => ({
      quando: e.inicio,
      texto: `Voluntariado · ${e.funcao ?? e.area.nome}`,
      sufixo: `${horas(e.inicio, e.fim)}h`,
      hora: false,
    })),
    ...presencas.map((p) => ({
      quando: p.aula.data,
      texto:
        `Presença · ${p.aula.turma.curso.sigla ?? 'Estudo'} ${p.aula.modulo?.toLowerCase() ?? ''}, aula ${p.aula.numero}`.replace(
          ' ,',
          ',',
        ),
      hora: false,
    })),
    ...avaliacoes.map((a) => ({
      quando: a.criadoEm,
      texto: `Avaliou a palestra “${a.evento.titulo}”`,
      hora: false,
    })),
    ...obtidas.map((o) => ({
      quando: o.obtidaEm,
      texto: `Conquista: ${o.conquista.titulo}`,
      hora: false,
    })),
  ]
    .sort((a, b) => b.quando.getTime() - a.quando.getTime())
    .slice(0, 8);
  const tem = new Set(obtidas.map((o) => o.conquistaId));
  return {
    mes,
    conquistas: catalogo.map((c) => ({
      chave: c.chave,
      titulo: c.titulo,
      icone: ICONE_CONQUISTA[c.chave] ?? c.titulo[0]!,
      obtida: tem.has(c.id),
    })),
    linhaDoTempo: tl,
  };
}

// ─── Estudos ─────────────────────────────────────────────────────────────

export async function meusEstudos(pessoaId: string, agora = new Date()) {
  const ms = await prisma.matricula.findMany({
    where: { pessoaId, status: { in: ['ATIVA', 'EM_RISCO'] } },
    orderBy: { criadoEm: 'asc' },
    select: {
      progresso: true,
      turma: {
        select: {
          id: true,
          nome: true,
          etapaAtual: true,
          curso: { select: { nome: true, sigla: true } },
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
  return ms.map((m) => ({
    turmaId: m.turma.id,
    sigla: m.turma.curso.sigla ?? m.turma.curso.nome,
    curso: m.turma.curso.nome,
    turma: m.turma.nome,
    etapa: m.turma.etapaAtual,
    progresso: m.progresso,
    proximo: m.turma.aulas[0]?.data ?? null,
  }));
}

/** Detalhe da turma para quem está matriculado (aulas, materiais, presença e calendário). */
export async function detalheTurma(pessoaId: string, turmaId: string, agora = new Date()) {
  const m = await prisma.matricula.findUnique({
    where: { turmaId_pessoaId: { turmaId, pessoaId } },
    select: {
      progresso: true,
      turma: {
        select: {
          id: true,
          nome: true,
          encontros: true,
          etapaAtual: true,
          instrutor: { select: { nome: true } },
          curso: { select: { id: true, nome: true, sigla: true } },
          aulas: {
            orderBy: { numero: 'asc' },
            select: {
              id: true,
              numero: true,
              titulo: true,
              data: true,
              modulo: true,
              evento: { select: { local: true } },
            },
          },
        },
      },
    },
  });
  if (!m) return null;
  const [presencas, materiais] = await Promise.all([
    prisma.presenca.findMany({
      where: { pessoaId, aula: { turmaId } },
      select: { aulaId: true, presente: true },
    }),
    prisma.material.findMany({
      where: { OR: [{ cursoId: m.turma.curso.id }, { aula: { turmaId } }] },
      orderBy: { criadoEm: 'asc' },
    }),
  ]);
  const pres = new Map(presencas.map((p) => [p.aulaId, p.presente]));
  const aulas = m.turma.aulas.map((a) => ({
    ...a,
    realizada: a.data <= agora,
    presente: pres.get(a.id) ?? null,
  }));
  const realizadas = aulas.filter((a) => a.realizada);
  const presentes = realizadas.filter((a) => a.presente).length;
  const futuras = aulas.filter((a) => !a.realizada);
  return {
    turmaId: m.turma.id,
    curso: m.turma.curso.nome.replace(/\s*\(.*\)$/, ''),
    sigla: m.turma.curso.sigla,
    turma: m.turma.nome,
    instrutor: m.turma.instrutor?.nome ?? null,
    encontros: m.turma.encontros,
    progresso: m.progresso,
    presentes,
    realizadas: realizadas.length,
    frequencia: frequencia(presentes, realizadas.length),
    proxima: futuras[0] ?? null,
    // Últimas concluídas + próximas, como na aba "Aulas" do protótipo.
    aulasLista: [...realizadas.slice(-2), ...futuras.slice(0, 4)],
    grade: aulas,
    calendario: futuras.slice(0, 4),
    materiais: materiais.map((x) => ({
      id: x.id,
      titulo: x.titulo,
      tipo: x.tipo,
      url: x.url,
      detalhe: x.detalhe,
    })),
  };
}

/** Pré-inscrição em um curso pelo app (sem formulário: usa os dados da conta). */
export async function preInscricaoMembro(pessoaId: string, cursoSlug: string) {
  const curso = await prisma.curso.findUnique({
    where: { slug: cursoSlug },
    select: { id: true, nome: true, ativo: true },
  });
  if (!curso?.ativo) throw new ErroNegocio('Estudo não encontrado.', 'nao_encontrado');
  await prisma.inscricao.upsert({
    where: { cursoId_pessoaId: { cursoId: curso.id, pessoaId } },
    create: { cursoId: curso.id, pessoaId },
    update: {},
  });
  return curso;
}

// ─── Avaliação (NPS) ─────────────────────────────────────────────────────

export async function eventoParaAvaliar(slug: string, agora = new Date()) {
  const e = await prisma.evento.findFirst({
    where: {
      slug,
      publico: true,
      inicio: { lte: agora },
      status: { in: ['EM_ANDAMENTO', 'ENCERRADO'] },
    },
    select: {
      id: true,
      slug: true,
      titulo: true,
      inicio: true,
      palestrante: { select: { nome: true } },
      responsavel: true,
    },
  });
  return e;
}

export async function registrarAvaliacao(
  pessoaId: string,
  slug: string,
  dados: Omit<AvaliacaoInput, 'comentario' | 'sugestao'> & {
    comentario?: string;
    sugestao?: string;
  },
  deps: { log: Logger },
) {
  const e = await eventoParaAvaliar(slug);
  if (!e) throw new ErroNegocio('Esta atividade ainda não pode ser avaliada.', 'nao_avaliavel');
  await prisma.avaliacao.upsert({
    where: { eventoId_pessoaId: { eventoId: e.id, pessoaId } },
    create: { eventoId: e.id, pessoaId, ...dados },
    update: { ...dados, criadoEm: new Date() },
  });
  deps.log.info('APLICACAO', `avaliacao.registrada · ${e.titulo} · nps ${dados.nps}`, {
    rota: '/avaliacao',
    status: 201,
  });
  return e;
}

// ─── Notificações ────────────────────────────────────────────────────────

export async function notificacoes(pessoaId: string) {
  return prisma.notificacao.findMany({
    where: { pessoaId },
    orderBy: { criadoEm: 'desc' },
    take: 50,
  });
}

export async function contarNaoLidas(pessoaId: string) {
  return prisma.notificacao.count({ where: { pessoaId, lidaEm: null } });
}

export async function marcarNotificacoesLidas(pessoaId: string) {
  await prisma.notificacao.updateMany({
    where: { pessoaId, lidaEm: null },
    data: { lidaEm: new Date() },
  });
}

export async function registrarDispositivoPush(
  pessoaId: string,
  inscricao: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  await prisma.dispositivoPush.upsert({
    where: { endpoint: inscricao.endpoint },
    create: {
      pessoaId,
      endpoint: inscricao.endpoint,
      p256dh: inscricao.keys.p256dh,
      auth: inscricao.keys.auth,
    },
    update: { pessoaId, p256dh: inscricao.keys.p256dh, auth: inscricao.keys.auth },
  });
}

export async function removerDispositivoPush(endpoint: string) {
  await prisma.dispositivoPush.deleteMany({ where: { endpoint } });
}

// ─── Perfil e LGPD ───────────────────────────────────────────────────────

export async function perfilMembro(pessoaId: string) {
  return prisma.pessoa.findUnique({
    where: { id: pessoaId },
    select: {
      nome: true,
      email: true,
      whatsapp: true,
      perfil: true,
      membroDesde: true,
      exclusaoSolicitadaEm: true,
      consentimentoEm: true,
      consentimentoVersao: true,
      voluntario: {
        select: { ativo: true, areas: { select: { area: { select: { nome: true } } } } },
      },
    },
  });
}

/** Correção dos próprios dados (LGPD, art. 18, III), com auditoria. */
export async function atualizarDadosPessoais(
  pessoaId: string,
  dados: { nome: string; whatsapp: string | null },
  usuarioId: string | null,
  ip: string | null,
) {
  await prisma.$transaction(async (tx) => {
    const antes = await tx.pessoa.findUniqueOrThrow({
      where: { id: pessoaId },
      select: { nome: true, whatsapp: true },
    });
    if (antes.nome === dados.nome && antes.whatsapp === dados.whatsapp) return;
    await tx.pessoa.update({ where: { id: pessoaId }, data: dados });
    await registrarAuditoria(tx, {
      usuarioId,
      acao: 'atualizou os próprios dados',
      entidade: 'Pessoa',
      entidadeId: pessoaId,
      antes,
      depois: dados,
      ip,
    });
  });
}

/** Exportação dos dados do titular (LGPD, art. 18). O acesso fica na auditoria. */
export async function exportarDadosTitular(
  pessoaId: string,
  usuarioId: string | null,
  ip: string | null,
) {
  const dados = await prisma.pessoa.findUnique({
    where: { id: pessoaId },
    select: {
      nome: true,
      email: true,
      whatsapp: true,
      nascimento: true,
      cidade: true,
      perfil: true,
      membroDesde: true,
      consentimentoEm: true,
      consentimentoVersao: true,
      criadoEm: true,
      inscricoes: {
        select: {
          criadoEm: true,
          evento: { select: { titulo: true, inicio: true } },
          curso: { select: { nome: true } },
        },
      },
      checkins: { select: { criadoEm: true, origem: true, evento: { select: { titulo: true } } } },
      avaliacoes: {
        select: {
          criadoEm: true,
          nps: true,
          conteudo: true,
          clareza: true,
          aplicabilidade: true,
          comentario: true,
          sugestao: true,
          evento: { select: { titulo: true } },
        },
      },
      matriculas: {
        select: {
          status: true,
          progresso: true,
          turma: { select: { nome: true, curso: { select: { nome: true } } } },
        },
      },
      presencas: { select: { presente: true, aula: { select: { numero: true, data: true } } } },
      doacoes: {
        select: {
          criadoEm: true,
          valorCentavos: true,
          itemDescricao: true,
          destino: true,
          statusPagamento: true,
        },
      },
      pedidos: { select: { numero: true, criadoEm: true, totalCentavos: true, status: true } },
      solicitacoes: {
        select: {
          criadoEm: true,
          tipo: true,
          data: true,
          status: true,
          relato: { select: { texto: true } },
        },
      },
      conquistas: { select: { obtidaEm: true, conquista: { select: { titulo: true } } } },
      notificacoes: { select: { criadoEm: true, titulo: true, corpo: true } },
    },
  });
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      usuarioId,
      acao: 'exportou os próprios dados (LGPD)',
      entidade: 'Usuario',
      entidadeId: usuarioId ?? pessoaId,
      antes: null,
      depois: { pessoaId },
      ip,
    }),
  );
  return { geradoEm: new Date().toISOString(), titular: dados };
}

/** Pedido de exclusão (LGPD). A secretaria conclui a anonimização no Gestão. */
export async function solicitarExclusaoDados(
  pessoaId: string,
  usuarioId: string | null,
  ip: string | null,
) {
  await prisma.$transaction(async (tx) => {
    const antes = await tx.pessoa.findUnique({
      where: { id: pessoaId },
      select: { exclusaoSolicitadaEm: true },
    });
    if (antes?.exclusaoSolicitadaEm) return;
    await tx.pessoa.update({ where: { id: pessoaId }, data: { exclusaoSolicitadaEm: new Date() } });
    await registrarAuditoria(tx, {
      usuarioId,
      acao: 'solicitou exclusão dos dados (LGPD)',
      entidade: 'Usuario',
      entidadeId: usuarioId ?? pessoaId,
      antes: { exclusaoSolicitadaEm: null },
      depois: { exclusaoSolicitadaEm: new Date().toISOString() },
      ip,
    });
  });
}

// ─── Base do CEAK IA (RAG) ────────────────────────────────────────────────

/** Documentos oficiais para o CEAK IA responder citando a fonte. */
export async function documentosParaIA(agora = new Date()) {
  const [eventos, cursos, campanhas] = await Promise.all([
    prisma.evento.findMany({
      where: {
        publico: true,
        status: { in: ['CONFIRMADO', 'EM_ANDAMENTO'] },
        inicio: { gte: inicioDoDia(agora) },
      },
      orderBy: { inicio: 'asc' },
      take: 10,
      select: {
        titulo: true,
        tipo: true,
        inicio: true,
        local: true,
        palestrante: { select: { nome: true } },
        responsavel: true,
      },
    }),
    prisma.curso.findMany({
      where: { ativo: true },
      select: {
        nome: true,
        publico: true,
        encontros: true,
        duracao: true,
        statusInscricao: true,
        descricao: true,
      },
    }),
    prisma.campanha.findMany({
      where: { status: 'ATIVA' },
      select: { titulo: true, descricao: true, pontosColeta: true, fim: true },
    }),
  ]);
  const p = (d: Date) => partesData(d);
  const quando = (d: Date) =>
    `${p(d).diaSemana.toLowerCase()}, ${String(p(d).dia).padStart(2, '0')}/${String(p(d).mes + 1).padStart(2, '0')}, às ${p(d).hora}h${String(p(d).minuto).padStart(2, '0')}`;
  const palestras = eventos.filter((e) => e.tipo === 'PALESTRA');
  return [
    {
      id: 'agenda',
      titulo: 'Próxima palestra pública agenda',
      fonte: 'Agenda CEAK',
      texto: palestras.length
        ? palestras
            .slice(0, 2)
            .map(
              (e, i) =>
                `${i === 0 ? 'A próxima palestra pública' : 'Depois'}: “${e.titulo}”, com ${e.palestrante?.nome ?? e.responsavel}, ${quando(e.inicio)}, no ${e.local?.toLowerCase() ?? 'salão'}.`,
            )
            .join(' ') + ' As palestras têm transmissão ao vivo.'
        : 'Não há palestras públicas agendadas no momento.',
    },
    ...cursos.map((c) => ({
      id: `curso-${c.nome}`,
      titulo: `Como participar de um estudo ${c.nome}`,
      fonte: 'Página Estudos',
      texto: `${c.nome}: ${c.descricao ?? ''} Público: ${c.publico}. Encontros: ${c.encontros}. Duração: ${c.duracao}. ${c.statusInscricao ?? ''}.`,
    })),
    {
      id: 'ajudar',
      titulo: 'Como posso ajudar doar voluntário',
      fonte: 'Quero ajudar · Campanhas ativas',
      texto: `É possível doar alimentos, roupas${campanhas[0] ? ` (${campanhas[0].titulo} ativa)` : ''}, produtos para o bazar, contribuir por PIX ou integrar uma das seis áreas de voluntariado.`,
    },
    {
      id: 'atendimento',
      titulo: 'Como solicitar atendimento fraterno passe tratamento',
      fonte: 'Assistência espiritual · Orientações',
      texto:
        'O atendimento fraterno ocorre às terças e quintas, 19h00. A solicitação pode ser feita pelo app ou site em “Preciso de ajuda”, com escolha de data. Não é necessário ser frequentador da casa. O atendimento espiritual não substitui acompanhamento médico ou psicológico quando necessário.',
    },
    {
      id: 'lives',
      titulo: 'Onde assistir às palestras transmissão ao vivo gravações',
      fonte: 'Biblioteca digital · Lives',
      texto:
        'As palestras são transmitidas ao vivo no canal do CEAK no YouTube e na página do Facebook. As gravações ficam na Biblioteca do app até 48h depois.',
    },
  ];
}
