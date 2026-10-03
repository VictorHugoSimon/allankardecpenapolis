import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarMocksMensageria } from '@ceak/core/adapters';
import { criarLogger } from '@ceak/core/logger';
import { servicoPorSlug } from '@ceak/core/regras';
import {
  atividadeParaCheckin,
  atualizarDadosPessoais,
  cadastrarParticipante,
  detalheTurma,
  documentosParaIA,
  ErroNegocio,
  exportarDadosTitular,
  fazerCheckin,
  jornada,
  meusEstudos,
  prisma,
  registrarAvaliacao,
  solicitarAtendimento,
  solicitarExclusaoDados,
} from '../src';

const temBanco = !!process.env.DATABASE_URL;
const EMAIL = 'membro.teste@email.com';

describe.skipIf(!temBanco)('serviços do CEAK App', () => {
  const log = criarLogger([() => undefined]);
  const ids = { evento: '', pessoa: '', usuario: '', victor: '' };

  beforeAll(async () => {
    const agora = new Date();
    const ev = await prisma.evento.create({
      data: {
        slug: 'palestra-de-teste-app',
        titulo: 'Palestra de teste',
        tipo: 'PALESTRA',
        status: 'EM_ANDAMENTO',
        inicio: new Date(agora.getTime() - 30 * 60_000),
        local: 'Salão principal',
      },
    });
    ids.evento = ev.id;
    ids.victor = (await prisma.pessoa.findFirstOrThrow({ where: { nome: 'Victor Alves' } })).id;
  });

  afterAll(async () => {
    await prisma.auditoria.deleteMany({
      where: { entidadeId: { in: [ids.usuario, ids.pessoa].filter(Boolean) } },
    });
    await prisma.evento.deleteMany({ where: { id: ids.evento } });
    await prisma.pessoa.deleteMany({ where: { email: EMAIL } });
    await prisma.$disconnect();
  });

  it('cadastro cria conta de Visitante com consentimento e recusa e-mail repetido', async () => {
    const r = await cadastrarParticipante({
      nome: 'Membro Teste',
      email: EMAIL,
      whatsapp: '+5518900000099',
      senha: 'senhaforte123',
      primeiraVez: true,
      consentimentoLgpd: true,
    });
    Object.assign(ids, { pessoa: r.pessoaId, usuario: r.usuarioId });
    const u = await prisma.usuario.findUniqueOrThrow({
      where: { id: r.usuarioId },
      include: { pessoa: true, credencial: true },
    });
    expect(u.perfil).toBe('VISITANTE');
    expect(u.pessoa.consentimentoVersao).toBe('2026.1');
    expect(u.credencial?.senhaHash).toMatch(/^scrypt\$/);
    await expect(
      cadastrarParticipante({
        nome: 'Outro',
        email: EMAIL,
        senha: 'senhaforte123',
        primeiraVez: false,
        consentimentoLgpd: true,
      }),
    ).rejects.toBeInstanceOf(ErroNegocio);
  });

  it('check-in: QR inválido é recusado; manual registra, é idempotente e concede conquista', async () => {
    const atividade = await atividadeParaCheckin();
    expect(atividade?.aberto).toBe(true);
    await expect(
      fazerCheckin(ids.pessoa, { eventoId: ids.evento, origem: 'QR', tokenValido: false }, { log }),
    ).rejects.toThrow(/QR Code/);
    const r1 = await fazerCheckin(
      ids.pessoa,
      { eventoId: ids.evento, origem: 'MANUAL', tokenValido: false },
      { log },
    );
    expect(r1.jaRegistrado).toBe(false);
    expect(r1.visitaDoMes).toMatch(/^1ª visita em \w+ registrada na sua jornada$/);
    expect(r1.conquistas).toEqual(['Primeira visita']);
    const r2 = await fazerCheckin(
      ids.pessoa,
      { eventoId: ids.evento, origem: 'QR', tokenValido: true },
      { log },
    );
    expect(r2.jaRegistrado).toBe(true);
    expect(await prisma.checkin.count({ where: { pessoaId: ids.pessoa } })).toBe(1);
  });

  it('check-in fora do horário é recusado', async () => {
    const futuro = await prisma.evento.findFirstOrThrow({ where: { titulo: 'O valor da prece' } });
    await expect(
      fazerCheckin(
        ids.pessoa,
        { eventoId: futuro.id, origem: 'MANUAL', tokenValido: false },
        { log },
      ),
    ).rejects.toThrow(/não está aberto/);
  });

  it('avaliação NPS: grava e atualiza (uma por pessoa)', async () => {
    await registrarAvaliacao(ids.pessoa, 'palestra-de-teste-app', { nps: 8, conteudo: 4 }, { log });
    await registrarAvaliacao(
      ids.pessoa,
      'palestra-de-teste-app',
      { nps: 10, conteudo: 5, comentario: 'Ótima' },
      { log },
    );
    const a = await prisma.avaliacao.findMany({ where: { pessoaId: ids.pessoa } });
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ nps: 10, conteudo: 5, comentario: 'Ótima' });
    await expect(
      registrarAvaliacao(ids.pessoa, 'o-valor-da-prece-2026-10-28', { nps: 9 }, { log }),
    ).rejects.toThrow(/não pode ser avaliada/);
  });

  it('jornada é pessoal e mostra conquistas e linha do tempo', async () => {
    const j = await jornada(ids.victor);
    expect(j.conquistas.filter((c) => c.obtida).map((c) => c.titulo)).toEqual([
      'Primeira visita',
      '5 encontros',
      'Primeiro estudo',
      'Primeiro voluntariado',
    ]);
    expect(j.linhaDoTempo.length).toBeGreaterThan(3);
    expect(j.linhaDoTempo.some((t) => t.texto === 'Doação à Campanha do Agasalho · 6 peças')).toBe(
      true,
    );
  });

  it('estudos e detalhe da turma do ESDE', async () => {
    const e = await meusEstudos(ids.victor, new Date('2026-10-02T23:00:00Z'));
    expect(e.map((x) => x.sigla)).toEqual(['ESDE', 'Evangelho']);
    const t = await detalheTurma(ids.victor, e[0]!.turmaId, new Date('2026-10-02T23:00:00Z'));
    expect(t).toMatchObject({ presentes: 14, realizadas: 16, frequencia: 88, progresso: 78 });
    expect(t!.proxima?.titulo).toBe('A justiça da reencarnação');
    expect(t!.materiais).toHaveLength(5);
    expect(await detalheTurma(ids.pessoa, e[0]!.turmaId)).toBeNull(); // quem não é aluno não vê
  });

  it('correção dos próprios dados grava auditoria só quando algo muda', async () => {
    const dados = { nome: 'Membro Teste Silva', whatsapp: '+5518900000098' };
    await atualizarDadosPessoais(ids.pessoa, dados, ids.usuario, '127.0.0.1');
    await atualizarDadosPessoais(ids.pessoa, dados, ids.usuario, '127.0.0.1');
    expect(await prisma.pessoa.findUniqueOrThrow({ where: { id: ids.pessoa } })).toMatchObject(
      dados,
    );
    const aud = await prisma.auditoria.findMany({
      where: { entidade: 'Pessoa', entidadeId: ids.pessoa },
    });
    expect(aud).toHaveLength(1);
    expect(aud[0]!.antes).toMatchObject({ nome: 'Membro Teste', whatsapp: '+5518900000099' });
  });

  it('assistência pedida pelo App fica ligada à pessoa da sessão', async () => {
    const vaga = await prisma.vagaAssistencia.create({
      data: { inicio: new Date(Date.now() + 3 * 86_400_000), vagas: 2 },
    });
    const r = await solicitarAtendimento(
      servicoPorSlug('atendimento-fraterno')!,
      {
        nome: 'Membro Teste Silva',
        whatsapp: '+5518911112222',
        relato: undefined,
        vagaId: vaga.id,
        consentimento: true,
      },
      { whatsapp: criarMocksMensageria().whatsapp, log, ip: null },
      { pessoaId: ids.pessoa },
    );
    const sol = await prisma.solicitacaoAssistencia.findUniqueOrThrow({ where: { id: r.id } });
    expect(sol.pessoaId).toBe(ids.pessoa);
    // O WhatsApp da conta não é trocado pelo informado no pedido.
    expect((await prisma.pessoa.findUniqueOrThrow({ where: { id: ids.pessoa } })).whatsapp).toBe(
      '+5518900000098',
    );
    await prisma.auditoria.deleteMany({ where: { entidadeId: r.id } });
    await prisma.solicitacaoAssistencia.delete({ where: { id: r.id } });
    await prisma.vagaAssistencia.delete({ where: { id: vaga.id } });
  });

  it('LGPD: exporta os dados do titular e registra pedido de exclusão com auditoria', async () => {
    const dados = await exportarDadosTitular(ids.pessoa, ids.usuario, '127.0.0.1');
    expect(dados.titular?.email).toBe(EMAIL);
    expect(dados.titular?.checkins).toHaveLength(1);
    await solicitarExclusaoDados(ids.pessoa, ids.usuario, '127.0.0.1');
    expect(
      (await prisma.pessoa.findUniqueOrThrow({ where: { id: ids.pessoa } })).exclusaoSolicitadaEm,
    ).not.toBeNull();
    expect(await prisma.auditoria.count({ where: { entidadeId: ids.usuario } })).toBe(2);
  });

  it('base do CEAK IA cita fontes oficiais', async () => {
    const docs = await documentosParaIA();
    expect(docs.map((d) => d.fonte)).toContain('Agenda CEAK');
    expect(docs.every((d) => d.texto.length > 10)).toBe(true);
  });
});
