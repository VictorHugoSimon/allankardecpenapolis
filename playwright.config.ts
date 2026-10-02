import { defineConfig, devices } from '@playwright/test';
import { config as dotenv } from 'dotenv';

dotenv({ quiet: true });

const GESTAO = process.env.PLAYWRIGHT_GESTAO_URL ?? 'http://localhost:3002';
const SITE = process.env.PLAYWRIGHT_SITE_URL ?? 'http://localhost:3000';

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
  ],
});
