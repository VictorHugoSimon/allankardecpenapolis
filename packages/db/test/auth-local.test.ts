import { afterAll, describe, expect, it } from 'vitest';
import { criarLocalAuthProvider, prisma, sessaoParaIdentidade } from '../src';

const temBanco = !!process.env.DATABASE_URL;

describe.skipIf(!temBanco)('provedor de identidade local', () => {
  const enviados: { destino: string; msg: string }[] = [];
  const auth = criarLocalAuthProvider({
    enviar: async (destino, _c, msg) => void enviados.push({ destino, msg }),
  });

  afterAll(async () => {
    await prisma.codigoAcesso.deleteMany({});
    await prisma.$disconnect();
  });

  it('entra com a senha do seed', async () => {
    const id = await auth.entrarComSenha(
      'Maria.Silva@allankardecpenapolis.com.br',
      process.env.SEED_SENHA ?? 'ceak-dev-2026',
    );
    expect(id).toEqual({ email: 'maria.silva@allankardecpenapolis.com.br' });
    const s = await sessaoParaIdentidade(id!);
    expect(s).toMatchObject({ nome: 'Maria Silva', perfil: 'TESOURARIA', coordAssistencia: false });
  });

  it('recusa senha errada e usuário inativo', async () => {
    expect(
      await auth.entrarComSenha('maria.silva@allankardecpenapolis.com.br', 'errada'),
    ).toBeNull();
    expect(
      await auth.entrarComSenha(
        'carlos.t@allankardecpenapolis.com.br',
        process.env.SEED_SENHA ?? 'ceak-dev-2026',
      ),
    ).toBeNull();
    expect(await auth.entrarComSenha('ninguem@x.com', 'x')).toBeNull();
  });

  it('código por WhatsApp: envia, aceita uma vez e limita tentativas', async () => {
    const tel = '+5518996541120';
    await auth.enviarCodigo(tel, 'whatsapp');
    const codigo = enviados.at(-1)!.msg.match(/\d{6}/)![0];
    const errado = codigo === '000000' ? '111111' : '000000';
    expect(await auth.verificarCodigo(tel, 'whatsapp', errado)).toBeNull();
    const id = await auth.verificarCodigo(tel, 'whatsapp', codigo);
    expect(id).toEqual({ telefone: tel });
    expect((await sessaoParaIdentidade(id!))?.nome).toBe('Victor Alves');
    expect(await auth.verificarCodigo(tel, 'whatsapp', codigo)).toBeNull(); // já usado

    await auth.enviarCodigo(tel, 'whatsapp');
    const novo = enviados.at(-1)!.msg.match(/\d{6}/)![0];
    const outro = novo === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await auth.verificarCodigo(tel, 'whatsapp', outro);
    expect(await auth.verificarCodigo(tel, 'whatsapp', novo)).toBeNull(); // bloqueado após 5 erros
  });

  it('o código é guardado como hash', async () => {
    const c = await prisma.codigoAcesso.findFirstOrThrow();
    expect(c.codigoHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
