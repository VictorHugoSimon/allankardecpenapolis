import { devices, expect, test } from '@playwright/test';

/**
 * A execução E2E padrão no localhost permite navegar sem instalar.
 * Na origem alternativa 127.0.0.1, validamos a tela real de instalação.
 * Esses testes NÃO simulam a instalação do WebAPK nem substituem o celular físico.
 */
const APP_LOCAL = 'http://127.0.0.1:3001';

test('Android exige instalação quando aberto pelo link no navegador', async ({ page }) => {
  await page.goto(APP_LOCAL);
  await expect(
    page.getByRole('heading', { name: 'Instale o CEAK App para continuar' }),
  ).toBeVisible();
  await expect(page.getByText('No Android:')).toBeVisible();
  await expect(page.getByText('Google Chrome').first()).toBeVisible();
});

test('iPhone orienta adicionar o PWA à tela de início pelo Safari', async ({ browser }) => {
  const contexto = await browser.newContext({ ...devices['iPhone 13'] });
  try {
    const page = await contexto.newPage();
    await page.goto(APP_LOCAL);
    await expect(
      page.getByRole('heading', { name: 'Instale o CEAK App para continuar' }),
    ).toBeVisible();
    await expect(page.getByText('No iPhone ou iPad:')).toBeVisible();
    await expect(page.getByText('Adicionar à Tela de Início')).toBeVisible();
  } finally {
    await contexto.close();
  }
});

test('Samsung Internet não recomenda desativar Play Protect', async ({ browser }) => {
  const contexto = await browser.newContext({
    ...devices['Pixel 7'],
    userAgent:
      'Mozilla/5.0 (Linux; Android 15; SAMSUNG SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
  });
  try {
    const page = await contexto.newPage();
    await page.goto(APP_LOCAL);
    await expect(
      page.getByRole('heading', { name: 'Instale o CEAK App para continuar' }),
    ).toBeVisible();
    await expect(page.getByText('Não desative o Play Protect.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir no Google Chrome' })).toBeVisible();
  } finally {
    await contexto.close();
  }
});
