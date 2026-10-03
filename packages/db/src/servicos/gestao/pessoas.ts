import { formatarCentavos, mesmoDia, partesData } from '@ceak/core/format';
import { frequencia } from '@ceak/core/regras';
import { PERFIL_LABEL, podeAcessar, type Perfil } from '@ceak/core/rbac';
import { type Prisma } from '../../generated/prisma/client';
import { comRls, type ContextoRls } from '../../rls';
import { mes } from './periodo';

export const ABAS_PESSOAS = [
  'Membros',
  'Visitantes',
  'Voluntários',
  'Instrutores',
  'Diretoria',
] as const;
export type AbaPessoas = (typeof ABAS_PESSOAS)[number];

const DIA = 86_400_000;
const dd = (n: number) => String(n).padStart(2, '0');

/** "hoje", "ontem" ou "16/08". */
export function quandoCurto(d: Date | null, agora = new Date()): string {
  if (!d) return '—';
  if (mesmoDia(d, agora)) return 'hoje';
  if (mesmoDia(d, new Date(agora.getTime() - DIA))) return 'ontem';
  const p = partesData(d);
  return `${dd(p.dia)}/${dd(p.mes + 1)}`;
}

function filtroAba(aba: AbaPessoas): Prisma.PessoaWhereInput {
  switch (aba) {
    case 'Visitantes':
      return { perfil: 'VISITANTE' };
    case 'Voluntários':
      return { voluntario: { ativo: true } };
    case 'Instrutores':
      return { turmasMinistradas: { some: {} } };
    case 'Diretoria':
      return { perfil: { in: ['DIRETORIA', 'ADMINISTRADOR'] } };
    default:
      return { perfil: { not: 'VISITANTE' } };
  }
}

export type StatusPessoaGestao = { rotulo: string; tom: 'ok' | 'info' | 'warn' | 'neutral' };

function status(s: string, ultima: Date | null, agora: Date): StatusPessoaGestao {
  if (s === 'NOVO') return { rotulo: 'Novo', tom: 'info' };
  if (s === 'INATIVO') return { rotulo: 'Inativo', tom: 'neutral' };
  if (s === 'AUSENTE') {
    const sem = ultima ? Math.floor((agora.getTime() - ultima.getTime()) / (7 * DIA)) : null;
    return { rotulo: sem ? `Ausente ${sem} sem.` : 'Ausente', tom: 'warn' };
  }
  return { rotulo: 'Ativo', tom: 'ok' };
}

/**
 * Lista de pessoas por aba. Roda com RLS: o Instrutor só enxerga os próprios alunos.
 */
export async function listarPessoas(
  ctx: ContextoRls,
  f: { aba?: string; busca?: string },
  agora = new Date(),
) {
  const aba = (ABAS_PESSOAS as readonly string[]).includes(f.aba ?? '')
    ? (f.aba as AbaPessoas)
    : 'Membros';
  const q = f.busca?.trim().slice(0, 80);
  return comRls(ctx, async (tx) => {
    const where: Prisma.PessoaWhereInput = {
      anonimizadaEm: null,
      ...filtroAba(aba),
      ...(q
        ? {
            OR: [
              { nome: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { whatsapp: { contains: q.replace(/\D/g, '') || q } },
            ],
          }
        : {}),
    };
    const [total, membrosAtivos, pessoas] = await Promise.all([
      tx.pessoa.count({ where: { anonimizadaEm: null } }),
      tx.pessoa.count({
        where: { anonimizadaEm: null, status: 'ATIVO', perfil: { not: 'VISITANTE' } },
      }),
      tx.pessoa.findMany({
        where,
        orderBy: { nome: 'asc' },
        take: 100,
        select: {
          id: true,
          nome: true,
          perfil: true,
          status: true,
          voluntario: { select: { ativo: true } },
          _count: { select: { checkins: true, turmasMinistradas: true } },
          checkins: { orderBy: { criadoEm: 'desc' }, take: 1, select: { criadoEm: true } },
          matriculas: {
            where: { status: { in: ['ATIVA', 'EM_RISCO'] } },
            select: { turma: { select: { curso: { select: { sigla: true, nome: true } } } } },
          },
          turmasMinistradas: { select: { curso: { select: { sigla: true, nome: true } } } },
        },
      }),
    ]);
    return {
      aba,
      total,
      membrosAtivos,
      pessoas: pessoas.map((p) => {
        const ultima = p.checkins[0]?.criadoEm ?? null;
        const papeis = [PERFIL_LABEL[p.perfil as Perfil]];
        if (p.voluntario?.ativo && p.perfil !== 'VOLUNTARIO') papeis.push('Voluntário');
        const estudos = [
          ...p.matriculas.map((m) => m.turma.curso.sigla ?? m.turma.curso.nome),
          ...p.turmasMinistradas.map((t) => `${t.curso.sigla ?? t.curso.nome} (instrução)`),
        ];
        return {
          id: p.id,
          nome: p.nome,
          perfil: papeis.join(' · '),
          ultimaVisita: quandoCurto(ultima, agora),
          checkins: p._count.checkins,
          estudos: [...new Set(estudos)].join(', ') || '—',
          status: status(p.status, ultima, agora),
        };
      }),
    };
  });
}

/** Perfil 360°: dados, jornada, check-ins, estudos, eventos, voluntariado, contribuições, avaliações e solicitações. */
export async function perfil360(
  ctx: ContextoRls & { perfil: Perfil },
  pessoaId: string,
  agora = new Date(),
) {
  return comRls(ctx, async (tx) => {
    const p = await tx.pessoa.findFirst({
      where: { id: pessoaId, anonimizadaEm: null },
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        nascimento: true,
        cidade: true,
        perfil: true,
        status: true,
        membroDesde: true,
        criadoEm: true,
        consentimentoEm: true,
        consentimentoVersao: true,
        voluntario: {
          select: {
            ativo: true,
            areas: { select: { area: { select: { nome: true } } } },
            escalas: {
              where: { inicio: { gte: mes(agora, -1).inicio }, fim: { lte: agora } },
              select: { inicio: true, fim: true },
            },
          },
        },
        usuario: { select: { perfil: true, ultimoAcessoEm: true, ativo: true } },
      },
    });
    if (!p) return null;
    const anterior = mes(agora, -1);
    const [
      checkins,
      ultimo,
      checkinsMesAnterior,
      conquistas,
      matriculas,
      inscricoes,
      palestrasAno,
      doacoes,
      avaliacoes,
      solicitacoesAbertas,
    ] = await Promise.all([
      tx.checkin.count({ where: { pessoaId } }),
      tx.checkin.findFirst({
        where: { pessoaId },
        orderBy: { criadoEm: 'desc' },
        select: { criadoEm: true },
      }),
      tx.checkin.count({
        where: { pessoaId, criadoEm: { gte: anterior.inicio, lt: anterior.fim } },
      }),
      tx.conquistaPessoa.count({ where: { pessoaId } }),
      tx.matricula.findMany({
        where: { pessoaId },
        select: {
          progresso: true,
          status: true,
          turma: {
            select: {
              id: true,
              nome: true,
              curso: { select: { sigla: true, nome: true } },
              aulas: { where: { data: { lte: agora } }, select: { id: true } },
            },
          },
        },
      }),
      tx.inscricao.findMany({
        where: { pessoaId, evento: { inicio: { gte: agora } } },
        select: { evento: { select: { titulo: true } } },
        take: 3,
      }),
      tx.checkin.count({
        where: {
          pessoaId,
          evento: {
            tipo: 'PALESTRA',
            inicio: { gte: new Date(`${partesData(agora).ano}-01-01T00:00:00-03:00`) },
          },
        },
      }),
      tx.doacao.findMany({
        where: { pessoaId, statusPagamento: 'PAGO' },
        orderBy: { criadoEm: 'desc' },
        take: 3,
        select: { valorCentavos: true, itemDescricao: true, destino: true, criadoEm: true },
      }),
      tx.avaliacao.findMany({
        where: { pessoaId },
        select: { nps: true, conteudo: true, clareza: true, aplicabilidade: true },
      }),
      podeAcessar(ctx.perfil, 'assistencia')
        ? tx.solicitacaoAssistencia.count({
            where: { pessoaId, status: { in: ['PENDENTE', 'AGENDADA'] } },
          })
        : Promise.resolve(null),
    ]);
    const presentesPorTurma = async (turmaId: string) =>
      tx.presenca.count({
        where: { pessoaId, presente: true, aula: { turmaId, data: { lte: agora } } },
      });

    const meses = Math.max(
      1,
      Math.round((agora.getTime() - (p.membroDesde ?? p.criadoEm).getTime()) / (30 * DIA)),
    );
    const notas = avaliacoes.flatMap((a) =>
      [a.conteudo, a.clareza, a.aplicabilidade].filter((x): x is number => x != null),
    );
    const npsMedio = avaliacoes.length
      ? avaliacoes.reduce((a, b) => a + b.nps, 0) / avaliacoes.length
      : null;
    const horas = (p.voluntario?.escalas ?? []).reduce(
      (a, e) => a + (e.fim.getTime() - e.inicio.getTime()) / 3_600_000,
      0,
    );
    const nasc = p.nascimento
      ? partesData(new Date(p.nascimento.getTime() + 12 * 3_600_000))
      : null;
    const desde = p.membroDesde ? partesData(p.membroDesde) : null;

    const estudos = await Promise.all(
      matriculas.map(async (m) => {
        const realizadas = m.turma.aulas.length;
        const pres = await presentesPorTurma(m.turma.id);
        return `${m.turma.curso.sigla ?? m.turma.curso.nome} · ${m.turma.nome.replace(/\s+—\s+\S+$/, '')} · ${m.progresso}%${
          realizadas ? ` · ${frequencia(pres, realizadas)}% presença` : ''
        }`;
      }),
    );

    const papeis = [PERFIL_LABEL[p.perfil as Perfil]];
    if (p.voluntario?.ativo)
      papeis.push(`Voluntário (${p.voluntario.areas.map((a) => a.area.nome).join(', ')})`);
    for (const m of matriculas.filter((x) => x.status === 'ATIVA'))
      papeis.push(`Aluno ${m.turma.curso.sigla ?? m.turma.curso.nome}`);

    return {
      id: p.id,
      nome: p.nome,
      resumo: [
        desde ? `Membro desde ${dd(desde.mes + 1)}/${desde.ano}` : null,
        ...[...new Set(papeis)].filter((x) => x !== 'Voluntário'),
        p.whatsapp,
      ]
        .filter(Boolean)
        .join(' · '),
      status: status(p.status, ultimo?.criadoEm ?? null, agora),
      blocos: [
        {
          titulo: 'Dados pessoais',
          linhas: [
            p.email ?? 'sem e-mail',
            p.whatsapp ?? 'sem WhatsApp',
            nasc ? `Nasc. ${dd(nasc.dia)}/${dd(nasc.mes + 1)}/${nasc.ano}` : null,
            p.cidade,
            p.consentimentoEm
              ? `Consentimento LGPD: versão ${p.consentimentoVersao}`
              : 'Consentimento LGPD pendente',
          ].filter((x): x is string => !!x),
        },
        {
          titulo: 'Jornada',
          linhas: [
            desde ? `Membro desde ${dd(desde.mes + 1)}/${desde.ano}` : 'Visitante',
            `${checkinsMesAnterior} ${checkinsMesAnterior === 1 ? 'visita' : 'visitas'} em ${anterior.rotulo}`,
            `${conquistas} ${conquistas === 1 ? 'conquista' : 'conquistas'}`,
          ],
        },
        {
          titulo: 'Check-ins',
          linhas: [
            `${checkins} no total`,
            ultimo ? `Último: ${quandoCurto(ultimo.criadoEm, agora)}` : 'Nenhum check-in',
            `Média ${(checkins / meses).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / mês`,
          ],
        },
        { titulo: 'Estudos', linhas: estudos.length ? estudos : ['Nenhum estudo em andamento'] },
        {
          titulo: 'Eventos',
          linhas: [
            ...inscricoes.map((i) => `${i.evento?.titulo} (inscrito)`),
            `Palestras: ${palestrasAno} em ${partesData(agora).ano}`,
          ],
        },
        {
          titulo: 'Voluntariado',
          linhas: p.voluntario?.ativo
            ? [
                p.voluntario.areas.map((a) => a.area.nome).join(', ') || 'Sem área definida',
                `${p.voluntario.escalas.length} ${p.voluntario.escalas.length === 1 ? 'ação' : 'ações'} desde ${anterior.rotulo} · ${Math.round(horas)}h`,
              ]
            : ['Não é voluntário'],
        },
        {
          titulo: 'Contribuições',
          linhas: doacoes.length
            ? doacoes.map(
                (d) =>
                  `${d.valorCentavos ? `Doação PIX ${formatarCentavos(d.valorCentavos)}` : (d.itemDescricao ?? d.destino)} · ${quandoCurto(d.criadoEm, agora)}`,
              )
            : ['Nenhuma contribuição registrada'],
        },
        {
          titulo: 'Avaliações',
          linhas: avaliacoes.length
            ? [
                `${avaliacoes.length} ${avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}${
                  notas.length
                    ? ` · média ${(notas.reduce((a, b) => a + b, 0) / notas.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`
                    : ''
                }`,
                `NPS individual: ${npsMedio! >= 9 ? 'promotor' : npsMedio! >= 7 ? 'neutro' : 'detrator'}`,
              ]
            : ['Nenhuma avaliação'],
        },
        {
          titulo: 'Solicitações',
          linhas:
            solicitacoesAbertas === null
              ? ['Restrito à assistência']
              : [solicitacoesAbertas ? `${solicitacoesAbertas} em aberto` : 'Nenhuma em aberto'],
        },
      ],
    };
  });
}
