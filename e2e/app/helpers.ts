import { createHmac, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';
import pg from 'pg';

export const SENHA = process.env.SEED_SENHA ?? 'ceak-dev-2026';
export const VICTOR = 'victor.alves@email.com';
export const JOAO = 'joao.rocha@email.com';
/** Caixa de saída dos mocks (o App sobe com MOCK_CAIXA_ARQUIVO apontando para cá). */
export const CAIXA = process.env.MOCK_CAIXA_ARQUIVO ?? join(tmpdir(), 'ceak-caixa-e2e.jsonl');

export async function entrarApp(page: Page, email = VICTOR, senha = SENHA) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

function banco() {
  return new pg.Client({ connectionString: process.env.DATABASE_URL });
}

/** Mesmo segredo do App: CHECKIN_SECRET ou, sem ele, AUTH_SECRET. */
export function tokenCheckin(eventoId: string): string {
  const c = process.env.CHECKIN_SECRET;
  const a = process.env.AUTH_SECRET;
  const segredo =
    c && c.length >= 16
      ? c
      : a && a.length >= 32
        ? a
        : 'dev-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
  return createHmac('sha256', segredo)
    .update(`checkin:${eventoId}`)
    .digest('base64url')
    .slice(0, 22);
}

/**
 * Palestra começando agora (check-in aberto). Os dados do seed têm datas fixas,
 * então a atividade "de hoje" é criada pelo próprio teste e removida no fim.
 */
export async function criarPalestraAgora(titulo: string) {
  const db = banco();
  await db.connect();
  const id = randomUUID();
  const slug = `e2e-${id.slice(0, 8)}`;
  const inicio = new Date(Date.now() - 20 * 60_000);
  const fim = new Date(Date.now() + 70 * 60_000);
  await db.query(
    `INSERT INTO evento (id, slug, titulo, tipo, status, inicio, fim, local, responsavel, publico, atualizado_em)
     VALUES ($1, $2, $3, 'PALESTRA', 'EM_ANDAMENTO', $4, $5, 'Salão principal', 'Equipe E2E', true, now())`,
    [id, slug, titulo, inicio, fim],
  );
  await db.end();
  return { id, slug };
}

export async function removerEvento(id: string) {
  const db = banco();
  await db.connect();
  await db.query('DELETE FROM checkin WHERE evento_id = $1', [id]);
  await db.query('DELETE FROM avaliacao WHERE evento_id = $1', [id]);
  await db.query('DELETE FROM evento WHERE id = $1', [id]);
  await db.end();
}

/** Último código de acesso enviado (mock do WhatsApp) para o destino. */
export async function ultimoCodigo(destino: string, depoisDe: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    if (existsSync(CAIXA)) {
      const linhas = readFileSync(CAIXA, 'utf8').trim().split('\n').filter(Boolean).reverse();
      for (const l of linhas) {
        const m = JSON.parse(l) as { destino: string; corpo: string; enviadaEm: string };
        if (m.destino === destino && new Date(m.enviadaEm).getTime() >= depoisDe) {
          const c = m.corpo.match(/\b(\d{6})\b/);
          if (c) return c[1]!;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Nenhum código enviado para ${destino}`);
}
