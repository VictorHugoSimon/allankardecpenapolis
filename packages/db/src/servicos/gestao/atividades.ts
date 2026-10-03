import { type Logger } from '@ceak/core/logger';
import { formatarHoraCurta, partesData, slugify } from '@ceak/core/format';
import { ETAPA_FLUXO_LABEL, frequencia, STATUS_EVENTO, TIPO_EVENTO_LABEL } from '@ceak/core/regras';
import { registrarAuditoria } from '../../auditoria';
import { prisma } from '../../client';
import { ErroNegocio } from '../inscricoes';
import { mes } from './periodo';

const dd = (n: number) => String(n).padStart(2, '0');

/** "Sex 02/10 20h" */
export function dataCurtaHora(d: Date): string {
  const p = partesData(d);
  return `${p.diaSemanaCurto} ${dd(p.dia)}/${dd(p.mes + 1)} ${formatarHoraCurta(d)}`;
}

// ─── Agenda ──────────────────────────────────────────────────────────────

/** Atividades do mês (todas, inclusive rascunhos) para o calendário e a tabela da Agenda. */
export async function agendaDoMes(ref: Date) {
  const m = mes(ref);
  const evs = await prisma.evento.findMany({
    where: { inicio: { gte: m.inicio, lt: m.fim } },
    orderBy: { inicio: 'asc' },
    select: {
      id: true,
      titulo: true,
      tipo: true,
      inicio: true,
      local: true,
      responsavel: true,
      status: true,
      palestrante: { select: { nome: true } },
      _count: { select: { inscricoes: true, checkins: true } },
    },
  });
  const p = partesData(new Date(m.inicio.getTime() + 12 * 3_600_000));
  // Grade do calendário: semanas de domingo a sábado.
  const primeiroDiaSemana = new Date(m.inicio.getTime() + 12 * 3_600_000).getUTCDay();
  const diasNoMes = Math.round((m.fim.getTime() - m.inicio.getTime()) / 86_400_000);
  return {
    ano: p.ano,
    mes: p.mes,
    rotulo: `${p.mesLongo.charAt(0).toUpperCase()}${p.mesLongo.slice(1)} ${p.ano}`,
    primeiroDiaSemana,
    diasNoMes,
    atividades: evs.map((e) => {
      const [status, tom] = STATUS_EVENTO[e.status] ?? [e.status, 'neutral'];
      return {
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        tipoLabel: TIPO_EVENTO_LABEL[e.tipo],
        dia: partesData(e.inicio).dia,
        data: dataCurtaHora(e.inicio),
        local: e.local ?? '—',
        responsavel: e.palestrante?.nome ?? e.responsavel ?? '—',
        inscritos: e._count.inscricoes ? String(e._count.inscricoes) : '—',
        status,
        tom,
      };
    }),
  };
}

export interface NovaAtividade {
  titulo: string;
  tipo: keyof typeof TIPO_EVENTO_LABEL;
  inicio: Date;
  fim?: Date;
  local?: string;
  responsavel?: string;
  descricao?: string;
  status: 'RASCUNHO' | 'CONFIRMADO';
  publico: boolean;
}

/** Cria uma atividade na agenda (com auditoria). Rascunhos não aparecem no site nem no App. */
export async function criarAtividade(
  dados: NovaAtividade,
  autor: { usuarioId: string; ip: string | null },
  deps: { log: Logger },
) {
  const base = slugify(`${dados.titulo}-${dados.inicio.toISOString().slice(0, 10)}`);
  const existentes = await prisma.evento.count({ where: { slug: { startsWith: base } } });
  const slug = existentes ? `${base}-${existentes + 1}` : base;
  const ev = await prisma.$transaction(async (tx) => {
    const e = await tx.evento.create({
      data: {
        slug,
        titulo: dados.titulo,
        tipo: dados.tipo,
        inicio: dados.inicio,
        fim: dados.fim,
        local: dados.local,
        responsavel: dados.responsavel,
        descricao: dados.descricao,
        status: dados.status,
        publico: dados.publico,
        etapaFluxo: dados.tipo === 'PALESTRA' ? 'CRIADA' : undefined,
      },
      select: { id: true, titulo: true, status: true, inicio: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: autor.usuarioId,
      acao: 'criou atividade na agenda',
      entidade: 'Evento',
      entidadeId: e.id,
      antes: null,
      depois: { titulo: e.titulo, status: e.status, inicio: e.inicio.toISOString() },
      ip: autor.ip,
    });
    return e;
  });
  deps.log.info('APLICACAO', `agenda.atividade.criada · ${ev.titulo}`, {
    rota: '/agenda',
    status: 201,
  });
  return ev;
}

// ─── Eventos ─────────────────────────────────────────────────────────────

/** Eventos recentes e próximos (lista lateral do módulo Eventos). */
export async function listaEventos(agora = new Date()) {
  const evs = await prisma.evento.findMany({
    where: {
      tipo: { in: ['PALESTRA', 'EVENTO'] },
      inicio: {
        gte: new Date(agora.getTime() - 21 * 86_400_000),
        lte: new Date(agora.getTime() + 45 * 86_400_000),
      },
      status: { notIn: ['CANCELADO'] },
    },
    orderBy: { inicio: 'asc' },
    select: {
      id: true,
      titulo: true,
      tipo: true,
      inicio: true,
      status: true,
      palestrante: { select: { nome: true } },
      responsavel: true,
    },
  });
  return evs.map((e) => {
    const [status, tom] = STATUS_EVENTO[e.status] ?? [e.status, 'neutral'];
    return {
      id: e.id,
      titulo: e.tipo === 'PALESTRA' ? `Palestra: ${e.titulo}` : e.titulo,
      data: dataCurtaHora(e.inicio).replace(/ (\d+h)/, ' · $1'),
      status,
      tom,
    };
  });
}

/** Detalhe do evento: indicadores, avaliações médias, comentários e etapa do fluxo da palestra. */
export async function detalheEvento(id: string) {
  const e = await prisma.evento.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      titulo: true,
      tipo: true,
      inicio: true,
      fim: true,
      local: true,
      status: true,
      etapaFluxo: true,
      publico: true,
      gravacaoUrl: true,
      responsavel: true,
      palestrante: { select: { nome: true } },
      _count: { select: { inscricoes: true, checkins: true, avaliacoes: true } },
      avaliacoes: {
        orderBy: { criadoEm: 'desc' },
        select: {
          nps: true,
          conteudo: true,
          clareza: true,
          aplicabilidade: true,
          comentario: true,
          sugestao: true,
        },
      },
    },
  });
  if (!e) return null;
  const av = e.avaliacoes;
  const media = (k: 'conteudo' | 'clareza' | 'aplicabilidade') => {
    const v = av.map((a) => a[k]).filter((x): x is number => x != null);
    return v.length
      ? (v.reduce((a, b) => a + b, 0) / v.length).toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : '—';
  };
  const nps = av.length
    ? Math.round(
        ((av.filter((a) => a.nps >= 9).length - av.filter((a) => a.nps <= 6).length) / av.length) *
          100,
      )
    : null;
  const [status, tom] = STATUS_EVENTO[e.status] ?? [e.status, 'neutral'];
  const comentarios = av
    .flatMap((a) => [a.comentario, a.sugestao])
    .filter((x): x is string => !!x)
    .slice(0, 5);
  return {
    id: e.id,
    slug: e.slug,
    titulo: e.tipo === 'PALESTRA' ? `Palestra: ${e.titulo}` : e.titulo,
    tituloCurto: e.titulo,
    tipo: e.tipo,
    data: dataCurtaHora(e.inicio).replace(/ (\d+h)/, ' · $1'),
    inicio: e.inicio,
    quem: e.palestrante?.nome ?? e.responsavel ?? '—',
    local: e.local ?? '—',
    status,
    tom,
    publico: e.publico,
    indicadores: [
      ['Inscritos', String(e._count.inscricoes)],
      ['Check-ins', String(e._count.checkins)],
      ['Avaliações', String(e._count.avaliacoes)],
      ['NPS', nps === null ? '—' : String(nps)],
    ] as [string, string][],
    notas: [
      ['Conteúdo', media('conteudo')],
      ['Clareza', media('clareza')],
      ['Aplicabilidade', media('aplicabilidade')],
    ] as [string, string][],
    comentarios: comentarios.length
      ? comentarios.map((c) => `“${c}”`)
      : [
          e.status === 'ENCERRADO'
            ? 'Nenhum comentário registrado.'
            : 'Avaliações abertas após o encerramento.',
        ],
    fluxo: e.tipo === 'PALESTRA' && e.etapaFluxo ? ETAPA_FLUXO_LABEL[e.etapaFluxo] : null,
    checkinDisponivel: e.status !== 'CANCELADO' && e.status !== 'RASCUNHO',
  };
}

// ─── Estudos ─────────────────────────────────────────────────────────────

const STATUS_TURMA = {
  ATIVA: ['Ativo', 'ok'],
  EM_RISCO: ['Em risco', 'warn'],
  ENCERRADA: ['Encerrada', 'neutral'],
} as const;

/**
 * Estudos e cursos: indicadores, turmas e alunos da turma selecionada.
 * `instrutorId` limita às turmas do Instrutor (perfil Instrutor).
 */
export async function painelEstudos(
  f: { turmaId?: string; instrutorId?: string },
  agora = new Date(),
) {
  const turmas = await prisma.turma.findMany({
    where: f.instrutorId ? { instrutorId: f.instrutorId } : {},
    orderBy: [{ curso: { ordem: 'asc' } }, { nome: 'asc' }],
    select: {
      id: true,
      nome: true,
      encontros: true,
      progresso: true,
      status: true,
      curso: { select: { sigla: true, nome: true } },
      instrutor: { select: { nome: true } },
      matriculas: { select: { pessoaId: true, status: true } },
      aulas: { where: { data: { lte: agora } }, select: { id: true } },
    },
  });
  const ids = turmas.map((t) => t.id);
  const presencas = await prisma.presenca.findMany({
    where: { aula: { turmaId: { in: ids }, data: { lte: agora } } },
    select: { pessoaId: true, aulaId: true, presente: true },
  });
  const aulaTurma = new Map(turmas.flatMap((t) => t.aulas.map((a) => [a.id, t.id] as const)));
  // Presenças e chamadas registradas por aluno (quem não tem chamada não entra na média).
  const presentes = new Map<string, number>();
  const chamadas = new Map<string, number>();
  for (const p of presencas) {
    const k = `${aulaTurma.get(p.aulaId)}:${p.pessoaId}`;
    chamadas.set(k, (chamadas.get(k) ?? 0) + 1);
    if (p.presente) presentes.set(k, (presentes.get(k) ?? 0) + 1);
  }
  const freqTurma = (t: (typeof turmas)[number]) => {
    const comChamada = t.matriculas.filter(
      (m) => m.status !== 'TRANCADA' && chamadas.has(`${t.id}:${m.pessoaId}`),
    );
    if (!t.aulas.length || !comChamada.length) return null;
    const soma = comChamada.reduce(
      (a, m) => a + frequencia(presentes.get(`${t.id}:${m.pessoaId}`) ?? 0, t.aulas.length),
      0,
    );
    return Math.round(soma / comChamada.length);
  };
  const linhas = turmas.map((t) => {
    const [status, tom] = STATUS_TURMA[t.status];
    const f = freqTurma(t);
    return {
      id: t.id,
      curso: t.curso.sigla ?? t.curso.nome,
      turma: t.nome,
      instrutor: t.instrutor?.nome ?? '—',
      encontros: t.encontros,
      alunos: t.matriculas.filter((m) => m.status !== 'TRANCADA').length,
      frequencia: f === null ? '—' : `${f}%`,
      frequenciaNum: f,
      progresso: t.progresso ?? '—',
      status,
      tom,
    };
  });
  const sel =
    turmas.find((t) => t.id === f.turmaId) ??
    [...turmas].sort((a, b) => b.matriculas.length - a.matriculas.length)[0];
  const alunos = sel
    ? await prisma.matricula.findMany({
        where: { turmaId: sel.id, status: { not: 'TRANCADA' } },
        orderBy: { pessoa: { nome: 'asc' } },
        select: { status: true, pessoa: { select: { id: true, nome: true } } },
      })
    : [];
  const [preInscricoes, trancadas, totalMatriculas] = await Promise.all([
    prisma.inscricao.count({
      where: {
        cursoId: { not: null },
        ...(f.instrutorId ? { curso: { turmas: { some: { instrutorId: f.instrutorId } } } } : {}),
      },
    }),
    prisma.matricula.count({ where: { status: 'TRANCADA', turmaId: { in: ids } } }),
    prisma.matricula.count({ where: { turmaId: { in: ids } } }),
  ]);
  const comFreq = linhas.filter((l) => l.frequenciaNum !== null);
  return {
    kpis: {
      alunos: new Set(
        turmas.flatMap((t) =>
          t.matriculas.filter((m) => m.status !== 'TRANCADA').map((m) => m.pessoaId),
        ),
      ).size,
      turmasAtivas: turmas.filter((t) => t.status !== 'ENCERRADA').length,
      frequenciaMedia: comFreq.length
        ? Math.round(comFreq.reduce((a, l) => a + l.frequenciaNum!, 0) / comFreq.length)
        : null,
      evasao: totalMatriculas ? Math.round((trancadas / totalMatriculas) * 100) : 0,
      preInscricoes,
    },
    turmas: linhas,
    selecionada: sel
      ? {
          id: sel.id,
          titulo: `${sel.curso.sigla ?? sel.curso.nome} · ${sel.nome}`,
          detalhe: `${sel.instrutor?.nome ?? 'Sem instrutor'} · ${sel.encontros}`,
          alunos: alunos.map((a) => {
            const pres = presentes.get(`${sel.id}:${a.pessoa.id}`) ?? 0;
            // Sem chamada registrada (ex.: estudo aberto), não há frequência a mostrar.
            const total = chamadas.has(`${sel.id}:${a.pessoa.id}`) ? sel.aulas.length : 0;
            const fr = frequencia(pres, total);
            const emRisco = a.status === 'EM_RISCO' || (total > 0 && fr < 75);
            return {
              id: a.pessoa.id,
              nome: a.pessoa.nome,
              frequencia: total ? `${fr}%` : '—',
              presencas: total ? `${pres}/${total}` : '—',
              status: emRisco ? 'Em risco' : 'Ativo',
              tom: emRisco ? ('warn' as const) : ('ok' as const),
            };
          }),
        }
      : null,
  };
}

/** Garante que a turma pertence ao Instrutor (quando houver restrição). */
export async function turmaDoInstrutor(turmaId: string, instrutorId: string) {
  const t = await prisma.turma.findFirst({
    where: { id: turmaId, instrutorId },
    select: { id: true },
  });
  if (!t) throw new ErroNegocio('Turma não encontrada.', 'nao_encontrado');
  return t;
}
