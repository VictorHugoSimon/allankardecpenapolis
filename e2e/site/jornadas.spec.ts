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

  // A palestra do seed é de outubro de 2026; não presumir mês atual.
  await page.goto('/agenda?mes=2026-10');
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
  if ((await opcoes.count()) === 0) {
    // Vagas do seed podem ter expirado. O sistema deve orientar o visitante
    // com transparência em vez de permitir um agendamento impossível.
    await expect(page.getByText(/não há horários com vagas/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeDisabled();
    return;
  }
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

test('Doação: não gera PIX fictício sem provedor real', async ({ page }) => {
  await page.goto('/doar');
  await expect(page.getByRole('heading', { name: 'Contribuir financeiramente' })).toBeVisible();
  await page.locator('label', { hasText: 'R$ 100' }).click();
  await page.getByRole('button', { name: 'Doar R$ 100,00 via PIX' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Pagamentos indisponíveis neste ambiente de demonstração',
  );
  await expect(page.getByRole('heading', { name: 'Pague com PIX' })).toHaveCount(0);
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
  // Em build de produção sem PSP real, o endpoint inteiro falha de modo
  // seguro; não processa nem mesmo uma assinatura de teste.
  expect(r.status()).toBe(503);
  expect(await r.json()).toMatchObject({ motivo: 'provedor_pix_nao_integrado' });
});

test('Loja: checkout não aceita pagamento fictício sem PIX integrado', async ({ page }) => {
  await page.goto('/loja/o-evangelho-segundo-o-espiritismo');
  await expect(
    page.getByRole('heading', { name: 'O Evangelho Segundo o Espiritismo' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await expect(page).toHaveURL(/\/carrinho$/);
  await page.getByRole('link', { name: 'Finalizar pedido' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Carla Nogueira');
  await page.getByLabel('WhatsApp', { exact: true }).fill(WHATS);
  await aceitar(page);
  await page.getByRole('button', { name: 'Pagar com PIX' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Pagamentos indisponíveis neste ambiente de demonstração',
  );
  await expect(page.getByRole('heading', { name: /Pedido nº/ })).toHaveCount(0);
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
