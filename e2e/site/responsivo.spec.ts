import { expect, test } from '@playwright/test';

for (const rota of [
  '/',
  '/agenda',
  '/loja',
  '/preciso-de-ajuda/tratamento-espiritual',
  '/doar',
  '/transparencia',
]) {
  test(`${rota} · sem rolagem horizontal no celular`, async ({ page }) => {
    await page.goto(rota);
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(excesso).toBeLessThanOrEqual(0);
  });
}

test('menu vira botão no celular', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Loja' }).click();
  await expect(page).toHaveURL(/\/loja$/);
  await expect(nav).toBeHidden();
});
