/**
 * Integração com o banco: exige DATABASE_URL com migrações aplicadas e seed (`pnpm db:seed`).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Perfil } from '@ceak/core/rbac';
import { comRls, prisma, registrarAuditoria, type ContextoRls } from '../src';

const temBanco = !!process.env.DATABASE_URL;

describe.skipIf(!temBanco)('RLS por perfil', () => {
  const ctx: Record<string, ContextoRls> = {};

  beforeAll(async () => {
    const usuarios = await prisma.usuario.findMany({ include: { pessoa: true } });
    for (const u of usuarios) {
      ctx[u.pessoa.nome] = {
        usuarioId: u.id,
        pessoaId: u.pessoaId,
        perfil: u.perfil as Perfil,
        coordAssistencia: u.coordAssistencia,
      };
    }
    expect(Object.keys(ctx).length).toBeGreaterThan(5);
  });

  afterAll(async () => {
    await prisma.auditoria.deleteMany({ where: { acao: 'teste-rls' } });
    await prisma.$disconnect();
  });

  it('financeiro: só Administrador, Diretoria e Tesouraria', async () => {
    const conta = (nome: string) => comRls(ctx[nome]!, (tx) => tx.lancamento.count());
    expect(await conta('Maria Silva')).toBeGreaterThan(0);
    expect(await conta('Antônio Ferreira')).toBeGreaterThan(0);
    expect(await conta('Lúcia Moraes')).toBeGreaterThan(0);
    expect(await conta('Paulo Mendes')).toBe(0);
    expect(await conta('Helena Prado')).toBe(0);
    expect(await conta('Victor Alves')).toBe(0);
  });

  it('financeiro: Secretaria não consegue inserir lançamento', async () => {
    const cat = await prisma.categoriaFinanceira.findFirstOrThrow();
    await expect(
      comRls(ctx['Paulo Mendes']!, (tx) =>
        tx.lancamento.create({
          data: {
            tipo: 'PAGAR',
            contraparte: 'X',
            descricao: 'X',
            categoriaId: cat.id,
            valorCentavos: 1,
            vencimento: new Date(),
          },
        }),
      ),
    ).rejects.toThrow();
  });

  it('assistência: relato só para a coordenação de assistência', async () => {
    const relatos = (nome: string) => comRls(ctx[nome]!, (tx) => tx.relatoAssistencia.count());
    const solicitacoes = (nome: string) =>
      comRls(ctx[nome]!, (tx) => tx.solicitacaoAssistencia.count());

    expect(await relatos('Sueli Andrade')).toBe(6); // coordenação de assistência
    expect(await relatos('Antônio Ferreira')).toBe(0); // Administrador vê solicitações, não relatos
    expect(await relatos('Renata Campos')).toBe(0); // Coordenador sem a função de assistência
    expect(await solicitacoes('Antônio Ferreira')).toBe(6);
    expect(await solicitacoes('Renata Campos')).toBe(6);
    expect(await solicitacoes('Victor Alves')).toBe(0); // Voluntário: só a escala
    expect(await solicitacoes('Maria Silva')).toBe(0);
  });

  it('assistência: membro vê a própria solicitação, sem relato', async () => {
    const carla = ctx['Carla Nogueira']!;
    const minhas = await comRls(carla, (tx) =>
      tx.solicitacaoAssistencia.findMany({ include: { relato: true } }),
    );
    expect(minhas).toHaveLength(1);
    expect(minhas[0]!.relato).toBeNull();
  });

  it('pessoas: Instrutor vê só os seus alunos; Membro só a si', async () => {
    const helena = await comRls(ctx['Helena Prado']!, (tx) =>
      tx.pessoa.findMany({ select: { nome: true } }),
    );
    expect(helena.map((p) => p.nome).sort()).toEqual(
      [
        'Cláudia Ribeiro',
        'Helena Prado',
        'João Batista Rocha',
        'Marcos Tavares',
        'Renata Campos',
        'Sueli Andrade',
        'Victor Alves',
      ].sort(),
    );
    const joao = await comRls(ctx['João Batista Rocha']!, (tx) =>
      tx.pessoa.findMany({ select: { nome: true } }),
    );
    expect(joao.map((p) => p.nome)).toEqual(['João Batista Rocha']);
    const secretaria = await comRls(ctx['Paulo Mendes']!, (tx) => tx.pessoa.count());
    expect(secretaria).toBe(await prisma.pessoa.count());
  });

  it('credenciais nunca são lidas pelo papel da aplicação', async () => {
    await expect(
      comRls(ctx['Antônio Ferreira']!, (tx) => tx.credencial.findMany()),
    ).rejects.toThrow(/permission denied/);
    await expect(comRls(ctx['Antônio Ferreira']!, (tx) => tx.codigoAcesso.count())).rejects.toThrow(
      /permission denied/,
    );
  });

  it('usuários: só o próprio registro, exceto Administrador', async () => {
    expect(await comRls(ctx['Maria Silva']!, (tx) => tx.usuario.count())).toBe(1);
    expect(await comRls(ctx['Antônio Ferreira']!, (tx) => tx.usuario.count())).toBe(
      await prisma.usuario.count(),
    );
  });

  it('auditoria: grava diff, é imutável e só Admin/Diretoria leem', async () => {
    const maria = ctx['Maria Silva']!;
    await comRls(maria, (tx) =>
      registrarAuditoria(tx, {
        usuarioId: maria.usuarioId,
        acao: 'teste-rls',
        entidade: 'Lancamento',
        entidadeId: 'x',
        antes: { valor: 84200, status: 'PENDENTE' },
        depois: { valor: 86200, status: 'PENDENTE' },
        ip: '127.0.0.1',
      }),
    );
    const reg = await prisma.auditoria.findFirstOrThrow({ where: { acao: 'teste-rls' } });
    expect(reg.antes).toEqual({ valor: 84200 });
    expect(reg.depois).toEqual({ valor: 86200 });

    expect(await comRls(maria, (tx) => tx.auditoria.count())).toBe(0);
    expect(await comRls(ctx['Antônio Ferreira']!, (tx) => tx.auditoria.count())).toBeGreaterThan(0);
    await expect(
      prisma.auditoria.update({ where: { id: reg.id }, data: { acao: 'adulterado' } }),
    ).rejects.toThrow(/não podem ser alterados/);
  });

  it('anônimo não lê pessoas', async () => {
    const n = await comRls(
      { usuarioId: null, pessoaId: null, perfil: 'ANONIMO', coordAssistencia: false },
      (tx) => tx.pessoa.count(),
    );
    expect(n).toBe(0);
  });
});
