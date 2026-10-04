import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { codigoTotp, consultar, entrar, SEED_TOTP_SEGREDO, SENHA, USUARIOS } from './helpers';

test.describe.configure({ mode: 'serial' });

async function senha(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

async function semViolacoes(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(r.violations.map((v) => [v.id, v.nodes.map((n) => n.target)])).toEqual([]);
}

/** Código ainda não usado: o mesmo passo de 30 s não vale duas vezes. */
async function codigoNovo(email: string, segredo: string) {
  for (;;) {
    const [r] = await consultar<{ passo: number | null }>(
      `select c.totp_ultimo_passo as passo from credencial c join usuario u on u.id = c.usuario_id where u.email = $1`,
      [email],
    );
    const agora = Math.floor(Date.now() / 30_000);
    const passo = Math.max(agora, (r?.passo ?? 0) + 1);
    if (passo <= agora + 1) return codigoTotp(segredo, passo);
    await new Promise((ok) => setTimeout(ok, 2_000));
  }
}

test('Tesouraria confirma o código do autenticador depois da senha', async ({ page }) => {
  await senha(page, USUARIOS.TESOURARIA);
  await expect(page).toHaveURL(/\/login\/verificar/);
  await expect(page.getByRole('heading', { name: 'Confirmar acesso' })).toBeVisible();
  await semViolacoes(page);

  await page.getByLabel('Código do autenticador').fill('000000');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Código incorreto ou já usado')).toBeVisible();

  await page
    .getByLabel('Código do autenticador')
    .fill(await codigoNovo(USUARIOS.TESOURARIA, SEED_TOTP_SEGREDO));
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
});

test('administrador redefine o autenticador; a pessoa configura de novo e usa um código de recuperação', async ({
  page,
}) => {
  const alvo = USUARIOS.DIRETORIA;
  const [u] = await consultar<{ id: string }>(`select id from usuario where email = $1`, [alvo]);

  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.goto(`/config/usuarios/${u!.id}`);
  await page.getByRole('button', { name: 'Redefinir autenticador' }).click();
  await expect(page.getByRole('status')).toContainText('Autenticador redefinido');

  // Próximo login: configurar o aplicativo.
  await senha(page, alvo);
  await expect(page).toHaveURL(/\/login\/configurar/);
  await expect(page.getByRole('img', { name: /QR Code/i })).toBeVisible();
  await semViolacoes(page);
  const chave = (await page.locator('[data-chave-totp]').innerText()).replace(/\s/g, '');
  await page.getByLabel('Código de 6 dígitos mostrado no aplicativo').fill(codigoTotp(chave));
  await page.getByRole('button', { name: 'Ativar autenticador' }).click();
  const codigos = page.getByRole('list', { name: 'Códigos de recuperação' }).getByRole('listitem');
  await expect(codigos).toHaveCount(8);
  await semViolacoes(page);
  const recuperacao = (await codigos.first().innerText()).trim();
  await page.getByRole('button', { name: /Guardei os códigos/ }).click();
  await expect(page).not.toHaveURL(/\/login/);

  // Sem o celular: entra com um código de recuperação, que só vale uma vez.
  await senha(page, alvo);
  await expect(page).toHaveURL(/\/login\/verificar/);
  await page.getByLabel('Código do autenticador').fill(recuperacao);
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await senha(page, alvo);
  await page.getByLabel('Código do autenticador').fill(recuperacao);
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Código incorreto ou já usado')).toBeVisible();

  const [a] = await consultar<{ n: number }>(
    `select count(*)::int as n from auditoria where entidade_id = $1 and acao like '%autenticador%'`,
    [u!.id],
  );
  expect(a!.n).toBeGreaterThanOrEqual(2);
});
