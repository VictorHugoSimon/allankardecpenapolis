import { expect, test } from '@playwright/test';
import { entrar, USUARIOS } from './helpers';

const SITE = process.env.PLAYWRIGHT_SITE_URL ?? 'http://localhost:3000';

test('Instituição: administrador confirma contato e Site exibe somente dados salvos', async ({
  page,
}) => {
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.goto('/config');
  await expect(page.getByText(/informações oficiais preenchidas/)).toBeVisible();

  const email = page.getByRole('textbox', { name: 'E-mail oficial' });
  const horario = page.getByRole('textbox', { name: 'Horário de atendimento' });
  const anteriorEmail = await email.inputValue();
  const anteriorHorario = await horario.inputValue();
  try {
    await email.fill('contato-validado@example.org');
    await horario.fill('Atendimento mediante agendamento');
    await page.getByRole('button', { name: 'Salvar informações' }).click();
    await expect(page.getByRole('status').getByText(/Informações salvas/)).toBeVisible();
    await page.goto(`${SITE}/contato`);
    await expect(page.getByText('contato-validado@example.org')).toBeVisible();
    await expect(page.getByText('Atendimento mediante agendamento')).toBeVisible();
  } finally {
    // Não deixa informações de homologação persistidas no banco descartável da CI.
    await page.goto('/config');
    await page.getByRole('textbox', { name: 'E-mail oficial' }).fill(anteriorEmail);
    await page.getByRole('textbox', { name: 'Horário de atendimento' }).fill(anteriorHorario);
    await page.getByRole('button', { name: 'Salvar informações' }).click();
    await expect(page.getByRole('status').getByText(/Informações salvas/)).toBeVisible();
  }
});
