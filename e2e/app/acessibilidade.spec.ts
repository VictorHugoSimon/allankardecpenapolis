import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { entrarApp } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function semViolacoes(page: Page, rota: string) {
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

test('telas de acesso sem violações WCAG 2.1 AA', async ({ page }) => {
  for (const rota of ['/entrar', '/entrar/codigo', '/cadastro', '/offline']) {
    await page.goto(rota);
    await semViolacoes(page, rota);
  }
});

test('área do membro sem violações WCAG 2.1 AA', async ({ page }) => {
  await entrarApp(page);
  const rotas = [
    '/',
    '/checkin',
    '/jornada',
    '/estudos',
    '/estudos/inscrever',
    '/agenda',
    '/palestra',
    '/avaliacao',
    '/ia',
    '/biblioteca',
    '/notificacoes',
    '/perfil',
    '/perfil/dados',
    '/perfil/contribuicoes',
    '/lives',
    '/quero-ajudar',
    '/doar',
    '/preciso-de-ajuda',
    '/preciso-de-ajuda/atendimento-fraterno',
    '/loja',
  ];
  for (const rota of rotas) {
    await page.goto(rota);
    await semViolacoes(page, rota);
  }
  // Abas do curso
  await page.goto('/estudos');
  await page.getByRole('link', { name: /^ESDE/ }).click();
  for (const aba of ['Aulas', 'Materiais', 'Presença', 'Calendário']) {
    await page.getByRole('link', { name: aba }).click();
    await expect(page.getByRole('link', { name: aba })).toHaveAttribute('aria-current', 'page');
    await semViolacoes(page, `curso · ${aba}`);
  }
});

test('CEAK IA cita a fonte e encaminha questões pessoais', async ({ page }) => {
  await entrarApp(page);
  await page.goto('/ia');
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Qual é a próxima palestra?' }).click();
  const log = page.getByRole('log', { name: 'Conversa com o CEAK IA' });
  await expect(log.getByText(/Fonte consultada:\s*Agenda CEAK/)).toBeVisible();
  await page.getByLabel('Sua pergunta').fill('Estou passando por um luto e me sinto sozinho');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(log.getByRole('link', { name: 'Solicitar atendimento fraterno' })).toBeVisible();
  await semViolacoes(page, '/ia (conversa)');
});

test('navegação por teclado: barra inferior e voltar', async ({ page }) => {
  await entrarApp(page);
  const abas = page.getByRole('navigation', { name: 'Navegação principal' });
  await abas.getByRole('link', { name: 'Agenda' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible();
  await expect(abas.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: 'Voltar' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: /^Olá,/ })).toBeVisible();
});
