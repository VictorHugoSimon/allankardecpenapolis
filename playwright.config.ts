import { defineConfig, devices } from '@playwright/test';
import { config as dotenv } from 'dotenv';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

dotenv({ quiet: true });
// Faz o modo offline e as rotas do Playwright valerem também para o service worker do App.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

const GESTAO = process.env.PLAYWRIGHT_GESTAO_URL ?? 'http://localhost:3002';
const SITE = process.env.PLAYWRIGHT_SITE_URL ?? 'http://localhost:3000';
const APP = process.env.PLAYWRIGHT_APP_URL ?? 'http://localhost:3001';
/** O App grava as mensagens dos mocks aqui (os testes leem o código de acesso do WhatsApp). */
process.env.MOCK_CAIXA_ARQUIVO ??= join(tmpdir(), 'ceak-caixa-e2e.jsonl');

/**
 * Jornadas E2E. Pré-requisitos: banco migrado e semeado (`pnpm db:deploy && pnpm db:seed`)
 * e apps compilados (`pnpm build`). O Playwright sobe os apps com `next start`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'gestao',
      testDir: './e2e/gestao',
      testIgnore: /responsivo/,
      use: { ...devices['Desktop Chrome'], baseURL: GESTAO },
    },
    {
      name: 'gestao-celular',
      testDir: './e2e/gestao',
      testMatch: /responsivo\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: GESTAO },
    },
    {
      name: 'site',
      testDir: './e2e/site',
      testIgnore: /responsivo/,
      use: { ...devices['Desktop Chrome'], baseURL: SITE },
    },
    {
      name: 'site-celular',
      testDir: './e2e/site',
      testMatch: /responsivo\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: SITE },
    },
    {
      name: 'app',
      testDir: './e2e/app',
      testIgnore: /moldura/,
      use: { ...devices['Pixel 7'], baseURL: APP },
    },
    {
      name: 'app-desktop',
      testDir: './e2e/app',
      testMatch: /moldura\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: APP },
    },
  ],
  webServer: [
    ...(process.env.PLAYWRIGHT_GESTAO_URL
      ? []
      : [
          {
            command: 'pnpm --filter @ceak/gestao start',
            url: `${GESTAO}/api/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
    ...(process.env.PLAYWRIGHT_SITE_URL
      ? []
      : [
          {
            command: 'pnpm --filter @ceak/site start',
            url: SITE,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
    ...(process.env.PLAYWRIGHT_APP_URL
      ? []
      : [
          {
            command: 'pnpm --filter @ceak/app start',
            url: `${APP}/api/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: { MOCK_CAIXA_ARQUIVO: process.env.MOCK_CAIXA_ARQUIVO },
          },
        ]),
  ],
});
