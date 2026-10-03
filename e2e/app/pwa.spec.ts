import { expect, test } from '@playwright/test';
import { entrarApp } from './helpers';

/** PWA instalável: manifest válido, ícones, service worker e página offline. */

test('manifest e ícones atendem aos critérios de instalação', async ({ page, request }) => {
  await page.goto('/entrar');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');
  const m = await (await request.get(href!)).json();
  expect(m).toMatchObject({
    name: 'CEAK App — Centro Espírita Allan Kardec',
    short_name: 'CEAK',
    start_url: '/',
    display: 'standalone',
    lang: 'pt-BR',
  });
  const tamanhos = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(tamanhos).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons as { src: string }[]) {
    const r = await request.get(i.src);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('image/png');
  }
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#2F5D46');
});

test('service worker controla o App e mostra a página offline sem conexão', async ({
  page,
  context,
}) => {
  await entrarApp(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 })
    .toBe(true);

  // Só a página /offline (pública) fica guardada; nenhuma página da área do membro.
  const guardadas = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const k of await caches.keys()) {
      for (const r of await (await caches.open(k)).keys()) urls.push(new URL(r.url).pathname);
    }
    return urls.filter((u) => !u.startsWith('/_next/') && !u.startsWith('/icons/'));
  });
  expect(guardadas).toEqual(['/offline']);

  await context.setOffline(true);
  await page.goto('/agenda').catch(() => undefined);
  await expect(page.getByRole('heading', { name: 'Você está sem conexão' })).toBeVisible();
  // Dados pessoais não ficam no cache: a agenda não aparece offline.
  await expect(page.getByRole('heading', { name: 'Agenda' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  await context.setOffline(false);
  await page.goto('/agenda');
  await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible();
});
