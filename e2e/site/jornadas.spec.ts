import { expect, test, type Page } from '@playwright/test';

/** Critérios de aceite: jornadas 1, 3, 4 e 5 do PROMPT (site público). */

const WHATS = '(18) 99712-4408';

async function aceitar(page: Page) {
  await page.getByRole('checkbox', { name: /Autorizo o CEAK/ }).check();
}

test('Jornada 1 · Visitante: Home → Agenda → Palestra → Inscrição → convite ao App', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Centro Espírita Allan Kardec — Penápolis' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ver programação' }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Filtrar por categoria' })
    .getByRole('link', { name: 'Palestras' })
    .click();
  await expect(page).toHaveURL(/filtro=Palestras/);
  await page
    .getByRole('link', { name: /Detalhes e inscrição: Palestra Pública: A esperança que sustenta/ })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Palestra Pública: A esperança que sustenta' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Fazer inscrição' }).click();
  await expect(page.getByRole('heading', { name: 'Inscrição na atividade' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar inscrição' }).click();
  await expect(page.getByText('Informe seu nome.')).toBeVisible();

  await page.getByLabel('Nome', { exact: true }).fill('Carla Nogueira');
  await page.getByLabel('WhatsApp', { exact: true }).fill(WHATS);
  await page.getByLabel('É minha primeira vez no CEAK').check();
  await aceitar(page);
  await page.getByRole('button', { name: 'Confirmar inscrição' }).click();
  await expect(page.getByRole('heading', { name: 'Inscrição confirmada' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Instale o CEAK App' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir o CEAK App' })).toHaveAttribute(
    'href',
    /localhost:3001|app\./,
  );
});

test('Jornada 3 · Ajuda: Home → Preciso de ajuda → Tratamento espiritual → Solicitar → Confirmar', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Preciso de ajuda' }).first().click();
  await expect(page.getByRole('heading', { name: 'Como podemos acolher você?' })).toBeVisible();
  await expect(
    page.getByText(
      'O atendimento espiritual não substitui acompanhamento médico ou psicológico quando necessário.',
    ),
  ).toBeVisible();
  await page.getByRole('link', { name: /Tratamento espiritual/ }).click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Tratamento espiritual' }),
  ).toBeVisible();
  await expect(page.getByText('O atendimento espiritual não substitui')).toBeVisible();
  await page.getByRole('button', { name: 'Ver orientações' }).click();
  await expect(page.getByRole('heading', { name: 'Algumas orientações' })).toBeFocused();
  await page.getByRole('button', { name: 'Solicitar atendimento' }).click();

  await page.getByRole('button', { name: 'Escolher data' }).click();
  await expect(page.getByText('Informe seu nome.')).toBeVisible();
  await page.getByLabel('Nome', { exact: true }).fill('Carla Nogueira');
  await page.getByLabel('WhatsApp', { exact: true }).fill(WHATS);
  await page
    .getByLabel(/conte brevemente/)
    .fill('Perdi minha mãe há dois meses e tenho tido dificuldade para dormir.');
  await aceitar(page);
  await page.getByRole('button', { name: 'Escolher data' }).click();

  await expect(page.getByRole('heading', { name: 'Escolha uma data' })).toBeVisible();
  const opcoes = page.getByRole('radio');
  expect(await opcoes.count()).toBeGreaterThan(0);
  await page.locator('label:has(input[type="radio"])').first().click();
  await page.getByRole('button', { name: 'Revisar' }).click();

  await expect(page.getByRole('heading', { name: 'Confirme sua solicitação' })).toBeVisible();
  await expect(page.getByText('Recepção do CEAK · chegue 15 min antes')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitação confirmada' })).toBeVisible();
  await expect(
    page.getByText(/Tratamento espiritual · .+ Você receberá um lembrete no WhatsApp na véspera\./),
  ).toBeVisible();
  await expect(page.getByText('O atendimento espiritual não substitui')).toBeVisible();
});

test('Jornada 4 · Doação: Home → Quero ajudar → Doação → PIX → Confirmação (webhook simulado)', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Quero ajudar' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Quero ajudar' })).toBeVisible();
  await expect(page.getByText('CAMPANHA ATIVA')).toBeVisible();
  await page.getByRole('link', { name: /Quero contribuir financeiramente/ }).click();

  await expect(page.getByRole('heading', { name: 'Contribuir financeiramente' })).toBeVisible();
  await page.locator('label', { hasText: 'R$ 100' }).click();
  await page.getByLabel('Destino').selectOption('Assistência social');
  await page.getByRole('button', { name: 'Doar R$ 100,00 via PIX' }).click();

  await expect(page.getByRole('heading', { name: 'Pague com PIX' })).toBeVisible();
  await expect(page.getByRole('img', { name: /QR Code PIX/ })).toBeVisible();
  const brCode = await page.getByLabel('PIX copia e cola').inputValue();
  expect(brCode).toMatch(/^000201.*br\.gov\.bcb\.pix.*5406100\.00.*6304[0-9A-F]{4}$/);

  await page.getByRole('button', { name: 'Já fiz o PIX' }).click();
  await expect(page.getByRole('heading', { name: 'Obrigado pela sua doação' })).toBeVisible();
  await expect(page.getByText('Recebemos R$ 100,00.')).toBeVisible();
});

test('Jornada 4 · webhook PIX rejeita assinatura inválida', async ({ request }) => {
  const r = await request.post('/api/pix/webhook', {
    data: JSON.stringify({
      cobrancaId: 'x',
      referencia: 'doacao:00000000-0000-0000-0000-000000000000',
      status: 'PAGO',
      valorCentavos: 100,
    }),
    headers: { 'content-type': 'application/json', 'x-ceak-assinatura': 'forjada' },
  });
  expect(r.status()).toBe(401);
});

test('Jornada 5 · Loja: Loja → Produto → Carrinho → Checkout → PIX → Pedido (estoque baixado)', async ({
  page,
}) => {
  await page.goto('/loja/o-evangelho-segundo-o-espiritismo');
  const linhaEstoque = page.locator('dt:has-text("Estoque") + dd');
  const antes = Number((await linhaEstoque.textContent())!.match(/\d+/)![0]);

  await page.goto('/loja');
  await page
    .getByRole('navigation', { name: 'Categorias' })
    .getByRole('link', { name: 'Livros' })
    .click();
  await expect(page).toHaveURL(/categoria=Livros/);
  await page.getByRole('link', { name: /O Evangelho Segundo o Espiritismo/ }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'O Evangelho Segundo o Espiritismo' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver foto 3' }).click();
  await expect(page.getByRole('img', { name: /foto 3 de 4/ })).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();

  await expect(page).toHaveURL(/\/carrinho$/);
  await expect(page.getByRole('link', { name: /Carrinho · 1/ })).toBeVisible();
  await page
    .getByRole('button', { name: 'Aumentar quantidade de O Evangelho Segundo o Espiritismo' })
    .click();
  await expect(page.getByText('R$ 56,00').first()).toBeVisible();
  await page.getByRole('link', { name: 'Finalizar pedido' }).click();

  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await page.getByLabel('Nome', { exact: true }).fill('Carla Nogueira');
  await page.getByLabel('WhatsApp', { exact: true }).fill(WHATS);
  await aceitar(page);
  await page.getByRole('button', { name: 'Pagar com PIX' }).click();

  await expect(page.getByRole('heading', { name: /Pedido nº \d+/ })).toBeVisible();
  await expect(page.getByText('R$ 56,00')).toBeVisible();
  await expect(page.getByRole('link', { name: /Carrinho · 0/ })).toBeVisible();
  await page.getByRole('button', { name: 'Já fiz o PIX' }).click();
  await expect(page.getByRole('heading', { name: /Pedido nº \d+ confirmado/ })).toBeVisible();
  await expect(page.getByText('Pagamento de R$ 56,00 recebido.')).toBeVisible();

  await page.goto('/loja/o-evangelho-segundo-o-espiritismo');
  await expect(linhaEstoque).toHaveText(`${antes - 2} em estoque`);
});

test('Loja: checkout recusa quantidade acima do estoque', async ({ page }) => {
  await page.goto('/loja/casaco-de-la-infantil-tam-6');
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await page.getByRole('button', { name: /Aumentar quantidade de Casaco/ }).click();
  await page.getByRole('link', { name: 'Finalizar pedido' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Carla Nogueira');
  await page.getByLabel('WhatsApp', { exact: true }).fill(WHATS);
  await aceitar(page);
  await page.getByRole('button', { name: 'Pagar com PIX' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Temos apenas 1 unidade');
});

test('Contato: envia mensagem', async ({ page }) => {
  await page.goto('/contato');
  await page.getByLabel('Nome', { exact: true }).fill('Carla Nogueira');
  await page.getByLabel('E-mail', { exact: true }).fill('carla.nogueira@email.com');
  await page
    .getByLabel('Mensagem', { exact: true })
    .fill('Gostaria de saber se há estacionamento próximo ao salão.');
  await aceitar(page);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(
    page.getByText('Mensagem recebida. A secretaria responderá em até 2 dias úteis.'),
  ).toBeVisible();
});

test('Quero ajudar: habilidades com chips', async ({ page }) => {
  await page.goto('/quero-ajudar');
  await page.getByRole('link', { name: /Tenho uma habilidade para oferecer/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Tenho uma habilidade para oferecer', level: 2 }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Informática' }).click();
  await expect(page.getByRole('button', { name: 'Informática' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Nome', { exact: true }).fill('Carla Nogueira');
  await page.getByLabel('WhatsApp', { exact: true }).fill(WHATS);
  await aceitar(page);
  await page.getByRole('button', { name: 'Enviar minhas habilidades' }).click();
  await expect(page.getByText('Recebemos o seu aviso.')).toBeVisible();
});
