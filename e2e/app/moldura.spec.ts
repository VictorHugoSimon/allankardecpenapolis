import { expect, test } from '@playwright/test';
import { entrarApp } from './helpers';

/** Desktop: mostra a experiência real do membro, sem vitrine de links demonstrativos. */
test('CEAK App abre sem painel demonstrativo no desktop', async ({ page }) => {
  await entrarApp(page);
  await expect(page.getByRole('complementary', { name: 'Atalhos do CEAK App' })).toHaveCount(0);
  await expect(page.getByText('Aplicativo instalável (PWA) · área do membro')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'CEAK Gestão' })).toHaveCount(0);
  const conteudo = page.locator('#conteudo');
  await expect(conteudo).toBeVisible();
  const caixa = await conteudo.boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa!.width).toBeLessThanOrEqual(480);
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(1280);
});
