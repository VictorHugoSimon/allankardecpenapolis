import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { entrar, USUARIOS } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('login sem violações WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/login');
  const r = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(
    r.violations,
    JSON.stringify(
      r.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
      null,
      1,
    ),
  ).toEqual([]);
});

test('/ui e Visão Geral sem violações WCAG 2.1 AA', async ({ page }) => {
  await entrar(page, USUARIOS.ADMINISTRADOR);
  for (const rota of ['/', '/ui']) {
    await page.goto(rota);
    const r = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(
      r.violations,
      `${rota}: ${JSON.stringify(
        r.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
        null,
        1,
      )}`,
    ).toEqual([]);
  }
});

test('navegação por teclado no login', async ({ page }) => {
  await page.goto('/login');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('E-mail')).toBeFocused();
  await page.keyboard.type(USUARIOS.ADMINISTRADOR);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Senha')).toBeFocused();
  await page.keyboard.type(process.env.SEED_SENHA ?? 'ceak-dev-2026');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'CEAK Command Center' })).toBeVisible();
});
