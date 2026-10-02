import { expect, test } from '@playwright/test';
import {
  MENU,
  MODULO_HREF,
  MODULO_LABEL,
  MODULOS,
  modulosDoPerfil,
  type Perfil,
} from '../../packages/core/src/rbac';
import { entrar, USUARIOS } from './helpers';

/**
 * Critério de aceite: nenhuma rota do Gestão acessível sem o perfil correto.
 */
test.describe('sem sessão', () => {
  for (const m of MODULOS) {
    test(`${MODULO_HREF[m]} redireciona para o login`, async ({ request }) => {
      const r = await request.get(MODULO_HREF[m], { maxRedirects: 0 });
      expect(r.status()).toBe(307);
      expect(r.headers().location).toContain('/login');
    });
  }

  test('/ui e /api/health', async ({ request }) => {
    expect((await request.get('/ui', { maxRedirects: 0 })).status()).toBe(307);
    expect((await request.get('/api/health')).status()).toBe(200);
  });

  test('cookie de sessão forjado é rejeitado', async ({ context, request }) => {
    await context.addCookies([
      {
        name: 'ceak_sessao',
        value: 'eyJhbGciOiJub25lIn0.eyJwZXJmaWwiOiJBRE1JTklTVFJBRE9SIn0.',
        url: 'http://localhost:3002',
      },
    ]);
    const r = await request.get('/financeiro', { maxRedirects: 0 });
    expect(r.status()).toBe(307);
  });
});

const PERFIS_GESTAO: Perfil[] = [
  'ADMINISTRADOR',
  'DIRETORIA',
  'TESOURARIA',
  'SECRETARIA',
  'COORDENADOR',
  'INSTRUTOR',
  'VOLUNTARIO',
];

for (const perfil of PERFIS_GESTAO) {
  test(`${perfil}: menu e rotas seguem a matriz`, async ({ page }) => {
    await entrar(page, USUARIOS[perfil]);
    const permitidos = modulosDoPerfil(perfil);

    // Menu: exatamente os módulos permitidos, na ordem da sidebar.
    const esperado = MENU.flatMap((g) =>
      g.itens.filter((i) => permitidos.includes(i.id)).map((i) => i.label),
    );
    await expect(page.getByRole('navigation').getByRole('link')).toHaveText(esperado);

    // Rotas: as proibidas respondem 403 com a página de acesso negado.
    for (const m of MODULOS) {
      const href = MODULO_HREF[m];
      const resp = await page.goto(href);
      if (permitidos.includes(m)) {
        expect(resp?.status(), `${perfil} deveria abrir ${href}`).not.toBe(403);
      } else {
        expect(resp?.status(), `${perfil} não pode abrir ${href}`).toBe(403);
        await expect(page.getByRole('heading', { name: 'Acesso não permitido' })).toBeVisible();
        await expect(page.getByText(`O módulo ${MODULO_LABEL[m]}`)).toHaveCount(0); // rewrite usa ?rota=, não expõe nada
      }
    }
    // Sub-rotas herdam a regra do módulo.
    const sub = await page.goto('/financeiro/contas-a-pagar');
    expect(sub?.status()).toBe(permitidos.includes('financeiro') ? 404 : 403);
  });
}

for (const perfil of ['MEMBRO', 'VISITANTE'] as const) {
  test(`${perfil}: sem acesso ao Gestão, convite ao App`, async ({ page }) => {
    await entrar(page, USUARIOS[perfil]);
    await expect(page).toHaveURL(/\/sem-acesso/);
    await expect(
      page.getByRole('heading', { name: 'Perfil sem acesso ao CEAK Gestão' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir CEAK App' })).toBeVisible();
    const r = await page.goto('/');
    expect(page.url()).toContain('/sem-acesso');
    expect(r?.ok()).toBe(true);
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
}

test('login: senha incorreta mostra erro genérico', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(USUARIOS.TESOURARIA);
  await page.getByLabel('Senha').fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('E-mail ou senha incorretos.');
});

test('login: volta para a rota pedida e sai', async ({ page }) => {
  await page.goto('/ui');
  await expect(page).toHaveURL(/\/login\?next=%2Fui/);
  await page.getByLabel('E-mail').fill(USUARIOS.SECRETARIA);
  await page.getByLabel('Senha').fill(process.env.SEED_SENHA ?? 'ceak-dev-2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/ui$/);
  await expect(page.getByRole('heading', { name: 'Componentes CEAK' })).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);
  const r = await page.goto('/ui');
  expect(page.url()).toContain('/login');
  expect(r?.ok()).toBe(true);
});

test('login: não aceita redirecionamento externo', async ({ page }) => {
  await page.goto('/login?next=//evil.example.com');
  await page.getByLabel('E-mail').fill(USUARIOS.SECRETARIA);
  await page.getByLabel('Senha').fill(process.env.SEED_SENHA ?? 'ceak-dev-2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('http://localhost:3002/');
});
