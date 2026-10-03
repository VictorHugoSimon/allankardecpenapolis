import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarMockSocialProvider } from '@ceak/core/adapters';
import { criarLogger } from '@ceak/core/logger';
import {
  aprovarOuRejeitarConteudo,
  centralAprovacoes,
  contas,
  decidirAprovacao,
  ErroNegocio,
  listarPessoas,
  mudarStatusLancamento,
  painelEstudos,
  prisma,
  publicarConteudo,
  redefinirSenha,
  salvarConteudo,
  sessaoParaIdentidade,
  solicitarRedefinicaoSenha,
} from '../src';

const temBanco = !!process.env.DATABASE_URL;

describe.skipIf(!temBanco)('serviços do CEAK Gestão', () => {
  const log = criarLogger([() => undefined]);
  const ids = {
    conteudo: '',
    lancamento: '',
    aprovacao: '',
    admin: '',
    adminPessoa: '',
    tesouraria: '',
  };
  const ctxAdmin = () => ({
    usuarioId: ids.admin,
    pessoaId: ids.adminPessoa,
    perfil: 'ADMINISTRADOR' as const,
    coordAssistencia: false,
    ip: '127.0.0.1',
  });

  beforeAll(async () => {
    const admin = await prisma.usuario.findFirstOrThrow({ where: { perfil: 'ADMINISTRADOR' } });
    ids.admin = admin.id;
    ids.adminPessoa = admin.pessoaId;
    const c = await prisma.conteudo.create({
      data: {
        titulo: 'Teste de publicação do Gestão',
        fonte: 'Teste',
        status: 'REVISAO',
        tags: [],
        fontes: [],
        versoes: {
          create: [
            { canal: 'BLOG', texto: 'Texto do blog.' },
            { canal: 'INSTAGRAM', texto: 'Texto do Instagram.' },
            { canal: 'FACEBOOK', texto: 'Texto do Facebook.' },
          ],
        },
        aprovacoes: {
          create: {
            tipo: 'CONTEUDO',
            titulo: 'Teste de publicação do Gestão',
            entidade: 'Conteudo',
            entidadeId: 'x',
          },
        },
      },
    });
    ids.conteudo = c.id;
    const cat = await prisma.categoriaFinanceira.findFirstOrThrow({ where: { tipo: 'PAGAR' } });
    const l = await prisma.lancamento.create({
      data: {
        tipo: 'PAGAR',
        contraparte: 'Fornecedor de teste',
        descricao: 'Conta de teste',
        categoriaId: cat.id,
        valorCentavos: 12_345,
        vencimento: new Date(Date.now() + 10 * 86_400_000),
      },
    });
    ids.lancamento = l.id;
    ids.aprovacao = (
      await prisma.aprovacao.create({
        data: {
          tipo: 'FINANCEIRO',
          titulo: 'Pagamento de teste',
          entidade: 'Lancamento',
          entidadeId: l.id,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.auditoria.deleteMany({
      where: { entidadeId: { in: [ids.conteudo, ids.lancamento, ids.aprovacao] } },
    });
    await prisma.conteudo.deleteMany({ where: { id: ids.conteudo } });
    await prisma.aprovacao.deleteMany({ where: { id: ids.aprovacao } });
    await prisma.lancamento.deleteMany({ where: { id: ids.lancamento } });
    await prisma.$disconnect();
  });

  it('não publica sem aprovação humana', async () => {
    await expect(
      publicarConteudo(ids.conteudo, ctxAdmin(), { social: {}, log, siteUrl: 'http://site' }),
    ).rejects.toBeInstanceOf(ErroNegocio);
  });

  it('aprova, publica (Instagram sem token fica na fila) e audita cada passo', async () => {
    await aprovarOuRejeitarConteudo(ids.conteudo, 'APROVADO', ctxAdmin(), { log });
    const aprov = await prisma.aprovacao.findFirstOrThrow({ where: { conteudoId: ids.conteudo } });
    expect(aprov).toMatchObject({ decisao: 'APROVADO', responsavelId: ids.admin });
    const r = await publicarConteudo(ids.conteudo, ctxAdmin(), {
      social: {
        FACEBOOK: criarMockSocialProvider('FACEBOOK'),
        INSTAGRAM: criarMockSocialProvider('INSTAGRAM'),
      },
      log,
      siteUrl: 'http://site',
    });
    expect(r).toEqual({ publicados: ['Blog', 'Facebook'], naFila: ['Instagram'] });
    const c = await prisma.conteudo.findUniqueOrThrow({ where: { id: ids.conteudo } });
    expect(c.status).toBe('PUBLICADO');
    expect(c.slug).toBe('teste-de-publicacao-do-gestao');
    const acoes = (
      await prisma.auditoria.findMany({
        where: { entidadeId: ids.conteudo },
        orderBy: { criadoEm: 'asc' },
      })
    ).map((a) => a.acao);
    expect(acoes).toEqual(['aprovou conteúdo', 'publicou conteúdo']);
    await expect(
      salvarConteudo(ids.conteudo, { titulo: 'x', versoes: {} }, ctxAdmin()),
    ).rejects.toBeInstanceOf(ErroNegocio);
  });

  it('financeiro: só transições permitidas, com auditoria e Central de aprovações em sincronia', async () => {
    const tes = await prisma.usuario.findFirstOrThrow({ where: { perfil: 'TESOURARIA' } });
    const ctx = {
      usuarioId: tes.id,
      pessoaId: tes.pessoaId,
      perfil: 'TESOURARIA' as const,
      coordAssistencia: false,
    };
    await expect(
      mudarStatusLancamento(ctx, ids.lancamento, 'PAGO', { ip: null }, { log }),
    ).rejects.toBeInstanceOf(ErroNegocio);
    await decidirAprovacao(ctx, ids.aprovacao, 'APROVADO', { ip: null }, { log });
    expect(
      (await prisma.lancamento.findUniqueOrThrow({ where: { id: ids.lancamento } })).status,
    ).toBe('APROVADO');
    await mudarStatusLancamento(ctx, ids.lancamento, 'PAGO', { ip: null }, { log });
    const l = await prisma.lancamento.findUniqueOrThrow({ where: { id: ids.lancamento } });
    expect(l.status).toBe('PAGO');
    expect(l.pagoEm).not.toBeNull();
    expect(await prisma.auditoria.count({ where: { entidadeId: ids.lancamento } })).toBe(2);
    const lista = await contas(ctx, 'PAGAR', new Date(Date.now() + 10 * 86_400_000));
    expect(lista.linhas.find((x) => x.id === ids.lancamento)?.acoes).toEqual([]);
  });

  it('RLS: Secretaria não lê o financeiro; Coordenador não decide aprovação financeira', async () => {
    const sec = await prisma.usuario.findFirstOrThrow({ where: { perfil: 'SECRETARIA' } });
    const ctx = {
      usuarioId: sec.id,
      pessoaId: sec.pessoaId,
      perfil: 'SECRETARIA' as const,
      coordAssistencia: false,
    };
    const r = await contas(ctx, 'PAGAR', new Date());
    expect(r.linhas).toEqual([]);
    const c = await centralAprovacoes('COORDENADOR');
    expect(c.contadores).toEqual([]);
  });

  it('Instrutor vê só os próprios alunos e turmas', async () => {
    const helena = await prisma.usuario.findFirstOrThrow({
      where: { email: { startsWith: 'helena.prado' } },
    });
    const ctx = {
      usuarioId: helena.id,
      pessoaId: helena.pessoaId,
      perfil: 'INSTRUTOR' as const,
      coordAssistencia: false,
    };
    const p = await listarPessoas(ctx, { aba: 'Membros' });
    const alunosDaHelena = await prisma.matricula.findMany({
      where: { turma: { instrutorId: helena.pessoaId } },
      select: { pessoaId: true },
    });
    const permitidos = new Set([helena.pessoaId, ...alunosDaHelena.map((a) => a.pessoaId)]);
    expect(p.pessoas.length).toBeGreaterThan(0);
    expect(p.pessoas.every((x) => permitidos.has(x.id))).toBe(true);
    const e = await painelEstudos({ instrutorId: helena.pessoaId });
    expect(e.turmas.every((t) => t.instrutor === 'Helena Prado')).toBe(true);
  });

  it('sessão traz as funções extras para o seletor de perfil', async () => {
    const s = await sessaoParaIdentidade({ email: 'paulo.mendes@allankardecpenapolis.com.br' });
    expect(s?.perfis).toEqual(['SECRETARIA', 'INSTRUTOR']);
  });

  it('redefinição de senha: link de uso único', async () => {
    const enviados: string[] = [];
    const email = 'maria.silva@allankardecpenapolis.com.br';
    await solicitarRedefinicaoSenha(email, {
      enviarEmail: async (_p, _a, t) => enviados.push(t),
      urlBase: 'http://gestao',
      log,
    });
    await solicitarRedefinicaoSenha('ninguem@exemplo.com', {
      enviarEmail: async (_p, _a, t) => enviados.push(t),
      urlBase: 'http://gestao',
      log,
    });
    expect(enviados).toHaveLength(1);
    const token = new URL(enviados[0]!.match(/http\S+/)![0]).searchParams.get('t')!;
    const antes = await prisma.credencial.findFirstOrThrow({ where: { usuario: { email } } });
    expect(await redefinirSenha(email, 'token-errado', 'novasenha2026', null)).toBe(false);
    expect(await redefinirSenha(email, token, 'ceak-dev-2026', null)).toBe(true);
    expect(await redefinirSenha(email, token, 'outra2026senha', null)).toBe(false);
    const depois = await prisma.credencial.findFirstOrThrow({ where: { usuario: { email } } });
    expect(depois.senhaHash).not.toBe(antes.senhaHash);
  });
});
