import { describe, expect, it, vi } from 'vitest';
import {
  assinarSessao,
  gerarCodigoAcesso,
  hashSenha,
  lerSessao,
  precisaRenovar,
  verificarSenha,
  type Sessao,
} from '../src/auth';
import { criarSupabaseAuthProvider } from '../src/auth/supabase';

const SECRET = 'segredo-de-teste-com-mais-de-32-caracteres!!';
const sessao: Sessao = {
  usuarioId: '11111111-1111-1111-1111-111111111111',
  pessoaId: '22222222-2222-2222-2222-222222222222',
  nome: 'Maria Silva',
  email: 'maria.silva@allankardecpenapolis.com.br',
  perfil: 'TESOURARIA',
  coordAssistencia: false,
};

describe('senha', () => {
  it('gera hash scrypt e verifica', async () => {
    const h = await hashSenha('ceak-dev-2026');
    expect(h).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(await verificarSenha('ceak-dev-2026', h)).toBe(true);
    expect(await verificarSenha('outra', h)).toBe(false);
    expect(await verificarSenha('x', 'lixo')).toBe(false);
  });

  it('gera códigos de 6 dígitos', () => {
    for (let i = 0; i < 50; i++) expect(gerarCodigoAcesso()).toMatch(/^\d{6}$/);
  });
});

describe('sessão', () => {
  it('assina e lê o cookie', async () => {
    const t = await assinarSessao(sessao, SECRET);
    // Sem funções extras, o seletor de perfil recebe só o perfil ativo.
    expect(await lerSessao(t, SECRET)).toEqual({ ...sessao, perfis: [sessao.perfil] });
    const multi = await assinarSessao({ ...sessao, perfis: ['SECRETARIA', 'INSTRUTOR'] }, SECRET);
    expect((await lerSessao(multi, SECRET))?.perfis).toEqual(['SECRETARIA', 'INSTRUTOR']);
  });

  it('rejeita assinatura de outro segredo, token adulterado e vazio', async () => {
    const t = await assinarSessao(sessao, SECRET);
    expect(await lerSessao(t, SECRET.replace('!', '?'))).toBeNull();
    const [h, , s] = t.split('.');
    const forjado = Buffer.from(JSON.stringify({ ...sessao, perfil: 'ADMINISTRADOR' })).toString(
      'base64url',
    );
    expect(await lerSessao(`${h}.${forjado}.${s}`, SECRET)).toBeNull();
    expect(await lerSessao(undefined, SECRET)).toBeNull();
  });

  it('expira e sinaliza renovação', async () => {
    const curto = await assinarSessao(sessao, SECRET, 60);
    expect(await precisaRenovar(curto, SECRET)).toBe(true);
    const longo = await assinarSessao(sessao, SECRET);
    expect(await precisaRenovar(longo, SECRET)).toBe(false);
    const expirado = await assinarSessao(sessao, SECRET, -10);
    expect(await lerSessao(expirado, SECRET)).toBeNull();
  });

  it('exige segredo forte', async () => {
    await expect(assinarSessao(sessao, 'curto')).rejects.toThrow(/32/);
  });
});

describe('Supabase Auth (REST)', () => {
  it('entra com senha e mapeia o usuário', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 'abc', email: 'a@b.com' } }), { status: 200 }),
      );
    const p = criarSupabaseAuthProvider({ url: 'http://sb.local/', anonKey: 'anon', fetch });
    expect(await p.entrarComSenha('a@b.com', 'x')).toEqual({
      authId: 'abc',
      email: 'a@b.com',
      telefone: undefined,
    });
    expect(fetch.mock.calls[0]![0]).toBe('http://sb.local/auth/v1/token?grant_type=password');
  });

  it('retorna null em credencial inválida', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 400 }));
    const p = criarSupabaseAuthProvider({ url: 'http://sb.local', anonKey: 'anon', fetch });
    expect(await p.entrarComSenha('a@b.com', 'x')).toBeNull();
  });

  it('envia código por WhatsApp', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const p = criarSupabaseAuthProvider({ url: 'http://sb.local', anonKey: 'anon', fetch });
    await p.enviarCodigo('+5518999990000', 'whatsapp');
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toMatchObject({
      phone: '+5518999990000',
      channel: 'whatsapp',
    });
  });
});
