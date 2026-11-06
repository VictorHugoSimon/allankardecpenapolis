import { expect, test } from '@playwright/test';
import { entrar, USUARIOS } from './helpers';

test('fase 4: loja permite cadastrar produto rascunho sem cobrar', async ({ page }) => {
  const nome = `Livro de teste ${Date.now()}`;
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.goto('/loja');
  await page.getByLabel('Nome do produto').fill(nome);
  await page.getByLabel('Categoria').fill('Livros');
  await page.getByLabel('Preço em reais (R$)').fill('35.50');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('status')).toContainText('Registro salvo');
  await expect(page.getByText(nome)).toBeVisible();
  await expect(page.getByText('RASCUNHO')).toBeVisible();
});

test('fase 4: estoque permite cadastro e entrada real', async ({ page }) => {
  const sku = `CEAK-TEST-${Date.now()}`;
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.goto('/estoque');
  await page.getByLabel('Código SKU').fill(sku);
  await page.getByLabel('Nome do item').fill('Arroz para campanha');
  await page.getByRole('button', { name: 'Salvar registro' }).first().click();
  await expect(page.getByText(sku)).toBeVisible();
  await page
    .getByLabel('Item', { exact: true })
    .selectOption({ label: `Arroz para campanha — ${sku}` });
  await page.getByLabel('Quantidade').fill('5');
  await page.getByLabel('Motivo do movimento').fill('Recebimento de alimentos');
  await page.getByRole('button', { name: 'Salvar registro' }).last().click();
  await expect(page.getByText('5')).toBeVisible();
});

test('fase 4: doação em itens fica pendente de conferência', async ({ page }) => {
  const doador = `Doador teste ${Date.now()}`;
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.goto('/doacoes');
  await page.getByLabel('Nome do doador (ou Anônimo)').fill(doador);
  await page.getByLabel('Itens recebidos (descrição e quantidade)').fill('2 kg de alimentos');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByText(doador)).toBeVisible();
  await expect(page.getByText('AGUARDANDO')).toBeVisible();
});

test('fase 5: automação é criada desativada', async ({ page }) => {
  const nome = `Regra teste ${Date.now()}`;
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.goto('/automacoes');
  await page.getByLabel('Nome da regra').fill(nome);
  await page.getByLabel('Quando executar (gatilho)').fill('Nova campanha cadastrada');
  await page.getByLabel('O que deve acontecer (ação)').fill('Notificar coordenador');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByText(nome)).toBeVisible();
  await expect(page.getByText('Não', { exact: true })).toBeVisible();
});
