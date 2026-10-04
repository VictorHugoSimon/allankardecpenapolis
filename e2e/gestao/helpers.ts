import { createHmac } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

export const SENHA = process.env.SEED_SENHA ?? 'ceak-dev-2026';

/** Usuários do seed por perfil. */
export const USUARIOS = {
  ADMINISTRADOR: 'antonio.ferreira@allankardecpenapolis.com.br',
  DIRETORIA: 'lucia.moraes@allankardecpenapolis.com.br',
  TESOURARIA: 'maria.silva@allankardecpenapolis.com.br',
  SECRETARIA: 'paulo.mendes@allankardecpenapolis.com.br',
  COORDENADOR: 'renata.campos@allankardecpenapolis.com.br',
  INSTRUTOR: 'helena.prado@allankardecpenapolis.com.br',
  VOLUNTARIO: 'victor.alves@email.com',
  MEMBRO: 'joao.rocha@email.com',
  VISITANTE: 'carla.nogueira@email.com',
} as const;

export async function entrar(page: Page, email: string, senha = SENHA) {
  await confiarNavegador(page, email);
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Segredo do autenticador gravado pelo seed para Administrador, Diretoria e Tesouraria. */
export const SEED_TOTP_SEGREDO =
  process.env.SEED_TOTP_SEGREDO ?? 'JBSWY3DPEHPK3PXPCEAKDEVSEEDTOTPA';

function jwtHs256(payload: Record<string, unknown>, segredo: string) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const corpo = `${b64({ alg: 'HS256' })}.${b64(payload)}`;
  return `${corpo}.${createHmac('sha256', segredo).update(corpo).digest('base64url')}`;
}

/**
 * Equivale a ter marcado "Não pedir de novo neste navegador" antes: as jornadas
 * que não testam o 2FA entram só com a senha. O 2FA tem a sua própria spec.
 */
export async function confiarNavegador(page: Page, email: string) {
  const [u] = await consultar<{ id: string; ativ: Date | null }>(
    `select u.id, c.totp_ativado_em as ativ from usuario u
       left join credencial c on c.usuario_id = u.id
      where u.email = $1 and c.totp_segredo is not null`,
    [email],
  );
  if (!u?.ativ) return;
  const segredo = process.env.AUTH_SECRET ?? '';
  const agora = Math.floor(Date.now() / 1000);
  const token = jwtHs256(
    { tipo: '2fa-confiavel', ativ: new Date(u.ativ).toISOString(), sub: u.id, exp: agora + 86_400 },
    segredo,
  );
  const base = test.info().project.use.baseURL ?? 'http://localhost:3002';
  await page.context().addCookies([{ name: 'ceak_2fa_confiavel', value: token, url: base }]);
}

function deBase32(s: string) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of s.replace(/[\s=]/g, '').toUpperCase())
    bits += alfabeto.indexOf(c).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** Código do autenticador (RFC 6238) para o passo de 30 s indicado (padrão: agora). */
export function codigoTotp(segredo: string, passo = Math.floor(Date.now() / 30_000)) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(passo));
  const h = createHmac('sha1', deBase32(segredo)).update(msg).digest();
  const o = h[h.length - 1]! & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

/** Último link enviado por e-mail (mock) para o destinatário. */
export async function ultimoLink(destino: string, depoisDe: number): Promise<string> {
  const { existsSync, readFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const caixa = process.env.MOCK_CAIXA_ARQUIVO ?? join(tmpdir(), 'ceak-caixa-e2e.jsonl');
  for (let i = 0; i < 40; i++) {
    if (existsSync(caixa)) {
      const linhas = readFileSync(caixa, 'utf8').trim().split('\n').filter(Boolean).reverse();
      for (const l of linhas) {
        const m = JSON.parse(l) as { destino: string; corpo: string; enviadaEm: string };
        if (m.destino === destino && new Date(m.enviadaEm).getTime() >= depoisDe) {
          const u = m.corpo.match(/https?:\/\/\S+/);
          if (u) return u[0];
        }
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Nenhum link enviado para ${destino}`);
}

export async function consultar<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pg = (await import('pg')).default;
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    return (await db.query(sql, params)).rows as T[];
  } finally {
    await db.end();
  }
}
