import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { codigoTotp, passoTotp } from '@ceak/core/auth';
import {
  confirmarConfiguracao2fa,
  ErroNegocio,
  etapaDoisFatores,
  iniciarConfiguracao2fa,
  prisma,
  redefinir2fa,
  situacao2fa,
  verificarSegundoFator,
} from '../src';

const temBanco = !!process.env.DATABASE_URL;
const CHAVE = 'chave-de-teste-0123456789-abcdefghijklmnop';

describe.skipIf(!temBanco)('autenticador (2FA) do Gestão', () => {
  let id = '';
  let segredo = '';
  let recuperacao: string[] = [];
  let inicio = new Date();

  // Usuário fixo e reaproveitado: a auditoria é imutável, então ele não pode ser apagado.
  beforeAll(async () => {
    const email = 'teste.2fa@exemplo.com';
    const u =
      (await prisma.usuario.findUnique({ where: { email } })) ??
      (await prisma.usuario.create({
        data: { email, perfil: 'TESOURARIA', pessoa: { create: { nome: 'Teste 2FA' } } },
      }));
    id = u.id;
    await prisma.usuario.update({
      where: { id },
      data: { ativo: true, tentativasFalhas: 0, bloqueadoAte: null, doisFatores: false },
    });
    await prisma.credencial.upsert({
      where: { usuarioId: id },
      create: { usuarioId: id, senhaHash: 'x' },
      update: {
        totpSegredo: null,
        totpPendente: null,
        totpAtivadoEm: null,
        totpUltimoPasso: null,
        codigosRecuperacao: [],
      },
    });
    inicio = new Date();
  });

  afterAll(async () => {
    await prisma.credencial.deleteMany({ where: { usuarioId: id } });
    await prisma.usuario.update({ where: { id }, data: { ativo: false } });
  });

  it('Tesouraria sem autenticador precisa configurar', async () => {
    expect((await etapaDoisFatores(id)).etapa).toBe('configurar');
    expect((await situacao2fa([id]))[id]).toMatchObject({ ativo: false, exige: true });
  });

  it('ativa com o primeiro código válido e devolve 8 códigos de recuperação', async () => {
    const c = await iniciarConfiguracao2fa(id, CHAVE);
    segredo = c.segredo;
    expect(c.uri).toMatch(/^otpauth:\/\/totp\//);
    // Recarregar a página não troca o segredo pendente.
    expect((await iniciarConfiguracao2fa(id, CHAVE)).segredo).toBe(segredo);
    await expect(confirmarConfiguracao2fa(id, '000000', CHAVE, null)).rejects.toBeInstanceOf(
      ErroNegocio,
    );
    recuperacao = await confirmarConfiguracao2fa(
      id,
      codigoTotp(segredo, passoTotp() - 1),
      CHAVE,
      null,
    );
    expect(recuperacao).toHaveLength(8);
    const cred = await prisma.credencial.findUniqueOrThrow({ where: { usuarioId: id } });
    expect(cred.totpSegredo).not.toContain(segredo);
    expect(cred.codigosRecuperacao).not.toContain(recuperacao[0]);
    expect((await etapaDoisFatores(id)).etapa).toBe('verificar');
  });

  it('o mesmo código não vale duas vezes', async () => {
    const codigo = codigoTotp(segredo, passoTotp());
    expect(await verificarSegundoFator(id, codigo, CHAVE, null)).toMatchObject({ ok: true });
    expect(await verificarSegundoFator(id, codigo, CHAVE, null)).toEqual({
      ok: false,
      motivo: 'invalido',
    });
  });

  it('código de recuperação vale uma vez', async () => {
    const r = await verificarSegundoFator(id, recuperacao[0]!, CHAVE, null);
    expect(r).toEqual({ ok: true, recuperacao: true, restantes: 7 });
    expect(await verificarSegundoFator(id, recuperacao[0]!, CHAVE, null)).toMatchObject({
      ok: false,
    });
  });

  it('5 erros bloqueiam por 15 minutos', async () => {
    await prisma.usuario.update({ where: { id }, data: { tentativasFalhas: 0 } });
    for (let i = 0; i < 5; i++) await verificarSegundoFator(id, '111111', CHAVE, null);
    expect(await verificarSegundoFator(id, recuperacao[1]!, CHAVE, null)).toEqual({
      ok: false,
      motivo: 'bloqueado',
    });
    await prisma.usuario.update({
      where: { id },
      data: { tentativasFalhas: 0, bloqueadoAte: null },
    });
  });

  it('redefinir apaga o autenticador e registra na auditoria', async () => {
    await redefinir2fa(id, id, '127.0.0.1');
    expect((await etapaDoisFatores(id)).etapa).toBe('configurar');
    const a = await prisma.auditoria.count({
      where: { entidadeId: id, acao: { contains: 'autenticador' }, criadoEm: { gte: inicio } },
    });
    expect(a).toBe(2);
  });
});
