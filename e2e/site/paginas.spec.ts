import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGINAS = [
  '/',
  '/o-ceak',
  '/agenda',
  '/palestras',
  '/palestras/o-perdao-como-libertacao-2026-10-02',
  '/lives',
  '/estudos',
  '/biblioteca',
  '/blog',
  '/blog/campanha-do-agasalho-chega-a-75-da-meta',
  '/preciso-de-ajuda',
  '/preciso-de-ajuda/tratamento-espiritual',
  '/quero-ajudar?opcao=habilidade',
  '/campanhas/campanha-do-agasalho',
  '/doar',
  '/loja',
  '/loja/manta-de-croche',
  '/carrinho',
  '/transparencia',
  '/contato',
  '/privacidade',
  '/inscricao?evento=o-perdao-como-libertacao-2026-10-02',
];

for (const rota of PAGINAS) {
  test(`${rota} · sem violações WCAG 2.1 AA e com SEO básico`, async ({ page }) => {
    const r = await page.goto(rota);
    expect(r?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.title()).toMatch(/CEAK|Centro Espírita/);
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      axe.violations,
      JSON.stringify(
        axe.violations.map((v) => [v.id, v.nodes.slice(0, 3).map((n) => n.target)]),
        null,
        1,
      ),
    ).toEqual([]);
  });
}

test('SEO: sitemap, robots, JSON-LD de Organization e Event', async ({ page, request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('/agenda');
  expect(xml).toContain('/palestras/');
  expect(xml).toContain('/blog/');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap:');

  await page.goto('/palestras/o-perdao-como-libertacao-2026-10-02');
  const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
  const tipos = lds.map((t) => JSON.parse(t)['@type']).flat();
  expect(tipos).toContain('Organization');
  expect(tipos).toContain('Event');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /O perdão como libertação/,
  );
});

test('Agenda: filtro e calendário', async ({ page }) => {
  await page.goto('/agenda?filtro=Assist%C3%AAncia');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Atendimento fraterno e passe' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /Palestra Pública/ })).toHaveCount(0);
  const ics = await page.request.get(
    '/agenda/atendimento-fraterno-e-passe-2026-10-06/calendario.ics',
  );
  expect(ics.headers()['content-type']).toContain('text/calendar');
  expect(await ics.text()).toContain('SUMMARY:Atendimento fraterno e passe');
});

test('Biblioteca: busca e filtros', async ({ page }) => {
  await page.goto('/biblioteca');
  await page.getByLabel('Buscar no acervo').fill('Kardec');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 2, name: 'O Livro dos Médiuns' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Nosso Lar' })).toHaveCount(0);
  await page.goto('/biblioteca?q=xyzinexistente');
  await expect(page.getByText('Nenhum item encontrado para esta busca.')).toBeVisible();
});

test('Conteúdo só aparece depois de aprovado', async ({ page }) => {
  // "Divulgação: O perdão como libertação" está em RASCUNHO_IA no Gestão: não pode estar no blog.
  await page.goto('/blog');
  await expect(page.getByText('Divulgação: O perdão como libertação')).toHaveCount(0);
  expect((await page.goto('/agenda/encontro-de-trabalhadores-2026-10-25'))?.status()).toBe(404);
});
