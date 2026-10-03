import { expect, test } from '@playwright/test';
import { entrarApp } from './helpers';

/** Desktop: o App aparece na moldura de celular com o painel de atalhos ao lado. */
test('moldura de celular e painel de jornadas no desktop', async ({ page }) => {
  await entrarApp(page);
  const painel = page.getByRole('complementary', { name: 'Atalhos do CEAK App' });
  await expect(painel).toBeVisible();
  await expect(painel.getByText('Aplicativo instalável (PWA) · área do membro')).toBeVisible();
  const conteudo = page.locator('#conteudo');
  const caixa = await conteudo.boundingBox();
  expect(caixa!.width).toBeLessThanOrEqual(392);
  await painel.getByRole('link', { name: 'Minha jornada' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Minha jornada' })).toBeVisible();
  await expect(painel.getByRole('link', { name: 'Minha jornada' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  // Sem rolagem horizontal da página.
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(1280);
});
