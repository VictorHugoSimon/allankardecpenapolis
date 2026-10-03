import { expect, type Page } from '@playwright/test';

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
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
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
