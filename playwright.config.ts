import { defineConfig, devices } from '@playwright/test';
import { config as dotenv } from 'dotenv';

dotenv({ quiet: true });

const GESTAO = process.env.PLAYWRIGHT_GESTAO_URL ?? 'http://localhost:3002';

/**
 * Jornadas E2E. Pré-requisitos: banco migrado e semeado (`pnpm db:deploy && pnpm db:seed`)
 * e apps compilados (`pnpm build`). O Playwright sobe o Gestão com `next start`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: GESTAO,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /responsivo\.spec\.ts/ },
    { name: 'celular', use: { ...devices['Pixel 7'] }, testMatch: /responsivo\.spec\.ts/ },
  ],
  webServer: process.env.PLAYWRIGHT_GESTAO_URL
    ? undefined
    : {
        command: 'pnpm --filter @ceak/gestao start',
        url: `${GESTAO}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
