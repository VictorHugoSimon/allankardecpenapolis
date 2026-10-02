/**
 * Seed de desenvolvimento com os dados fictícios dos protótipos (docs/design).
 * Data de referência: sexta-feira, 02/10/2026 (a mesma dos protótipos).
 *
 * ATENÇÃO: apaga e recria todos os dados. Bloqueado em produção.
 *   pnpm db:seed
 */
import { hashSenha } from '@ceak/core/auth';
import { TERMO_LGPD_VERSAO } from '@ceak/core/validacao';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dirname, '../../../.env'), quiet: true });

const { prisma } = await import('../src/client');
const {
  Perfil,
  TipoEvento,
  StatusEvento,
  StatusConteudo,
  Canal,
  TipoAprovacao,
  TipoLancamento,
  StatusLancamento,
  CategoriaEstoque,
  UnidadeMedida,
  OrigemProduto,
  EstadoProduto,
  StatusPedido,
  StatusPagamento,
  FormaDoacao,
  TipoAssistencia,
  StatusAssistencia,
  StatusConciliacao,
  StatusIntegracao,
  NivelLog,
  CategoriaLog,
  StatusTurma,
  StatusMatricula,
  StatusPessoa,
  StatusComunicacao,
  TipoMovimentacao,
  StatusExecucao,
  EtapaFluxoPalestra,
} = await import('../src/generated/prisma/enums');

if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'sim') {
  console.error('Seed bloqueado em produção (defina SEED_FORCE=sim para forçar).');
  process.exit(1);
}

/** Data/hora em Penápolis (UTC−3). */
const d = (iso: string) => new Date(`${iso}${iso.length === 10 ? 'T12:00:00' : ''}-03:00`);
const reais = (v: number) => Math.round(v * 100);
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function limpar() {
  const tabelas = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const lista = tabelas.map((t) => `"public"."${t.tablename}"`).join(', ');
  if (lista) await prisma.$executeRawUnsafe(`TRUNCATE ${lista} RESTART IDENTITY CASCADE`);
}

async function main() {
  console.log('→ Limpando dados…');
  await limpar();

  // ─── Pessoas e usuários ────────────────────────────────────────────────
  console.log('→ Pessoas e usuários');
  const senha = await hashSenha(process.env.SEED_SENHA ?? 'ceak-dev-2026');
  const consent = { consentimentoEm: d('2026-01-10'), consentimentoVersao: TERMO_LGPD_VERSAO };

  const pessoasRaw: {
    nome: string;
    email: string;
    perfil: (typeof Perfil)[keyof typeof Perfil];
    status?: (typeof StatusPessoa)[keyof typeof StatusPessoa];
    whatsapp?: string;
    usuario?: { coord?: boolean; ativo?: boolean; ultimo?: Date };
  }[] = [
    {
      nome: 'Antônio Ferreira',
      email: 'antonio.ferreira@allankardecpenapolis.com.br',
      perfil: Perfil.ADMINISTRADOR,
      status: StatusPessoa.ATIVO,
      usuario: { ultimo: d('2026-10-02T10:02') },
    },
    {
      nome: 'Lúcia Moraes',
      email: 'lucia.moraes@allankardecpenapolis.com.br',
      perfil: Perfil.DIRETORIA,
      status: StatusPessoa.ATIVO,
      usuario: { ultimo: d('2026-10-01T18:00') },
    },
    {
      nome: 'Maria Silva',
      email: 'maria.silva@allankardecpenapolis.com.br',
      perfil: Perfil.TESOURARIA,
      status: StatusPessoa.ATIVO,
      usuario: { ultimo: d('2026-10-02T10:19') },
    },
    {
      nome: 'Paulo Mendes',
      email: 'paulo.mendes@allankardecpenapolis.com.br',
      perfil: Perfil.SECRETARIA,
      status: StatusPessoa.ATIVO,
      usuario: { ultimo: d('2026-10-02T09:40') },
    },
    {
      nome: 'Renata Campos',
      email: 'renata.campos@allankardecpenapolis.com.br',
      perfil: Perfil.COORDENADOR,
      status: StatusPessoa.ATIVO,
      usuario: { ultimo: d('2026-09-28T20:00') },
    },
    {
      nome: 'Sueli Andrade',
      email: 'sueli.andrade@allankardecpenapolis.com.br',
      perfil: Perfil.COORDENADOR,
      status: StatusPessoa.ATIVO,
      usuario: { coord: true, ultimo: d('2026-09-28T19:00') },
    },
    {
      nome: 'Helena Prado',
      email: 'helena.prado@allankardecpenapolis.com.br',
      perfil: Perfil.INSTRUTOR,
      status: StatusPessoa.ATIVO,
      usuario: { ultimo: d('2026-09-30T21:00') },
    },
    {
      nome: 'Victor Alves',
      email: 'victor.alves@email.com',
      perfil: Perfil.VOLUNTARIO,
      status: StatusPessoa.ATIVO,
      whatsapp: '+5518996541120',
      usuario: { ultimo: d('2026-10-02T19:54') },
    },
    {
      nome: 'Carlos Teixeira',
      email: 'carlos.t@allankardecpenapolis.com.br',
      perfil: Perfil.SECRETARIA,
      status: StatusPessoa.INATIVO,
      usuario: { ativo: false, ultimo: d('2026-06-02T10:00') },
    },
    {
      nome: 'João Batista Rocha',
      email: 'joao.rocha@email.com',
      perfil: Perfil.MEMBRO,
      status: StatusPessoa.AUSENTE,
      usuario: {},
    },
    {
      nome: 'Carla Nogueira',
      email: 'carla.nogueira@email.com',
      perfil: Perfil.VISITANTE,
      status: StatusPessoa.NOVO,
      usuario: {},
    },
    {
      nome: 'Marta Andrade',
      email: 'marta.andrade@email.com',
      perfil: Perfil.MEMBRO,
      status: StatusPessoa.ATIVO,
    },
    {
      nome: 'Rogério Lima',
      email: 'rogerio.lima@email.com',
      perfil: Perfil.INSTRUTOR,
      status: StatusPessoa.ATIVO,
    },
    {
      nome: 'Marcos Tavares',
      email: 'marcos.tavares@email.com',
      perfil: Perfil.VISITANTE,
      status: StatusPessoa.NOVO,
    },
    {
      nome: 'Cláudia Ribeiro',
      email: 'claudia.ribeiro@email.com',
      perfil: Perfil.MEMBRO,
      status: StatusPessoa.ATIVO,
    },
    {
      nome: 'Roberto Martins',
      email: 'roberto.martins@email.com',
      perfil: Perfil.MEMBRO,
      status: StatusPessoa.ATIVO,
    },
    {
      nome: 'Fernanda Lima',
      email: 'fernanda.lima@email.com',
      perfil: Perfil.VISITANTE,
      status: StatusPessoa.NOVO,
    },
    {
      nome: 'Marina Souza',
      email: 'marina.souza@email.com',
      perfil: Perfil.MEMBRO,
      status: StatusPessoa.ATIVO,
    },
    {
      nome: 'Jorge Pereira',
      email: 'jorge.pereira@email.com',
      perfil: Perfil.MEMBRO,
      status: StatusPessoa.ATIVO,
    },
  ];

  const P: Record<string, { id: string; usuarioId?: string }> = {};
  for (const p of pessoasRaw) {
    const pessoa = await prisma.pessoa.create({
      data: {
        nome: p.nome,
        email: p.email,
        whatsapp: p.whatsapp,
        perfil: p.perfil,
        status: p.status ?? StatusPessoa.ATIVO,
        cidade: 'Penápolis – SP',
        membroDesde: p.perfil === Perfil.VISITANTE ? null : d('2024-03-01'),
        ...consent,
      },
    });
    P[p.nome] = { id: pessoa.id };
    if (p.usuario) {
      const u = await prisma.usuario.create({
        data: {
          pessoaId: pessoa.id,
          email: p.email,
          perfil: p.perfil,
          coordAssistencia: p.usuario.coord ?? false,
          ativo: p.usuario.ativo ?? true,
          doisFatores: (
            [Perfil.ADMINISTRADOR, Perfil.DIRETORIA, Perfil.TESOURARIA] as string[]
          ).includes(p.perfil),
          ultimoAcessoEm: p.usuario.ultimo,
          credencial: { create: { senhaHash: senha } },
        },
      });
      P[p.nome]!.usuarioId = u.id;
    }
  }
  const pid = (nome: string) => P[nome]!.id;
  const uid = (nome: string) => P[nome]!.usuarioId!;
  await prisma.pessoa.update({
    where: { id: pid('Victor Alves') },
    data: { nascimento: d('1987-05-14'), membroDesde: d('2024-03-01') },
  });

  // ─── Eventos (agenda de outubro/2026) ─────────────────────────────────
  console.log('→ Agenda e eventos');
  const ev = async (e: {
    titulo: string;
    tipo: (typeof TipoEvento)[keyof typeof TipoEvento];
    inicio: string;
    fim?: string;
    local: string;
    descricao: string;
    palestrante?: string;
    gravacao?: { url: string; duracaoMin: number };
    responsavel?: string;
    status?: (typeof StatusEvento)[keyof typeof StatusEvento];
    etapa?: (typeof EtapaFluxoPalestra)[keyof typeof EtapaFluxoPalestra];
    slugBase?: string;
  }) =>
    prisma.evento.create({
      data: {
        slug: slug(`${e.slugBase ?? e.titulo}-${e.inicio.slice(0, 10)}`),
        titulo: e.titulo,
        tipo: e.tipo,
        inicio: d(e.inicio),
        fim: e.fim ? d(e.fim) : undefined,
        local: e.local,
        descricao: e.descricao,
        palestranteId: e.palestrante ? pid(e.palestrante) : undefined,
        responsavel: e.responsavel,
        status: e.status ?? StatusEvento.CONFIRMADO,
        etapaFluxo: e.etapa,
        transmissaoUrl:
          e.tipo === TipoEvento.PALESTRA
            ? 'https://www.youtube.com/@ceakpenapolis/live'
            : undefined,
        gravacaoUrl: e.gravacao?.url,
        gravacaoDuracaoMin: e.gravacao?.duracaoMin,
      },
    });

  // Gravações de setembro (palestras encerradas).
  const gravacoes = [
    [
      'A coragem da fé',
      'Antônio Ferreira',
      '2026-09-25T20:00',
      48,
      'A fé raciocinada como apoio nas decisões do cotidiano.',
    ],
    [
      'O bem que se faz em silêncio',
      'Helena Prado',
      '2026-09-23T20:00',
      45,
      'A caridade discreta, que não espera reconhecimento.',
    ],
    [
      'Os obstáculos como lições',
      'Rogério Lima',
      '2026-09-18T20:00',
      50,
      'As dificuldades como oportunidades de aprendizado.',
    ],
    [
      'Paz interior em tempos difíceis',
      'Lúcia Moraes',
      '2026-09-16T20:00',
      47,
      'Serenidade e confiança diante das provas.',
    ],
    [
      'O que é o Espiritismo',
      'Paulo Mendes',
      '2026-09-11T20:00',
      55,
      'Uma introdução à Doutrina Espírita para quem chega.',
    ],
  ] as const;
  for (const [titulo, palestrante, inicio, duracaoMin, descricao] of gravacoes) {
    await ev({
      titulo,
      tipo: TipoEvento.PALESTRA,
      inicio,
      local: 'Salão principal',
      palestrante,
      descricao,
      status: StatusEvento.ENCERRADO,
      etapa: EtapaFluxoPalestra.PUBLICADA,
      gravacao: { url: 'https://www.youtube.com/@ceakpenapolis/videos', duracaoMin },
    });
  }

  const familia = await ev({
    titulo: 'Família e Espiritualidade',
    slugBase: 'familia-e-espiritualidade',
    tipo: TipoEvento.PALESTRA,
    inicio: '2026-09-30T20:00',
    local: 'Salão principal',
    palestrante: 'Marta Andrade',
    descricao: 'A família como espaço de reencontro entre espíritos.',
    status: StatusEvento.ENCERRADO,
    etapa: EtapaFluxoPalestra.APROVACAO_PUBLICACAO,
    gravacao: { url: 'https://www.youtube.com/@ceakpenapolis/videos', duracaoMin: 52 },
  });
  const perdao = await ev({
    titulo: 'O perdão como libertação',
    tipo: TipoEvento.PALESTRA,
    inicio: '2026-10-02T20:00',
    local: 'Salão principal',
    palestrante: 'Rogério Lima',
    descricao: 'O perdão como exercício diário e o alívio que ele traz para quem perdoa.',
    status: StatusEvento.EM_ANDAMENTO,
    etapa: EtapaFluxoPalestra.CHECKIN_ABERTO,
  });
  await ev({
    titulo: 'Estudo do Evangelho',
    slugBase: 'estudo-do-evangelho',
    tipo: TipoEvento.ESTUDO,
    inicio: '2026-10-03T19:30',
    local: 'Sala 2',
    responsavel: 'Coord. Paulo Mendes',
    descricao:
      'Leitura comentada de O Evangelho Segundo o Espiritismo, capítulo X — Bem-aventurados os misericordiosos.',
  });
  const esdeAula = await ev({
    titulo: 'ESDE — Turma 2026, módulo 3',
    tipo: TipoEvento.CURSO,
    inicio: '2026-10-05T20:00',
    local: 'Sala 1',
    responsavel: 'Instrutora Helena Prado',
    descricao: 'Estudo Sistematizado da Doutrina Espírita: a justiça da reencarnação.',
  });
  await ev({
    titulo: 'Atendimento fraterno e passe',
    tipo: TipoEvento.ASSISTENCIA,
    inicio: '2026-10-06T19:00',
    local: 'Recepção',
    responsavel: 'Equipe de assistência',
    descricao: 'Escuta fraterna e passe. Sem agendamento prévio — chegada até 19h30.',
  });
  await ev({
    titulo: 'A esperança que sustenta',
    tipo: TipoEvento.PALESTRA,
    inicio: '2026-10-07T20:00',
    local: 'Salão principal',
    palestrante: 'Marta Andrade',
    descricao: 'A esperança como força ativa diante das provas, à luz do Evangelho.',
    etapa: EtapaFluxoPalestra.APROVACAO_DIVULGACAO,
  });
  await ev({
    titulo: 'Caridade sem distinção',
    tipo: TipoEvento.PALESTRA,
    inicio: '2026-10-09T20:00',
    local: 'Salão principal',
    palestrante: 'Paulo Mendes',
    descricao: 'A caridade material e moral como base da vivência espírita.',
    status: StatusEvento.AGUARDANDO_APROVACAO,
    etapa: EtapaFluxoPalestra.CRIADA,
  });
  await ev({
    titulo: 'Ponto de coleta — Campanha do Agasalho',
    tipo: TipoEvento.CAMPANHA,
    inicio: '2026-10-10T09:00',
    fim: '2026-10-10T12:00',
    local: 'Portão lateral',
    responsavel: 'Assistência social',
    descricao: 'Recebimento drive-thru de casacos, cobertores e meias em bom estado.',
  });
  await ev({
    titulo: 'Estudo do Evangelho',
    slugBase: 'estudo-do-evangelho',
    tipo: TipoEvento.ESTUDO,
    inicio: '2026-10-10T19:30',
    local: 'Sala 2',
    responsavel: 'Coord. Paulo Mendes',
    descricao: 'Capítulo XI — Amar o próximo como a si mesmo.',
  });
  await ev({
    titulo: 'Mediunidade com Jesus',
    tipo: TipoEvento.PALESTRA,
    inicio: '2026-10-14T20:00',
    local: 'Salão principal',
    palestrante: 'Antônio Ferreira',
    descricao: 'A mediunidade como instrumento de serviço, à luz das obras de Allan Kardec.',
  });
  await ev({
    titulo: 'Bazar beneficente de primavera',
    tipo: TipoEvento.EVENTO,
    inicio: '2026-10-17T08:00',
    fim: '2026-10-17T12:00',
    local: 'Pátio',
    responsavel: 'Voluntárias do bazar',
    descricao: 'Roupas, livros e utilidades doadas a preços simbólicos.',
  });
  await ev({
    titulo: 'A lei de causa e efeito',
    tipo: TipoEvento.PALESTRA,
    inicio: '2026-10-21T20:00',
    local: 'Salão principal',
    palestrante: 'Helena Prado',
    descricao: 'Responsabilidade, escolhas e a justiça divina sem culpa nem medo.',
  });
  await ev({
    titulo: 'Encontro de trabalhadores',
    tipo: TipoEvento.EVENTO,
    inicio: '2026-10-25T09:00',
    local: 'Salão principal',
    responsavel: 'Diretoria',
    descricao: 'Encontro anual das equipes de trabalho da casa.',
    status: StatusEvento.RASCUNHO,
  });
  await ev({
    titulo: 'O valor da prece',
    tipo: TipoEvento.PALESTRA,
    inicio: '2026-10-28T20:00',
    local: 'Salão principal',
    palestrante: 'Lúcia Moraes',
    descricao: 'A prece como conversa sincera e fonte de equilíbrio.',
  });

  // Inscrições, check-ins e avaliações (amostra).
  const membros = [
    'Victor Alves',
    'Renata Campos',
    'Sueli Andrade',
    'Cláudia Ribeiro',
    'João Batista Rocha',
    'Marina Souza',
    'Jorge Pereira',
    'Roberto Martins',
  ];
  for (const n of membros) {
    await prisma.inscricao.create({ data: { eventoId: familia.id, pessoaId: pid(n) } });
    await prisma.checkin.create({
      data: {
        eventoId: familia.id,
        pessoaId: pid(n),
        origem: 'QR',
        criadoEm: d('2026-09-30T19:50'),
      },
    });
  }
  await prisma.inscricao.create({
    data: { eventoId: perdao.id, pessoaId: pid('Carla Nogueira'), primeiraVez: true },
  });
  await prisma.checkin.create({
    data: {
      eventoId: perdao.id,
      pessoaId: pid('Victor Alves'),
      origem: 'QR',
      criadoEm: d('2026-10-02T19:54'),
    },
  });
  const notas = [10, 9, 10, 8, 9, 10, 7, 10];
  for (const [i, n] of membros.entries()) {
    await prisma.avaliacao.create({
      data: {
        eventoId: familia.id,
        pessoaId: pid(n),
        nps: notas[i]!,
        conteudo: 5,
        clareza: i % 3 ? 5 : 4,
        aplicabilidade: i % 2 ? 5 : 4,
      },
    });
  }

  // ─── Estudos ─────────────────────────────────────────────────────────
  console.log('→ Estudos');
  const cursos = [
    {
      nome: 'Estudo Sistematizado da Doutrina Espírita (ESDE)',
      sigla: 'ESDE',
      tag: 'CURSO · 2 ANOS',
      encontros: 'Segundas ou quintas, 20h',
      statusInscricao: 'Pré-inscrição 2027 aberta',
      destaque: true,
      publico: 'Adultos · iniciantes',
      duracao: '2 anos · 5 módulos',
      descricao:
        'Percurso completo pelas obras básicas de Allan Kardec, com roteiros, leituras e discussão em grupo.',
    },
    {
      nome: 'Estudo do Evangelho',
      sigla: 'Evangelho',
      tag: 'ABERTO A TODOS',
      encontros: 'Sábados, 19h30',
      statusInscricao: 'Participação livre',
      destaque: true,
      publico: 'Aberto a todos',
      duracao: 'Contínuo',
      descricao:
        'Leitura comentada de O Evangelho Segundo o Espiritismo, capítulo a capítulo. Não exige inscrição.',
    },
    {
      nome: 'Educação mediúnica',
      sigla: 'Mediunidade',
      tag: 'CONCLUINTES DO ESDE',
      encontros: 'Terças, 20h',
      statusInscricao: 'Turma em andamento',
      publico: 'Concluintes do ESDE',
      duracao: '3 anos',
      descricao:
        'Estudo de O Livro dos Médiuns e prática orientada, com acompanhamento da diretoria doutrinária.',
    },
    {
      nome: 'Mocidade Espírita',
      sigla: 'Mocidade',
      tag: 'JOVENS 14–21',
      encontros: 'Domingos, 9h30',
      statusInscricao: 'Inscrições abertas',
      destaque: true,
      publico: 'Jovens de 14 a 21 anos',
      duracao: 'Ciclos anuais',
      descricao:
        'Encontros com estudo, música, debates e participação nas ações solidárias da casa.',
    },
    {
      nome: 'Evangelização infantil',
      sigla: 'Evangelização',
      tag: 'CRIANÇAS 5–12',
      encontros: 'Domingos, 9h30',
      statusInscricao: 'Inscrições abertas',
      publico: 'Crianças de 5 a 12 anos',
      duracao: 'Ciclos anuais',
      descricao:
        'Atividades lúdicas e histórias que transmitem valores do Evangelho, separadas por faixa etária.',
    },
    {
      nome: 'Estudo das obras complementares',
      sigla: 'Complementares',
      tag: 'ADULTOS',
      encontros: 'Quartas, 18h30',
      statusInscricao: 'Próxima turma em março',
      publico: 'Adultos',
      duracao: 'Semestral',
      descricao:
        'Leitura de obras de André Luiz, Emmanuel e outros autores, relacionadas às obras básicas.',
    },
  ];
  const C: Record<string, string> = {};
  for (const [i, c] of cursos.entries()) {
    const curso = await prisma.curso.create({ data: { ...c, slug: slug(c.sigla), ordem: i } });
    C[c.sigla] = curso.id;
  }
  const turmas = [
    ['ESDE', 'Turma 2026 — seg', 'Helena Prado', 'Seg 20h', 'Mód. 3/5', StatusTurma.ATIVA],
    ['ESDE', 'Turma 2025 — qui', 'Rogério Lima', 'Qui 20h', 'Mód. 2/5', StatusTurma.EM_RISCO],
    ['Evangelho', 'Sábado aberto', 'Paulo Mendes', 'Sáb 19h30', 'Cap. 10/28', StatusTurma.ATIVA],
    [
      'Mediunidade',
      'Educação mediúnica I',
      'Antônio Ferreira',
      'Ter 20h',
      'Mód. 1/3',
      StatusTurma.ATIVA,
    ],
    ['Mocidade', 'Jovens 14–21', 'Renata Campos', 'Dom 9h30', 'Ciclo 2/4', StatusTurma.ATIVA],
    ['Evangelização', 'Infantil 5–12', 'Sueli Andrade', 'Dom 9h30', 'Ano 2026', StatusTurma.ATIVA],
  ] as const;
  // Resumo público dos cards de estudo da home ("{n}" = número de matrículas).
  const publico: Record<
    string,
    { resumoPublico: string; etapaAtual: string; progressoPct: number }
  > = {
    'Turma 2026 — seg': {
      resumoPublico: 'Turma 2026 · segundas, 20h · {n} participantes',
      etapaAtual: 'Módulo 3 de 5',
      progressoPct: 58,
    },
    'Sábado aberto': {
      resumoPublico: 'Sábados, 19h30 · sem inscrição',
      etapaAtual: 'Capítulo 10 de 28',
      progressoPct: 36,
    },
    'Jovens 14–21': {
      resumoPublico: 'Domingos, 9h30 · {n} jovens',
      etapaAtual: 'Ciclo 2 de 4',
      progressoPct: 50,
    },
  };
  const T: Record<string, string> = {};
  for (const [curso, nome, instrutor, encontros, progresso, status] of turmas) {
    const t = await prisma.turma.create({
      data: {
        cursoId: C[curso]!,
        nome,
        instrutorId: pid(instrutor),
        encontros,
        progresso,
        status,
        inicio: d('2026-02-02'),
        ...publico[nome],
      },
    });
    T[nome] = t.id;
  }
  // Turma ESDE 2026 — seg: 16 aulas e frequência dos alunos do protótipo.
  const turmaEsde = T['Turma 2026 — seg']!;
  const aulas: string[] = [];
  for (let n = 1; n <= 16; n++) {
    const a = await prisma.aula.create({
      data: {
        turmaId: turmaEsde,
        numero: n,
        titulo: `Aula ${n}`,
        modulo: n <= 6 ? 'Módulo 1' : n <= 11 ? 'Módulo 2' : 'Módulo 3',
        data: new Date(d('2026-06-15T20:00').getTime() + (n - 1) * 7 * 86_400_000),
      },
    });
    aulas.push(a.id);
  }
  // Próximos encontros (exibidos na home).
  await prisma.aula.create({
    data: {
      turmaId: turmaEsde,
      numero: 17,
      titulo: 'Aula 17',
      modulo: 'Módulo 3',
      data: d('2026-10-05T20:00'),
      eventoId: esdeAula.id,
    },
  });
  await prisma.aula.create({
    data: {
      turmaId: T['Sábado aberto']!,
      numero: 11,
      titulo: 'Capítulo X',
      data: d('2026-10-03T19:30'),
    },
  });
  await prisma.aula.create({
    data: {
      turmaId: T['Jovens 14–21']!,
      numero: 1,
      titulo: 'Encontro',
      data: d('2026-10-04T09:30'),
    },
  });
  await prisma.material.create({
    data: {
      cursoId: C.ESDE,
      titulo: 'Apostila ESDE — Módulo 3',
      tipo: 'APOSTILA',
      url: '/materiais/esde-modulo-3.pdf',
    },
  });
  const alunos = [
    ['Victor Alves', 14, 78, StatusMatricula.ATIVA],
    ['Renata Campos', 15, 94, StatusMatricula.ATIVA],
    ['João Batista Rocha', 8, 50, StatusMatricula.EM_RISCO],
    ['Sueli Andrade', 16, 100, StatusMatricula.ATIVA],
    ['Marcos Tavares', 10, 62, StatusMatricula.EM_RISCO],
    ['Cláudia Ribeiro', 13, 81, StatusMatricula.ATIVA],
  ] as const;
  for (const [nome, presentes, progresso, status] of alunos) {
    await prisma.matricula.create({
      data: { turmaId: turmaEsde, pessoaId: pid(nome), progresso, status },
    });
    for (const [i, aulaId] of aulas.entries()) {
      await prisma.presenca.create({
        data: { aulaId, pessoaId: pid(nome), presente: i < presentes },
      });
    }
  }
  await prisma.matricula.create({
    data: { turmaId: T['Sábado aberto']!, pessoaId: pid('Victor Alves'), progresso: 60 },
  });

  // Demais alunos (nomes fictícios) para chegar às turmas do protótipo: ESDE 32, Mocidade 21.
  const nomes = [
    'Ana',
    'Bruno',
    'Camila',
    'Daniel',
    'Elaine',
    'Fábio',
    'Gabriela',
    'Henrique',
    'Isabela',
    'José',
    'Karina',
    'Leonardo',
    'Mariana',
    'Nelson',
    'Olívia',
    'Pedro',
    'Raquel',
    'Sérgio',
    'Tatiane',
    'Vinícius',
    'Aline',
    'Caio',
    'Débora',
    'Eduardo',
    'Fernanda',
    'Gustavo',
    'Helena',
    'Igor',
    'Juliana',
    'Lucas',
    'Mônica',
    'Natália',
    'Otávio',
    'Patrícia',
    'Rafael',
    'Simone',
    'Thiago',
    'Vanessa',
    'Wagner',
    'Yasmin',
    'André',
    'Beatriz',
    'César',
    'Diana',
    'Felipe',
    'Giovana',
    'Hugo',
  ];
  const sobrenomes = [
    'Almeida',
    'Barbosa',
    'Cardoso',
    'Duarte',
    'Esteves',
    'Freitas',
    'Gomes',
    'Honorato',
    'Lopes',
    'Martins',
    'Nunes',
    'Oliveira',
    'Pacheco',
    'Queiroz',
    'Ribeiro',
    'Santos',
    'Teixeira',
    'Vieira',
  ];
  let k = 0;
  const novoAluno = async (turmaId: string, nascimento: string) => {
    const nome = `${nomes[k % nomes.length]} ${sobrenomes[(k * 7) % sobrenomes.length]}`;
    k++;
    const pessoa = await prisma.pessoa.create({
      data: {
        nome,
        perfil: Perfil.MEMBRO,
        status: StatusPessoa.ATIVO,
        cidade: 'Penápolis – SP',
        nascimento: d(nascimento),
        ...consent,
      },
    });
    await prisma.matricula.create({
      data: { turmaId, pessoaId: pessoa.id, progresso: 50 + (k % 40) },
    });
  };
  for (let i = alunos.length; i < 32; i++) await novoAluno(turmaEsde, '1980-03-10');
  for (let i = 0; i < 21; i++) await novoAluno(T['Jovens 14–21']!, '2009-08-20');

  // Conquistas da "Minha jornada".
  const conquistas = [
    ['primeira-visita', 'Primeira visita', 'Você esteve no CEAK pela primeira vez.'],
    ['5-encontros', '5 encontros', 'Participou de 5 atividades.'],
    ['primeiro-estudo', 'Primeiro estudo', 'Concluiu a primeira aula de um estudo.'],
    ['primeiro-voluntariado', 'Primeiro voluntariado', 'Participou da primeira ação voluntária.'],
    ['campanha-solidaria', 'Campanha solidária', 'Contribuiu com uma campanha da casa.'],
  ] as const;
  for (const [i, [chave, titulo, descricao]] of conquistas.entries()) {
    const c = await prisma.conquista.create({ data: { chave, titulo, descricao, ordem: i } });
    if (i < 4)
      await prisma.conquistaPessoa.create({
        data: { pessoaId: pid('Victor Alves'), conquistaId: c.id },
      });
  }

  // ─── Conteúdo e aprovações ────────────────────────────────────────────
  console.log('→ Conteúdo e aprovações');
  const resumo = await prisma.conteudo.create({
    data: {
      titulo: 'Resumo da palestra “Família e Espiritualidade”',
      fonte: 'Gravação YouTube',
      textoOriginal: 'Transcrição automática da palestra pública de 30/09/2026 (Marta Andrade).',
      resumo:
        'A família como espaço de reencontro entre espíritos, à luz de O Livro dos Espíritos (q. 203 a 206).',
      seoTitulo: 'Família e Espiritualidade — resumo da palestra',
      seoDescricao:
        'Resumo da palestra pública de Marta Andrade sobre os laços espirituais na família.',
      tags: ['família', 'palestra', 'O Livro dos Espíritos'],
      fontes: ['Gravação YouTube 30/09/2026', 'O Livro dos Espíritos, q. 203–206'],
      status: StatusConteudo.REVISAO,
      geradoPorIa: true,
      eventoId: familia.id,
      responsavelId: uid('Paulo Mendes'),
      criadoEm: d('2026-10-02T09:40'),
      versoes: {
        create: [
          {
            canal: Canal.BLOG,
            texto:
              'Na palestra pública de 30 de setembro, Marta Andrade abordou a família como espaço de reencontro entre espíritos. Apoiada em O Livro dos Espíritos (questões 203 a 206), lembrou que os laços espirituais antecedem os laços do corpo.',
          },
          {
            canal: Canal.FACEBOOK,
            texto:
              'A família que temos hoje não é obra do acaso. Na palestra de quarta-feira, Marta Andrade falou sobre os laços que atravessam as existências. Assista à gravação completa no link.',
          },
          {
            canal: Canal.INSTAGRAM,
            texto:
              'Laços que atravessam o tempo.\n\nResumo da palestra “Família e Espiritualidade”, com Marta Andrade. Gravação completa no link da bio.\n\n#espiritismo #família #CEAKPenápolis',
          },
          {
            canal: Canal.GOOGLE_BUSINESS,
            texto:
              'Gravação disponível: palestra pública “Família e Espiritualidade”. Palestras todas as quartas-feiras, às 20h. Entrada gratuita.',
          },
        ],
      },
    },
  });
  const conteudos = [
    [
      'Divulgação: O perdão como libertação',
      'Agenda',
      StatusConteudo.RASCUNHO_IA,
      '2026-10-02T08:02',
      true,
      [Canal.INSTAGRAM, Canal.FACEBOOK],
    ],
    [
      'Campanha do Agasalho — 75% da meta',
      'Campanhas',
      StatusConteudo.APROVADO,
      '2026-10-01T10:00',
      false,
      [Canal.BLOG, Canal.GOOGLE_BUSINESS],
    ],
    [
      'Bazar de primavera 17/10',
      'Agenda',
      StatusConteudo.AGENDADO,
      '2026-10-05T09:00',
      false,
      [Canal.INSTAGRAM, Canal.GOOGLE_BUSINESS],
    ],
    [
      'Mensagem da semana — Cap. X',
      'Estudo do Evangelho',
      StatusConteudo.PROCESSANDO,
      '2026-10-02T10:00',
      true,
      [Canal.FACEBOOK],
    ],
    [
      'Novo horário da biblioteca',
      'Secretaria',
      StatusConteudo.CAPTURADO,
      '2026-10-02T10:10',
      false,
      [Canal.GOOGLE_BUSINESS],
    ],
    [
      'Agradecimento aos voluntários',
      'Voluntariado',
      StatusConteudo.ERRO,
      '2026-10-01T18:00',
      false,
      [Canal.INSTAGRAM],
    ],
  ] as const;
  const conteudoIds: Record<string, string> = {};
  for (const [titulo, fonte, status, quando, ia, canais] of conteudos) {
    const c = await prisma.conteudo.create({
      data: {
        titulo,
        fonte,
        status,
        geradoPorIa: ia,
        criadoEm: d(quando),
        agendadoPara: status === StatusConteudo.AGENDADO ? d(quando) : undefined,
        erro:
          status === StatusConteudo.ERRO
            ? 'instagram.graph: token expirado (OAuthException 190)'
            : undefined,
        responsavelId: ia ? uid('Paulo Mendes') : uid('Lúcia Moraes'),
        versoes: { create: canais.map((canal) => ({ canal, texto: titulo })) },
      },
    });
    conteudoIds[titulo] = c.id;
  }

  // Artigos publicados no blog (já aprovados por um responsável).
  const posts = [
    {
      titulo: 'Campanha do Agasalho chega a 75% da meta',
      data: '2026-09-29T10:00',
      categoria: 'Solidariedade',
      autor: 'Assistência social',
      fonte: 'Campanhas',
      ia: false,
      lead: 'Faltam 122 peças para atingir a meta de 500 casacos, cobertores e meias até 31 de outubro.',
      corpo: [
        'A Campanha do Agasalho 2026 alcançou 378 peças arrecadadas, o equivalente a 75% da meta. As doações são triadas pelas voluntárias do bazar e entregues às 126 famílias acompanhadas pela assistência social do CEAK.',
        'Os itens mais necessários neste momento são casacos infantis, cobertores de casal e meias. O ponto de coleta drive-thru funciona aos sábados, das 9h às 12h, no portão lateral; durante a semana, as doações podem ser entregues na recepção, de terça a sábado, das 19h às 21h30.',
        'A prestação de contas da campanha será publicada na página de Transparência ao final de novembro.',
      ],
    },
    {
      titulo: 'Resumo da palestra “A coragem da fé”',
      data: '2026-09-26T10:00',
      categoria: 'Palestras',
      autor: 'Paulo Mendes',
      fonte: 'Gravação YouTube',
      ia: true,
      lead: 'Antônio Ferreira tratou da fé raciocinada como apoio nas decisões do cotidiano.',
      corpo: [
        'Na palestra pública de 25 de setembro, o presidente do CEAK, Antônio Ferreira, partiu do capítulo XIX de O Evangelho Segundo o Espiritismo para distinguir a fé cega da fé raciocinada, que “pode encarar a razão face a face”.',
        'O palestrante destacou que a coragem da fé não está na ausência de medo, mas na disposição de agir com confiança e responsabilidade. A gravação completa está disponível na Biblioteca.',
      ],
    },
    {
      titulo: 'Pré-inscrição aberta para as turmas do ESDE 2027',
      data: '2026-09-18T10:00',
      categoria: 'Estudos',
      autor: 'Helena Prado',
      fonte: 'Estudos',
      ia: false,
      lead: 'Novas turmas às segundas e quintas, com início em fevereiro.',
      corpo: [
        'Estão abertas, até 30 de novembro, as pré-inscrições para as turmas 2027 do Estudo Sistematizado da Doutrina Espírita. O curso tem duração de dois anos, com encontros semanais de 1h30.',
        'Não é necessário conhecimento prévio. As inscrições podem ser feitas pelo CEAK App ou na recepção.',
      ],
    },
    {
      titulo: 'Bazar beneficente de primavera acontece em 17 de outubro',
      data: '2026-09-15T10:00',
      categoria: 'Eventos',
      autor: 'Lúcia Moraes',
      fonte: 'Agenda',
      ia: false,
      lead: 'Roupas, livros e utilidades doadas a preços simbólicos.',
      corpo: [
        'O bazar será realizado no pátio do CEAK, das 8h às 12h. Toda a renda é revertida para as cestas básicas da assistência social.',
      ],
    },
    {
      titulo: 'Como funciona o atendimento fraterno',
      data: '2026-09-09T10:00',
      categoria: 'Assistência',
      autor: 'Diretoria doutrinária',
      fonte: 'Assistência',
      ia: false,
      lead: 'Uma conversa reservada, gratuita e sem pré-requisitos.',
      corpo: [
        'O atendimento fraterno é o primeiro acolhimento oferecido pela casa a quem chega em momento de dificuldade. Acontece às terças e quintas, a partir das 19h, sem necessidade de agendamento prévio.',
        'O atendimento espiritual não substitui acompanhamento médico ou psicológico quando necessário.',
      ],
    },
    {
      titulo: 'Biblioteca amplia horário de empréstimos',
      data: '2026-09-02T10:00',
      categoria: 'Institucional',
      autor: 'Secretaria',
      fonte: 'Secretaria',
      ia: false,
      lead: 'Agora também aos sábados, das 18h às 19h30.',
      corpo: [
        'A biblioteca do CEAK, com mais de 3 mil títulos, passa a funcionar também aos sábados antes do Estudo do Evangelho. O empréstimo é gratuito, por 15 dias, mediante cadastro.',
      ],
    },
  ];
  for (const p of posts) {
    await prisma.conteudo.create({
      data: {
        titulo: p.titulo,
        slug: slug(p.titulo),
        categoria: p.categoria,
        autorExibicao: p.autor,
        lead: p.lead,
        fonte: p.fonte,
        status: StatusConteudo.PUBLICADO,
        geradoPorIa: p.ia,
        criadoEm: d(p.data),
        publicadoEm: d(p.data),
        seoDescricao: p.lead,
        tags: [p.categoria.toLowerCase()],
        fontes: [],
        responsavelId: uid('Paulo Mendes'),
        versoes: {
          create: [{ canal: Canal.BLOG, texto: p.corpo.join('\n\n'), publicadoEm: d(p.data) }],
        },
      },
    });
  }

  const aprovacoes = [
    [
      TipoAprovacao.CONTEUDO,
      'Resumo da palestra “Família e Espiritualidade” — Blog, Facebook, Instagram, Google',
      'Rascunho IA · revisado por Paulo Mendes · hoje 09:40',
      'Conteudo',
      resumo.id,
      'Paulo Mendes',
    ],
    [
      TipoAprovacao.CONTEUDO,
      'Divulgação: Palestra “O perdão como libertação”',
      'Instagram e Facebook · agendar para hoje 12:00',
      'Conteudo',
      conteudoIds['Divulgação: O perdão como libertação']!,
      'Paulo Mendes',
    ],
    [
      TipoAprovacao.FINANCEIRO,
      'Pagamento CPFL — energia elétrica · R$ 862,00',
      'Vence 05/10 · lançado por Maria Silva',
      'Lancamento',
      'cpfl',
      'Maria Silva',
    ],
    [
      TipoAprovacao.FINANCEIRO,
      'Reembolso de material de limpeza · R$ 214,30',
      'Solicitado por Lúcia Moraes',
      'Lancamento',
      'reembolso-limpeza',
      'Lúcia Moraes',
    ],
    [
      TipoAprovacao.CAMPANHA,
      'Prorrogação da Campanha do Agasalho até 15/11',
      'Proposta da assistência social',
      'Campanha',
      'agasalho',
      'Lúcia Moraes',
    ],
    [
      TipoAprovacao.COMUNICACAO,
      'Push: lembrete da palestra de quarta-feira',
      'Envio para 382 membros · 07/10 18:00',
      'Comunicacao',
      'push-quarta',
      'Paulo Mendes',
    ],
    [
      TipoAprovacao.PRODUTO,
      '6 itens doados para publicação na loja',
      'Cadastrados pelo bazar · fotos anexadas',
      'Produto',
      'lote-bazar',
      'Lúcia Moraes',
    ],
    [
      TipoAprovacao.IA,
      'Nova base de conhecimento: Regulamento ESDE 2027',
      'Fonte para respostas do CEAK IA',
      'BaseConhecimento',
      'regulamento-esde-2027',
      'Helena Prado',
    ],
  ] as const;
  for (const [tipo, titulo, detalhe, entidade, entidadeId, solicitante] of aprovacoes) {
    await prisma.aprovacao.create({
      data: {
        tipo,
        titulo,
        detalhe,
        entidade,
        entidadeId,
        solicitanteId: uid(solicitante),
        conteudoId: entidade === 'Conteudo' ? entidadeId : undefined,
      },
    });
  }

  // ─── Comunicação ─────────────────────────────────────────────────────
  await prisma.comunicacao.createMany({
    data: [
      {
        canal: Canal.PUSH,
        titulo: 'Lembrete: palestra hoje 20h',
        mensagem:
          'Hoje às 20h: palestra “O perdão como libertação”, com Rogério Lima. Transmissão ao vivo no app.',
        publico: 'Membros (382)',
        status: StatusComunicacao.ENVIADO,
        enviadoEm: d('2026-10-02T18:00'),
        enviados: 382,
        aberturas: 168,
      },
      {
        canal: Canal.PUSH,
        titulo: 'Nova apostila ESDE disponível',
        mensagem: 'A apostila do módulo 3 do ESDE já está disponível no app.',
        publico: 'Alunos ESDE (32)',
        status: StatusComunicacao.ENVIADO,
        enviadoEm: d('2026-10-01T10:00'),
        enviados: 32,
        aberturas: 22,
      },
      {
        canal: Canal.PUSH,
        titulo: 'Lembrete da palestra de quarta-feira',
        mensagem: 'Quarta-feira, 07/10, às 20h: A esperança que sustenta, com Marta Andrade.',
        publico: 'Membros (382)',
        status: StatusComunicacao.AGUARDANDO_APROVACAO,
        agendadoPara: d('2026-10-07T18:00'),
      },
    ],
  });

  // ─── Campanhas e doações ─────────────────────────────────────────────
  console.log('→ Campanhas e doações');
  const camp = async (
    titulo: string,
    unidade: (typeof UnidadeMedida)[keyof typeof UnidadeMedida],
    meta: number,
    arrecadado: number,
    fim: string,
    extra: object = {},
  ) =>
    prisma.campanha.create({
      data: {
        slug: slug(titulo),
        titulo,
        unidade,
        meta,
        arrecadado,
        fim: d(fim),
        inicio: d('2026-09-01'),
        ...extra,
      },
    });
  const agasalho = await camp('Campanha do Agasalho', UnidadeMedida.PECA, 500, 378, '2026-10-31', {
    descricao:
      'As peças arrecadadas são entregues às 126 famílias acompanhadas pela assistência social do CEAK. A triagem é feita pelas voluntárias do bazar, que separam por tamanho e estado de conservação.',
    destaque: true,
    pontosColeta: [
      'Coleta drive-thru: sábados, 9h às 12h, portão lateral.',
      'Recepção: terça a sábado, 19h às 21h30.',
    ],
    itens: {
      create: [
        { nome: 'Casacos infantis', meta: 120, recebido: 62, unidade: 'peças' },
        { nome: 'Casacos adultos', meta: 180, recebido: 148, unidade: 'peças' },
        { nome: 'Cobertores', meta: 120, recebido: 96, unidade: 'peças' },
        { nome: 'Meias', meta: 80, recebido: 72, unidade: 'pares' },
      ],
    },
  });
  await camp('Cestas de outubro', UnidadeMedida.CESTA, 126, 96, '2026-10-15');
  const telhado = await camp(
    'Reforma do telhado',
    UnidadeMedida.REAIS,
    reais(14000),
    reais(9800),
    '2026-11-30',
  );
  await camp('Natal solidário', UnidadeMedida.REAIS, reais(6000), 0, '2026-12-24', {
    status: 'AGENDADA',
    inicio: d('2026-11-01'),
  });

  await prisma.doacao.createMany({
    data: [
      {
        pessoaId: pid('Victor Alves'),
        valorCentavos: reais(50),
        forma: FormaDoacao.PIX,
        destino: 'Onde for mais necessário',
        statusPagamento: StatusPagamento.PAGO,
        pagoEm: d('2026-10-02T09:31'),
        reciboEmitidoEm: d('2026-10-02T09:31'),
        criadoEm: d('2026-10-02T09:31'),
      },
      {
        doadorNome: 'Anônimo',
        valorCentavos: reais(200),
        forma: FormaDoacao.PIX,
        destino: 'Assistência social',
        statusPagamento: StatusPagamento.PAGO,
        pagoEm: d('2026-10-01T21:12'),
        reciboEmitidoEm: d('2026-10-01T21:12'),
        criadoEm: d('2026-10-01T21:12'),
      },
      {
        pessoaId: pid('Sueli Andrade'),
        valorCentavos: reais(30),
        forma: FormaDoacao.PIX_RECORRENTE,
        recorrente: true,
        destino: 'Manutenção',
        statusPagamento: StatusPagamento.PAGO,
        pagoEm: d('2026-10-01T08:00'),
        reciboEmitidoEm: d('2026-10-01T08:00'),
        criadoEm: d('2026-10-01T08:00'),
      },
      {
        doadorNome: 'Família Rocha',
        itemDescricao: '6 peças',
        forma: FormaDoacao.ENTREGA,
        destino: 'Campanha do Agasalho',
        campanhaId: agasalho.id,
        statusPagamento: StatusPagamento.PAGO,
        reciboEmitidoEm: d('2026-09-29'),
        criadoEm: d('2026-09-29T10:05'),
      },
      {
        doadorNome: 'Mercado Bom Preço',
        itemDescricao: '40 kg de arroz',
        forma: FormaDoacao.ENTREGA,
        destino: 'Cestas',
        statusPagamento: StatusPagamento.PAGO,
        reciboEmitidoEm: d('2026-09-28'),
        criadoEm: d('2026-09-28T11:40'),
      },
      {
        pessoaId: pid('Cláudia Ribeiro'),
        valorCentavos: reais(100),
        forma: FormaDoacao.PIX,
        destino: 'Reforma do telhado',
        campanhaId: telhado.id,
        statusPagamento: StatusPagamento.PAGO,
        pagoEm: d('2026-09-27T15:00'),
        reciboEmitidoEm: d('2026-09-27T15:00'),
        criadoEm: d('2026-09-27T15:00'),
      },
    ],
  });

  // ─── Estoque e loja ──────────────────────────────────────────────────
  console.log('→ Estoque e loja');
  const estoque = [
    ['ALI-ARROZ', 'Arroz tipo 1', CategoriaEstoque.ALIMENTOS, UnidadeMedida.KG, 14, 60],
    ['ALI-FEIJAO', 'Feijão carioca', CategoriaEstoque.ALIMENTOS, UnidadeMedida.KG, 72, 50],
    ['ALI-OLEO', 'Óleo de soja', CategoriaEstoque.ALIMENTOS, UnidadeMedida.UN, 22, 40],
    ['ALI-LEITE', 'Leite em pó', CategoriaEstoque.ALIMENTOS, UnidadeMedida.UN, 48, 30],
    [
      'LOJA-0001',
      'O Evangelho Segundo o Espiritismo',
      CategoriaEstoque.LOJA,
      UnidadeMedida.UN,
      12,
      10,
    ],
    ['LOJA-0002', 'O Livro dos Espíritos', CategoriaEstoque.LOJA, UnidadeMedida.UN, 8, 10],
    ['LOJA-0003', 'Nosso Lar — André Luiz', CategoriaEstoque.LOJA, UnidadeMedida.UN, 3, null],
    [
      'LOJA-0004',
      'Casaco de lã infantil, tam. 6',
      CategoriaEstoque.LOJA,
      UnidadeMedida.UN,
      1,
      null,
    ],
    ['LOJA-0005', 'Pano de prato bordado à mão', CategoriaEstoque.LOJA, UnidadeMedida.UN, 15, 5],
    ['LOJA-0006', 'Caneca CEAK 60 anos', CategoriaEstoque.LOJA, UnidadeMedida.UN, 20, 5],
    ['LOJA-0007', 'Jogo de xícaras de porcelana', CategoriaEstoque.LOJA, UnidadeMedida.UN, 1, null],
    ['LOJA-0008', 'Manta de crochê', CategoriaEstoque.LOJA, UnidadeMedida.UN, 4, 2],
    ['LIM-DETERG', 'Detergente', CategoriaEstoque.LIMPEZA, UnidadeMedida.UN, 30, 20],
    ['DOA-CASACO', 'Casacos (triados)', CategoriaEstoque.DOACOES, UnidadeMedida.PECA, 214, null],
  ] as const;
  const E: Record<string, string> = {};
  for (const [sku, nome, categoria, unidade, saldo, minimo] of estoque) {
    const i = await prisma.itemEstoque.create({
      data: { sku, nome, categoria, unidade, saldo, minimo },
    });
    E[nome] = i.id;
  }
  await prisma.movimentacao.createMany({
    data: [
      {
        itemEstoqueId: E['O Evangelho Segundo o Espiritismo']!,
        tipo: TipoMovimentacao.SAIDA,
        motivo: 'Saída (venda)',
        quantidade: 1,
        referencia: 'Pedido #1042',
        por: 'Automação',
        criadoEm: d('2026-10-02T09:12'),
      },
      {
        itemEstoqueId: E['Arroz tipo 1']!,
        tipo: TipoMovimentacao.SAIDA,
        motivo: 'Saída',
        quantidade: 120,
        referencia: 'Cestas de setembro',
        por: 'Lúcia Moraes',
        criadoEm: d('2026-09-30T15:20'),
      },
      {
        itemEstoqueId: E['Casacos (triados)']!,
        tipo: TipoMovimentacao.ENTRADA,
        motivo: 'Entrada (doação)',
        quantidade: 6,
        referencia: 'Família Rocha',
        por: 'Recepção',
        criadoEm: d('2026-09-29T10:05'),
      },
      {
        itemEstoqueId: E['Feijão carioca']!,
        tipo: TipoMovimentacao.ENTRADA,
        motivo: 'Entrada (doação)',
        quantidade: 40,
        referencia: 'Mercado Bom Preço',
        por: 'Recepção',
        criadoEm: d('2026-09-28T11:40'),
      },
    ],
  });

  const produtos = [
    [
      'O Evangelho Segundo o Espiritismo',
      'Livros',
      28,
      EstadoProduto.NOVO,
      OrigemProduto.LIVRARIA,
      'Edição de bolso com tradução de Guillon Ribeiro. Ideal para acompanhar as reuniões de estudo do Evangelho.',
    ],
    [
      'O Livro dos Espíritos',
      'Livros',
      32,
      EstadoProduto.NOVO,
      OrigemProduto.LIVRARIA,
      'A obra fundamental da Doutrina Espírita, com as 1.019 perguntas respondidas pelos Espíritos.',
    ],
    [
      'Nosso Lar — André Luiz',
      'Livros',
      15,
      EstadoProduto.USADO_BOM,
      OrigemProduto.DOADO,
      'Exemplar doado, com marcas leves de uso na capa. Miolo íntegro, sem anotações.',
    ],
    [
      'Casaco de lã infantil, tam. 6',
      'Roupas',
      12,
      EstadoProduto.SEMINOVO,
      OrigemProduto.DOADO,
      'Casaco de lã na cor verde-musgo, lavado e revisado pela equipe do bazar.',
    ],
    [
      'Pano de prato bordado à mão',
      'Artesanato',
      18,
      EstadoProduto.NOVO,
      OrigemProduto.FEITO_POR_VOLUNTARIAS,
      'Bordado em ponto cruz pelo grupo de costura das quintas-feiras. Algodão 100%.',
    ],
    [
      'Caneca CEAK 60 anos',
      'Objetos',
      25,
      EstadoProduto.NOVO,
      OrigemProduto.LIVRARIA,
      'Caneca de cerâmica comemorativa, 300 ml.',
    ],
    [
      'Jogo de xícaras de porcelana',
      'Itens doados',
      40,
      EstadoProduto.USADO_OTIMO,
      OrigemProduto.DOADO,
      'Seis xícaras com pires, porcelana branca com friso dourado. Sem lascas.',
    ],
    [
      'Manta de crochê',
      'Artesanato',
      65,
      EstadoProduto.NOVO,
      OrigemProduto.FEITO_POR_VOLUNTARIAS,
      'Manta 1,20 × 1,50 m em fio de algodão cru.',
    ],
  ] as const;
  const PR: Record<string, { id: string; preco: number }> = {};
  for (const [nome, categoria, preco, estado, origem, descricao] of produtos) {
    const p = await prisma.produto.create({
      data: {
        slug: slug(nome),
        nome,
        categoria,
        precoCentavos: reais(preco),
        estado,
        origem,
        descricao,
        itemEstoqueId: E[nome],
      },
    });
    PR[nome] = { id: p.id, preco: reais(preco) };
  }
  // Pedidos #1037–#1042 (numeração do protótipo).
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "pedido_numero_seq" RESTART WITH 1037`);
  const pedidos = [
    [
      'Fernanda Lima',
      [
        ['O Livro dos Espíritos', 1],
        ['Nosso Lar — André Luiz', 1],
      ],
      StatusPedido.RETIRADO,
      '2026-09-29T10:00',
    ],
    ['Jorge Pereira', [['Nosso Lar — André Luiz', 1]], StatusPedido.RETIRADO, '2026-09-30T11:00'],
    [
      'Marina Souza',
      [
        ['O Evangelho Segundo o Espiritismo', 2],
        ['Pano de prato bordado à mão', 1],
        ['Caneca CEAK 60 anos', 1],
      ],
      StatusPedido.RETIRADO,
      '2026-09-30T15:00',
    ],
    [
      'Sueli Andrade',
      [
        ['Manta de crochê', 1],
        ['Pano de prato bordado à mão', 1],
      ],
      StatusPedido.AGUARDANDO_RETIRADA,
      '2026-10-01T10:00',
    ],
    [
      'Roberto Martins',
      [['O Livro dos Espíritos', 1]],
      StatusPedido.AGUARDANDO_RETIRADA,
      '2026-10-01T16:00',
    ],
    [
      'Carla Nogueira',
      [
        ['O Evangelho Segundo o Espiritismo', 1],
        ['Pano de prato bordado à mão', 1],
        ['Nosso Lar — André Luiz', 1],
      ],
      StatusPedido.AGUARDANDO_PIX,
      '2026-10-02T09:10',
    ],
  ] as const;
  for (const [cliente, itens, status, quando] of pedidos) {
    const total = itens.reduce((s, [n, q]) => s + PR[n]!.preco * q, 0);
    const pago = status !== StatusPedido.AGUARDANDO_PIX;
    await prisma.pedido.create({
      data: {
        pessoaId: pid(cliente),
        clienteNome: cliente,
        totalCentavos: total,
        status,
        statusPagamento: pago ? StatusPagamento.PAGO : StatusPagamento.AGUARDANDO,
        pagoEm: pago ? d(quando) : undefined,
        retiradoEm: status === StatusPedido.RETIRADO ? d(quando) : undefined,
        criadoEm: d(quando),
        itens: {
          create: itens.map(([n, q]) => ({
            produtoId: PR[n]!.id,
            quantidade: q,
            precoUnitCentavos: PR[n]!.preco,
          })),
        },
      },
    });
  }

  // ─── Financeiro ──────────────────────────────────────────────────────
  console.log('→ Financeiro');
  const cats = [
    ['Utilidades', TipoLancamento.PAGAR, 2400],
    ['Assistência social', TipoLancamento.PAGAR, 5200],
    ['Manutenção', TipoLancamento.PAGAR, 1500],
    ['Material', TipoLancamento.PAGAR, 1600],
    ['Tecnologia', TipoLancamento.PAGAR, 900],
    ['Comunicação', TipoLancamento.PAGAR, 800],
    ['Loja', TipoLancamento.PAGAR, null],
    ['Outras', TipoLancamento.PAGAR, 1000],
    ['Mensalidades', TipoLancamento.RECEBER, null],
    ['Loja', TipoLancamento.RECEBER, null],
    ['Eventos', TipoLancamento.RECEBER, null],
    ['Convênios', TipoLancamento.RECEBER, null],
    ['Doações', TipoLancamento.RECEBER, null],
  ] as const;
  const CAT: Record<string, string> = {};
  for (const [nome, tipo, orcado] of cats) {
    const c = await prisma.categoriaFinanceira.create({
      data: { nome, tipo, orcadoMesCentavos: orcado ? reais(orcado) : null },
    });
    CAT[`${tipo}:${nome}`] = c.id;
  }
  const centros = [
    ['Sede', 'Água, energia, manutenção, limpeza', 6000],
    ['Assistência', 'Cestas, agasalhos, atendimento', 5200],
    ['Estudos', 'Apostilas, material didático', 800],
    ['Campanhas', 'Gráfica, impulsionamento', 800],
    ['Administração', 'Internet, telefone, sistemas', 900],
    ['Loja', 'Compra de livros e materiais', 1000],
  ] as const;
  const CC: Record<string, string> = {};
  for (const [nome, descricao, orcado] of centros) {
    const c = await prisma.centroCusto.create({
      data: { nome, descricao, orcadoMesCentavos: reais(orcado) },
    });
    CC[nome] = c.id;
  }
  const pagar = [
    [
      'Sabesp',
      'Água e esgoto — set/26',
      'Utilidades',
      'Sede',
      '2026-09-30',
      2800,
      StatusLancamento.VENCIDO,
      'Maria Silva',
    ],
    [
      'CPFL Paulista',
      'Energia elétrica — set/26',
      'Utilidades',
      'Sede',
      '2026-10-05',
      862,
      StatusLancamento.PENDENTE,
      'Maria Silva',
    ],
    [
      'Atacadão Penápolis',
      'Alimentos — cestas de outubro',
      'Assistência social',
      'Assistência',
      '2026-10-08',
      3420,
      StatusLancamento.APROVADO,
      'Lúcia Moraes',
    ],
    [
      'Vivo Empresas',
      'Internet e telefone',
      'Tecnologia',
      'Administração',
      '2026-10-10',
      189.9,
      StatusLancamento.APROVADO,
      'Maria Silva',
    ],
    [
      'Gráfica Central',
      'Folhetos Campanha do Agasalho',
      'Comunicação',
      'Campanhas',
      '2026-10-12',
      420,
      StatusLancamento.PENDENTE,
      'Paulo Mendes',
    ],
    [
      'Hidráulica Souza',
      'Reparo do telhado — parcela 3/4',
      'Manutenção',
      'Sede',
      '2026-10-15',
      1650,
      StatusLancamento.PENDENTE,
      'Antônio Ferreira',
    ],
    [
      'FEB Editora',
      'Livros para a loja',
      'Loja',
      'Loja',
      '2026-09-20',
      960.2,
      StatusLancamento.PAGO,
      'Maria Silva',
    ],
    [
      'Limpeza Total ME',
      'Material de limpeza',
      'Material',
      'Sede',
      '2026-09-25',
      214.3,
      StatusLancamento.CANCELADO,
      'Lúcia Moraes',
    ],
  ] as const;
  const LANC: Record<string, string> = {};
  for (const [contraparte, descricao, cat, cc, venc, valor, status, responsavel] of pagar) {
    const l = await prisma.lancamento.create({
      data: {
        tipo: TipoLancamento.PAGAR,
        contraparte,
        descricao,
        categoriaId: CAT[`PAGAR:${cat}`]!,
        centroCustoId: CC[cc],
        vencimento: d(venc),
        valorCentavos: reais(valor),
        status,
        pagoEm: status === StatusLancamento.PAGO ? d(venc) : undefined,
        responsavel,
      },
    });
    LANC[contraparte] = l.id;
  }
  const receber = [
    [
      'Associados',
      'Contribuições mensais — out/26',
      'Mensalidades',
      '2026-10-10',
      3150,
      StatusLancamento.PENDENTE,
    ],
    ['Loja', 'Pedidos aguardando PIX', 'Loja', '2026-10-03', 64, StatusLancamento.PENDENTE],
    [
      'Bazar',
      'Bazar de primavera (estimado)',
      'Eventos',
      '2026-10-17',
      3000,
      StatusLancamento.PENDENTE,
    ],
    [
      'Prefeitura de Penápolis',
      'Convênio assistência social — 3º tri',
      'Convênios',
      '2026-09-30',
      2400,
      StatusLancamento.VENCIDO,
    ],
    [
      'Doações recorrentes',
      'PIX Automático — 41 doadores',
      'Doações',
      '2026-10-01',
      1380,
      StatusLancamento.PAGO,
    ],
    ['Loja', 'Vendas setembro', 'Loja', '2026-09-30', 4820, StatusLancamento.PAGO],
  ] as const;
  for (const [contraparte, descricao, cat, venc, valor, status] of receber) {
    await prisma.lancamento.create({
      data: {
        tipo: TipoLancamento.RECEBER,
        contraparte,
        descricao,
        categoriaId: CAT[`RECEBER:${cat}`]!,
        vencimento: d(venc),
        valorCentavos: reais(valor),
        status,
        pagoEm: status === StatusLancamento.PAGO ? d(venc) : undefined,
      },
    });
  }
  await prisma.extratoLinha.createMany({
    data: [
      {
        data: d('2026-10-01'),
        descricao: 'PIX recebido — Victor Alves',
        valorCentavos: reais(50),
        referencia: 'Doação #8812',
        status: StatusConciliacao.CONCILIADO,
      },
      {
        data: d('2026-10-01'),
        descricao: 'PIX recebido — 14 lançamentos',
        valorCentavos: reais(1240),
        referencia: 'Doações (lote)',
        status: StatusConciliacao.CONCILIADO,
      },
      {
        data: d('2026-09-30'),
        descricao: 'Débito automático CPFL',
        valorCentavos: -reais(842),
        referencia: 'Energia elétrica (R$ 862,00)',
        lancamentoId: LANC['CPFL Paulista'],
        status: StatusConciliacao.DIVERGENTE,
      },
      {
        data: d('2026-09-30'),
        descricao: 'TED Atacadão Penápolis',
        valorCentavos: -reais(3180),
        referencia: 'Cestas de setembro',
        status: StatusConciliacao.CONCILIADO,
      },
      {
        data: d('2026-09-29'),
        descricao: 'PIX recebido — Loja pedido 1031',
        valorCentavos: reais(92),
        referencia: 'Pedido #1031',
        status: StatusConciliacao.SUGERIDO,
      },
      {
        data: d('2026-09-29'),
        descricao: 'Tarifa bancária',
        valorCentavos: -reais(18.9),
        status: StatusConciliacao.PENDENTE,
      },
      {
        data: d('2026-09-28'),
        descricao: 'PIX recebido — Mensalidade',
        valorCentavos: reais(30),
        referencia: 'Contribuição associado',
        status: StatusConciliacao.SUGERIDO,
      },
    ],
  });

  // ─── Voluntariado ────────────────────────────────────────────────────
  console.log('→ Voluntariado e assistência');
  const areas = [
    ['Recepção', 14],
    ['Assistência Social', 21],
    ['Eventos', 11],
    ['Comunicação', 8],
    ['Manutenção', 7],
    ['Estudos', 12],
  ] as const;
  const AR: Record<string, string> = {};
  for (const [nome, necessidade] of areas)
    AR[nome] = (await prisma.area.create({ data: { nome, necessidade } })).id;
  const habilidades = [
    'Elétrica',
    'Informática',
    'Fotografia',
    'Cozinha',
    'Organização',
    'Limpeza',
    'Transporte',
    'Música',
    'Costura',
    'Atendimento',
    'Ensino',
    'Outras',
  ];
  const H: Record<string, string> = {};
  for (const nome of habilidades) H[nome] = (await prisma.habilidade.create({ data: { nome } })).id;
  const voluntarios = [
    ['Victor Alves', ['Recepção'], ['Informática', 'Atendimento']],
    ['Renata Campos', ['Estudos', 'Eventos'], ['Ensino', 'Música']],
    ['Lúcia Moraes', ['Assistência Social', 'Eventos'], ['Organização', 'Costura']],
    ['Sueli Andrade', ['Assistência Social'], ['Atendimento', 'Cozinha']],
  ] as const;
  for (const [nome, ars, habs] of voluntarios) {
    const v = await prisma.voluntario.create({
      data: {
        pessoaId: pid(nome),
        areas: { create: ars.map((a) => ({ areaId: AR[a]! })) },
        habilidades: { create: habs.map((h) => ({ habilidadeId: H[h]! })) },
      },
    });
    await prisma.escala.create({
      data: {
        areaId: AR[ars[0]]!,
        voluntarioId: v.id,
        inicio: d('2026-10-07T19:00'),
        fim: d('2026-10-07T21:30'),
        funcao: ars[0],
      },
    });
  }

  // ─── Assistência ─────────────────────────────────────────────────────
  // Horários de atendimento ("Preciso de ajuda › Data").
  const vagasRaw = [
    ['2026-10-06T19:00', 5],
    ['2026-10-08T19:00', 7],
    ['2026-10-10T15:00', 2],
    ['2026-10-13T19:00', 8],
    ['2026-10-15T19:00', 8],
    ['2026-10-17T15:00', 5],
  ] as const;
  const VG: Record<string, string> = {};
  for (const [inicio, vagas] of vagasRaw) {
    VG[inicio] = (await prisma.vagaAssistencia.create({ data: { inicio: d(inicio), vagas } })).id;
  }

  const assist = [
    [
      'Carla N.',
      'Carla Nogueira',
      TipoAssistencia.TRATAMENTO_ESPIRITUAL,
      '2026-10-08T19:00',
      'Equipe B',
      null,
      StatusAssistencia.AGENDADA,
    ],
    [
      'Anônimo',
      null,
      TipoAssistencia.PRECE,
      '2026-10-06T19:00',
      null,
      null,
      StatusAssistencia.PENDENTE,
    ],
    [
      'Roberto M.',
      'Roberto Martins',
      TipoAssistencia.ATENDIMENTO_FRATERNO,
      '2026-10-06T19:00',
      null,
      'Sueli Andrade',
      StatusAssistencia.AGENDADA,
    ],
    [
      'Fernanda L.',
      'Fernanda Lima',
      TipoAssistencia.ORIENTACAO,
      '2026-10-02T19:00',
      null,
      null,
      StatusAssistencia.PENDENTE,
    ],
    [
      'Jorge P.',
      'Jorge Pereira',
      TipoAssistencia.PASSE,
      '2026-09-30T19:00',
      'Equipe A',
      null,
      StatusAssistencia.CONCLUIDA,
    ],
    [
      'Marina S.',
      'Marina Souza',
      TipoAssistencia.ATENDIMENTO_FRATERNO,
      '2026-09-29T19:00',
      null,
      'Lúcia Moraes',
      StatusAssistencia.CONCLUIDA,
    ],
  ] as const;
  for (const [exibicao, pessoa, tipo, data, equipe, atendente, status] of assist) {
    await prisma.solicitacaoAssistencia.create({
      data: {
        nomeExibicao: exibicao,
        pessoaId: pessoa ? pid(pessoa) : undefined,
        anonimo: !pessoa,
        tipo,
        data: d(data),
        equipe,
        atendenteId: atendente ? pid(atendente) : undefined,
        // Só as agendadas ocupam vaga no horário.
        vagaId: status === StatusAssistencia.AGENDADA ? VG[data] : undefined,
        status,
        relato: { create: { texto: 'Relato fictício para desenvolvimento (dado sensível).' } },
      },
    });
  }

  // ─── Automações ──────────────────────────────────────────────────────
  console.log('→ Automações, logs, auditoria e integrações');
  const automacoes = [
    [
      'divulgacao-palestra',
      'Divulgação de palestra',
      'Palestra criada',
      'gerar divulgação (rascunho para aprovação)',
      true,
    ],
    ['pesquisa-pos-palestra', 'Pesquisa pós-palestra', 'Palestra encerrada', 'enviar NPS', false],
    ['baixa-estoque', 'Baixa de estoque', 'Pedido pago', 'baixar estoque', false],
    ['publicacao-aprovada', 'Publicação aprovada', 'Novo artigo aprovado', 'publicar redes', false],
    [
      'resumo-palestra',
      'Resumo de palestra',
      'Gravação disponível',
      'IA resume e gera artigo',
      true,
    ],
    ['lembrete-evento', 'Lembrete de evento', '2h antes do evento', 'push para inscritos', false],
    ['recibo-doacao', 'Recibo de doação', 'PIX recebido', 'enviar recibo por e-mail', false],
    [
      'alerta-estoque',
      'Alerta de estoque',
      'Estoque abaixo do mínimo',
      'notificar tesouraria',
      false,
    ],
  ] as const;
  for (const [chave, nome, gatilho, acao, exigeAprovacao] of automacoes) {
    const a = await prisma.automacao.create({
      data: { chave, nome, gatilho, acao, exigeAprovacao },
    });
    const falha = chave === 'baixa-estoque';
    await prisma.execucao.create({
      data: {
        automacaoId: a.id,
        status: falha ? StatusExecucao.FALHA : StatusExecucao.SUCESSO,
        erro: falha ? 'SKU 0088 sem saldo' : undefined,
        duracaoMs: falha ? 55 : 1200,
        iniciadaEm: d('2026-10-02T09:12'),
        finalizadaEm: d('2026-10-02T09:12'),
      },
    });
  }

  // ─── Logs e auditoria ────────────────────────────────────────────────
  const logs = [
    [
      '2026-10-02T10:28:31',
      NivelLog.INFO,
      CategoriaLog.APLICACAO,
      'POST /api/v1/checkins',
      'Victor',
      200,
      82,
    ],
    [
      '2026-10-02T10:27:02',
      NivelLog.INFO,
      CategoriaLog.AUTOMACAO,
      'palestra.encerrada → nps.enviar (148 destinatários)',
      'engine',
      200,
      1200,
    ],
    [
      '2026-10-02T10:21:45',
      NivelLog.WARN,
      CategoriaLog.INTEGRACOES,
      'instagram.graph: token expirado (OAuthException 190)',
      'engine',
      401,
      340,
    ],
    [
      '2026-10-02T10:19:10',
      NivelLog.INFO,
      CategoriaLog.AUDITORIA,
      'financeiro.lancamento.update #4471',
      'Maria Silva',
      200,
      64,
    ],
    [
      '2026-10-02T10:12:33',
      NivelLog.INFO,
      CategoriaLog.IA,
      'ia.resumo gerado · palestra 2026-09-30',
      'engine',
      200,
      8400,
    ],
    [
      '2026-10-02T09:58:20',
      NivelLog.WARN,
      CategoriaLog.SEGURANCA,
      '3 tentativas de login falhas · secretaria@',
      '187.42.x.x',
      429,
      12,
    ],
    [
      '2026-10-02T09:40:11',
      NivelLog.INFO,
      CategoriaLog.NOTIFICACOES,
      'push.enviado · lembrete palestra (382)',
      'engine',
      200,
      2100,
    ],
    [
      '2026-10-02T09:31:54',
      NivelLog.INFO,
      CategoriaLog.FINANCEIRO,
      'pix.recebido · doação R$ 50,00',
      'pix-webhook',
      200,
      91,
    ],
    [
      '2026-10-02T09:12:08',
      NivelLog.ERROR,
      CategoriaLog.AUTOMACAO,
      'pedido.pago → estoque.baixar: SKU 0088 sem saldo',
      'engine',
      409,
      55,
    ],
    [
      '2026-10-02T08:00:00',
      NivelLog.INFO,
      CategoriaLog.APLICACAO,
      'GET /api/v1/agenda?mes=10',
      'anônimo',
      200,
      38,
    ],
  ] as const;
  await prisma.log.createMany({
    data: logs.map(([ts, nivel, categoria, mensagem, ator, status, latenciaMs]) => ({
      criadoEm: d(ts),
      nivel,
      categoria,
      mensagem,
      ator,
      status,
      latenciaMs,
    })),
  });
  await prisma.auditoria.createMany({
    data: [
      {
        usuarioId: uid('Maria Silva'),
        acao: 'alterou lançamento financeiro',
        entidade: 'Lancamento',
        entidadeId: LANC['CPFL Paulista']!,
        antes: { valor: 'R$ 842' },
        depois: { valor: 'R$ 862' },
        ip: '177.38.0.12',
        criadoEm: d('2026-10-02T10:19'),
      },
      {
        usuarioId: uid('Paulo Mendes'),
        acao: 'editou conteúdo gerado por IA',
        entidade: 'Conteudo',
        entidadeId: resumo.id,
        antes: { blog: '3 parágrafos' },
        depois: { blog: '2 parágrafos' },
        ip: '189.10.0.40',
        criadoEm: d('2026-10-02T09:40'),
      },
      {
        usuarioId: uid('Lúcia Moraes'),
        acao: 'alterou meta de campanha',
        entidade: 'Campanha',
        entidadeId: agasalho.id,
        antes: { meta: '400 peças' },
        depois: { meta: '500 peças' },
        ip: '177.38.0.12',
        criadoEm: d('2026-09-28T16:02'),
      },
      {
        usuarioId: uid('Antônio Ferreira'),
        acao: 'alterou perfil de acesso',
        entidade: 'Usuario',
        entidadeId: uid('Helena Prado'),
        antes: { perfil: 'Voluntário' },
        depois: { perfil: 'Instrutor' },
        ip: '200.150.0.7',
        criadoEm: d('2026-09-27T11:15'),
      },
    ],
  });

  // ─── Biblioteca ──────────────────────────────────────────────────────
  console.log('→ Biblioteca e transparência');
  const biblioteca = [
    [
      'O Livro dos Espíritos',
      'Allan Kardec',
      'LIVRO',
      'Obras básicas',
      ['Reencarnação', 'Prece'],
      'ESDE',
    ],
    [
      'O Evangelho Segundo o Espiritismo',
      'Allan Kardec',
      'LIVRO',
      'Obras básicas',
      ['Prece', 'Família'],
      'Evangelho',
    ],
    ['O Livro dos Médiuns', 'Allan Kardec', 'LIVRO', 'Mediunidade', ['Mediunidade'], 'Mediunidade'],
    ['Apostila ESDE — Módulo 3', 'FEB / CEAK', 'PDF', 'ESDE', ['Reencarnação'], 'ESDE'],
    ['Roteiro: Família e Espiritualidade', 'Marta Andrade', 'PDF', 'Família', ['Família'], null],
    [
      'O passe: fundamentos e prática',
      'Diretoria doutrinária',
      'ARTIGO',
      'Passe',
      ['Mediunidade'],
      null,
    ],
    [
      'Reencarnação e justiça divina',
      'Helena Prado',
      'ARTIGO',
      'Reencarnação',
      ['Reencarnação'],
      'ESDE',
    ],
    [
      'Introdução à mediunidade',
      'Helena Prado',
      'VIDEO',
      'Mediunidade',
      ['Mediunidade'],
      'Mediunidade',
    ],
    ['Prece de Cáritas comentada', 'Lúcia Moraes', 'AUDIO', 'Prece', ['Prece'], 'Evangelho'],
    ['Família e Espiritualidade', 'Marta Andrade', 'PALESTRA', 'Família', ['Família'], null],
    ['A coragem da fé', 'Antônio Ferreira', 'PALESTRA', 'Fé', ['Prece'], null],
    ['Nosso Lar', 'André Luiz / Chico Xavier', 'LIVRO', 'Vida espiritual', ['Reencarnação'], null],
  ] as const;
  for (const [titulo, autor, tipo, tema, assuntos, curso] of biblioteca) {
    await prisma.itemBiblioteca.create({
      data: {
        titulo,
        autor,
        tipo,
        tema,
        assuntos: [...assuntos],
        curso,
        emprestimo: tipo === 'LIVRO',
        url:
          tipo === 'LIVRO'
            ? null
            : tipo === 'VIDEO' || tipo === 'PALESTRA'
              ? 'https://www.youtube.com/@ceakpenapolis/videos'
              : null,
      },
    });
  }

  // ─── Transparência ───────────────────────────────────────────────────
  await prisma.prestacaoContas.create({
    data: {
      mes: d('2026-09-01'),
      receitasCentavos: reais(18840),
      despesasCentavos: reais(13290),
      origens: [
        { rotulo: 'Doações', centavos: reais(8420) },
        { rotulo: 'Loja e bazar', centavos: reais(4820) },
        { rotulo: 'Contribuições de associados', centavos: reais(3150) },
        { rotulo: 'Eventos', centavos: reais(1680) },
        { rotulo: 'Outras', centavos: reais(770) },
      ],
      aplicacoes: [
        { rotulo: 'Assistência social', centavos: reais(4980) },
        { rotulo: 'Energia e água', centavos: reais(2360) },
        { rotulo: 'Manutenção da sede', centavos: reais(2140) },
        { rotulo: 'Material de consumo', centavos: reais(1420) },
        { rotulo: 'Tecnologia', centavos: reais(890) },
        { rotulo: 'Outras', centavos: reais(1500) },
      ],
      impacto: [
        {
          valor: '126',
          rotulo: 'famílias com cesta mensal',
          rotuloResumo: 'famílias assistidas no trimestre',
        },
        { valor: '42', rotulo: 'atendimentos fraternos no mês' },
        { valor: '147', rotulo: 'alunos em estudos' },
        { valor: '68', rotulo: 'voluntários ativos' },
      ],
      publicada: true,
      aprovadaEm: d('2026-10-01T18:00'),
    },
  });
  await prisma.documentoTransparencia.createMany({
    data: [
      { titulo: 'Prestação de contas — setembro/2026', descricao: 'PDF · 1,2 MB', ordem: 1 },
      { titulo: 'Prestação de contas — agosto/2026', descricao: 'PDF · 1,1 MB', ordem: 2 },
      { titulo: 'Balanço anual 2025', descricao: 'PDF · 2,4 MB', ordem: 3 },
      { titulo: 'Estatuto social', descricao: 'PDF · 380 KB', ordem: 4 },
    ],
  });

  // ─── Integrações e configurações ─────────────────────────────────────
  await prisma.integracao.createMany({
    data: [
      {
        chave: 'facebook',
        nome: 'Facebook',
        descricao: 'Página CEAKDEPENAPOLIS · publicação automática após aprovação',
        status: StatusIntegracao.CONECTADO,
      },
      {
        chave: 'instagram',
        nome: 'Instagram',
        descricao: '@ceakpenapolis · token expirado em 02/10 06:00',
        status: StatusIntegracao.ATENCAO,
        expiraEm: d('2026-10-02T06:00'),
        ultimoErro: 'OAuthException 190',
      },
      {
        chave: 'google',
        nome: 'Google Business',
        descricao: 'Perfil da instituição · horários e postagens',
        status: StatusIntegracao.CONECTADO,
      },
      {
        chave: 'youtube',
        nome: 'YouTube',
        descricao: 'Transmissões e gravações',
        status: StatusIntegracao.CONECTADO,
      },
      {
        chave: 'email',
        nome: 'E-mail',
        descricao: 'contato@allankardecpenapolis.com.br',
        status: StatusIntegracao.CONECTADO,
      },
      {
        chave: 'push',
        nome: 'Push',
        descricao: 'Web Push · 1.026 dispositivos',
        status: StatusIntegracao.CONECTADO,
      },
      {
        chave: 'pix',
        nome: 'PIX',
        descricao: 'Webhook de recebimentos · banco conveniado',
        status: StatusIntegracao.CONECTADO,
      },
      {
        chave: 'ia',
        nome: 'IA',
        descricao: 'Modelo de linguagem · base de conhecimento CEAK',
        status: StatusIntegracao.CONECTADO,
      },
    ],
  });
  await prisma.configuracao.createMany({
    data: [
      { chave: 'seguranca.retencaoLogsMeses', valor: 24 },
      { chave: 'seguranca.sessaoInatividadeMin', valor: 30 },
      {
        chave: 'seguranca.doisFatoresObrigatorio',
        valor: ['ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'],
      },
      { chave: 'lgpd.termoVersao', valor: TERMO_LGPD_VERSAO },
      { chave: 'membros.loginGoogle', valor: false },
    ],
  });

  const total = await prisma.pessoa.count();
  console.log(
    `✔ Seed concluído: ${total} pessoas, ${Object.keys(P).filter((k) => P[k]!.usuarioId).length} usuários.`,
  );
  console.log(`  Senha de todos os usuários: ${process.env.SEED_SENHA ?? 'ceak-dev-2026'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
