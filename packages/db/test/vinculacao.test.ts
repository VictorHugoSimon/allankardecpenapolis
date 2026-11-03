import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ativarContaVinculada, emitirConviteVinculacao, ErroNegocio, prisma } from '../src';

const temBanco = !!process.env.DATABASE_URL;
const BASE = 'https://ceak-app.exemplo.invalid';

describe.skipIf(!temBanco)('vinculação supervisionada de cadastros', () => {
  const pessoas: string[] = [];
  let administrador = '';
  const flagAnterior = process.env.CEAK_ENABLE_ACCOUNT_LINKING;

  async function visitante() {
    const email = `ativacao-${crypto.randomUUID()}@exemplo.invalid`;
    const pessoa = await prisma.pessoa.create({
      data: { nome: 'Participante de teste', email, perfil: 'VISITANTE', status: 'NOVO' },
    });
    pessoas.push(pessoa.id);
    return pessoa;
  }

  beforeAll(async () => {
    process.env.CEAK_ENABLE_ACCOUNT_LINKING = 'sim';
    administrador = (
      await prisma.usuario.findFirstOrThrow({
        where: { perfil: 'ADMINISTRADOR', ativo: true },
        select: { id: true },
      })
    ).id;
  });

  afterEach(async () => {
    // Cada teste usa seus próprios IDs; jamais apagar códigos ou pessoas gerais.
    await prisma.codigoAcesso.deleteMany({
      where: { destino: { in: pessoas.map((id) => `vincular-app:${id}`) } },
    });
  });

  afterAll(async () => {
    if (pessoas.length) {
      await prisma.auditoria.deleteMany({ where: { entidadeId: { in: pessoas } } });
      await prisma.usuario.deleteMany({ where: { pessoaId: { in: pessoas } } });
      await prisma.pessoa.deleteMany({ where: { id: { in: pessoas } } });
    }
    if (flagAnterior === undefined) delete process.env.CEAK_ENABLE_ACCOUNT_LINKING;
    else process.env.CEAK_ENABLE_ACCOUNT_LINKING = flagAnterior;
    await prisma.$disconnect();
  });

  it('recusa convite solicitado por usuário não administrador', async () => {
    const pessoa = await visitante();
    const naoAdmin = await prisma.usuario.findFirstOrThrow({
      where: { perfil: 'VISITANTE', ativo: true },
      select: { id: true },
    });
    await expect(emitirConviteVinculacao(pessoa.id, naoAdmin.id, null, BASE)).rejects.toMatchObject(
      { codigo: 'sem_permissao' },
    );
    expect(
      await prisma.codigoAcesso.count({
        where: { destino: `vincular-app:${pessoa.id}` },
      }),
    ).toBe(0);
  });

  it('ativa o cadastro anterior uma vez e preserva a pessoa', async () => {
    const pessoa = await visitante();
    const convite = await emitirConviteVinculacao(pessoa.id, administrador, null, BASE);
    const url = new URL(convite.url);
    expect(convite.validadeMinutos).toBe(20);
    expect(url.pathname).toBe('/ativar-conta');
    expect(url.searchParams.get('p')).toBe(pessoa.id);
    const token = url.searchParams.get('t')!;
    const registro = await prisma.codigoAcesso.findFirstOrThrow({
      where: { destino: `vincular-app:${pessoa.id}` },
    });
    expect(registro.codigoHash).not.toBe(token);
    expect(registro.codigoHash).toMatch(/^[a-f0-9]{64}$/);

    const usuario = await ativarContaVinculada(pessoa.id, token, 'senhaSegura2026', null);
    expect(usuario.email).toBe(pessoa.email);
    expect(
      await prisma.usuario.findUniqueOrThrow({
        where: { id: usuario.id },
      }),
    ).toMatchObject({ pessoaId: pessoa.id, perfil: 'VISITANTE' });
    expect(
      (
        await prisma.codigoAcesso.findUniqueOrThrow({
          where: { id: registro.id },
        })
      ).usadoEm,
    ).not.toBeNull();
    await expect(
      ativarContaVinculada(pessoa.id, token, 'senhaSegura2026', null),
    ).rejects.toBeInstanceOf(ErroNegocio);
    expect(await prisma.usuario.count({ where: { pessoaId: pessoa.id } })).toBe(1);
  });

  it('recusa convites expirados sem criar conta', async () => {
    const pessoa = await visitante();
    const convite = await emitirConviteVinculacao(pessoa.id, administrador, null, BASE);
    const token = new URL(convite.url).searchParams.get('t')!;
    await prisma.codigoAcesso.updateMany({
      where: { destino: `vincular-app:${pessoa.id}` },
      data: { expiraEm: new Date(Date.now() - 60_000) },
    });
    await expect(
      ativarContaVinculada(pessoa.id, token, 'senhaSegura2026', null),
    ).rejects.toMatchObject({ codigo: 'convite_invalido' });
    expect(await prisma.usuario.count({ where: { pessoaId: pessoa.id } })).toBe(0);
  });

  it('revoga um convite anterior quando emite outro', async () => {
    const pessoa = await visitante();
    const primeiro = await emitirConviteVinculacao(pessoa.id, administrador, null, BASE);
    const segundo = await emitirConviteVinculacao(pessoa.id, administrador, null, BASE);
    await expect(
      ativarContaVinculada(
        pessoa.id,
        new URL(primeiro.url).searchParams.get('t')!,
        'senhaSegura2026',
        null,
      ),
    ).rejects.toMatchObject({ codigo: 'convite_invalido' });
    const ativado = await ativarContaVinculada(
      pessoa.id,
      new URL(segundo.url).searchParams.get('t')!,
      'senhaSegura2026',
      null,
    );
    expect(ativado.email).toBe(pessoa.email);
  });
});
