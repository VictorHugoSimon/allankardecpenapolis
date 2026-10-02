import { expect, test } from '@playwright/test';
import { entrar, USUARIOS } from './helpers';

test('no celular a sidebar vira gaveta', async ({ page }) => {
  await entrar(page, USUARIOS.ADMINISTRADOR);
  const menu = page.getByRole('button', { name: 'Menu' });
  await expect(page.getByRole('complementary', { name: 'Menu principal' })).toBeHidden();
  await menu.click();
  await expect(page.getByRole('complementary', { name: 'Menu principal' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary', { name: 'Menu principal' })).toBeHidden();
  // Sem rolagem horizontal.
  const largura = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(largura).toBeLessThanOrEqual(0);
});
