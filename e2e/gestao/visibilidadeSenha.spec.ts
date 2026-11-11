import { expect, test } from '@playwright/test';

test('olho alterna a visibilidade da senha sem apagar o valor no painel', async ({ page }) => {
  await page.goto('/login');
  const senha = page.getByLabel('Senha', { exact: true });
  const mostrar = page.getByRole('button', { name: 'Mostrar senha' });

  await expect(senha).toHaveAttribute('type', 'password');
  await senha.fill('SenhaTemporaria123!');
  await expect(mostrar).toHaveAttribute('aria-pressed', 'false');

  await mostrar.click();
  await expect(senha).toHaveAttribute('type', 'text');
  await expect(senha).toHaveValue('SenhaTemporaria123!');
  await expect(page.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(senha).toHaveAttribute('type', 'password');
  await expect(senha).toHaveValue('SenhaTemporaria123!');
});
