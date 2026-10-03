import { expect, test } from '@playwright/test';
import {
  criarPalestraAgora,
  entrarApp,
  JOAO,
  removerEvento,
  tokenCheckin,
  ultimoCodigo,
  VICTOR,
} from './helpers';

/** Critério de aceite: jornada 2 do PROMPT (CEAK App). */

let palestra: { id: string; slug: string };

test.beforeAll(async () => {
  palestra = await criarPalestraAgora('O caminho da serenidade');
});
test.afterAll(async () => {
  await removerEvento(palestra.id);
});

test('área do membro exige login e volta para a tela pedida', async ({ page }) => {
  await page.goto('/jornada');
  await expect(page).toHaveURL(/\/entrar\?next=%2Fjornada/);
  await expect(page.getByRole('heading', { name: /Bem-vindo ao\s*CEAK App/ })).toBeVisible();
  await page.getByLabel('E-mail').fill(VICTOR);
  await page.getByLabel('Senha').fill('senha-errada-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('E-mail ou senha incorretos.');
  await page.getByLabel('Senha').fill(process.env.SEED_SENHA ?? 'ceak-dev-2026');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/jornada$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Minha jornada' })).toBeVisible();
  await expect(
    page.getByText(
      'Sua jornada é pessoal e visível apenas para você. O CEAK não mantém rankings entre participantes.',
    ),
  ).toBeVisible();
});

test('Jornada 2 · Membro: Login → Home → Check-in → Estudo → Palestra → Avaliação', async ({
  page,
}) => {
  await entrarApp(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Olá, Victor' })).toBeVisible();
  const hoje = page.getByRole('region', { name: 'Palestra Pública' });
  await expect(hoje.getByText('Hoje no CEAK')).toBeVisible();
  await expect(hoje).toContainText('Salão principal');

  // Check-in (confirmação manual da atividade de hoje)
  await hoje.getByRole('link', { name: 'Fazer check-in' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Check-in' })).toBeVisible();
  await expect(
    page.getByText(/Palestra Pública · hoje, \d\d:\d\d · Salão principal/),
  ).toBeVisible();
  await page.getByRole('button', { name: /Confirmar presença/ }).click();
  await expect(page.getByRole('heading', { name: 'Check-in realizado' })).toBeVisible();
  await expect(page.getByText('Centro Espírita Allan Kardec')).toBeVisible();
  await expect(page.getByText(/^\d\d\/\d\d\/\d{4} · \d\d:\d\d$/)).toBeVisible();
  await expect(page.getByText(/ª visita em \w+ registrada na sua jornada/)).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao início' }).click();

  // Estudo
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Estudos' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Meus estudos' })).toBeVisible();
  await page.getByRole('link', { name: /^ESDE/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Estudo Sistematizado da Doutrina Espírita' }),
  ).toBeVisible();
  await expect(page.getByText('A justiça da reencarnação')).toBeVisible();
  await page.getByRole('link', { name: 'Presença' }).click();
  await expect(page.getByText(/Frequência mínima: 75% · Sua frequência: \d+%/)).toBeVisible();
  await page.getByRole('link', { name: 'Materiais' }).click();
  await expect(page.getByText('Apostila — Módulo 3')).toBeVisible();
  await page.getByRole('link', { name: 'Calendário' }).click();
  await expect(page.getByText(/Aula \d+ · /).first()).toBeVisible();

  // Palestra de hoje
  await page.goto('/palestra');
  await expect(page).toHaveURL(new RegExp(`/agenda/${palestra.slug}$`));
  await expect(page.getByRole('heading', { name: 'O caminho da serenidade' })).toBeVisible();
  await expect(page.getByText(/Palestra pública · Hoje/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fazer check-in' })).toBeVisible();

  // Avaliação da palestra anterior
  const anterior = page.getByRole('region', { name: 'Palestra anterior' });
  await anterior.getByRole('link', { name: /Avaliar a palestra/ }).click();
  await expect(page.getByRole('heading', { name: 'Como foi sua experiência?' })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar avaliação' }).click();
  await expect(page.getByText('Escolha uma nota de 0 a 10.')).toBeVisible();
  await page
    .getByRole('group', { name: /De 0 a 10/ })
    .getByRole('radio', { name: '9', exact: true })
    .check({ force: true });
  await page
    .getByRole('group', { name: 'Conteúdo' })
    .getByRole('radio', { name: '5 estrelas' })
    .check({ force: true });
  await page
    .getByRole('group', { name: 'Clareza' })
    .getByRole('radio', { name: '4 estrelas' })
    .check({ force: true });
  await page
    .getByLabel('O que mais chamou sua atenção?')
    .fill('A explicação sobre o perdão no dia a dia.');
  await page.getByRole('button', { name: 'Enviar avaliação' }).click();
  await expect(page.getByRole('heading', { name: 'Avaliação recebida' })).toBeVisible();
  await expect(
    page.getByText(
      'Agradecemos sua participação. As respostas são lidas pela diretoria doutrinária e orientam a programação.',
    ),
  ).toBeVisible();
});

test('check-in pelo QR Code (link aberto pela câmera do celular)', async ({ page }) => {
  await entrarApp(page, JOAO);
  await page.goto(`/checkin?evento=${palestra.id}&t=token-falso-123`);
  await page.getByRole('button', { name: 'Confirmar check-in' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Este QR Code não é válido',
  );

  await page.goto(`/checkin?evento=${palestra.id}&t=${tokenCheckin(palestra.id)}`);
  await page.getByRole('button', { name: 'Confirmar check-in' }).click();
  await expect(page.getByRole('heading', { name: 'Check-in realizado' })).toBeVisible();

  // Segunda leitura não duplica a presença.
  await page.goto(`/checkin?evento=${palestra.id}&t=${tokenCheckin(palestra.id)}`);
  await page.getByRole('button', { name: 'Confirmar check-in' }).click();
  await expect(page.getByRole('heading', { name: 'Check-in já registrado' })).toBeVisible();
});

test('login com código pelo WhatsApp (sem revelar se o número existe)', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByRole('link', { name: 'Entrar com código pelo WhatsApp' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar com código' })).toBeVisible();

  // Número sem conta: mesma resposta, nenhum código enviado.
  await page.getByLabel('WhatsApp com DDD').fill('(11) 90000-0000');
  await page.getByRole('button', { name: 'Enviar código' }).click();
  await expect(
    page.getByText(/Se o número estiver cadastrado, você vai receber um código/),
  ).toBeVisible();

  await page.goto('/entrar/codigo');
  const t0 = Date.now();
  await page.getByLabel('WhatsApp com DDD').fill('(18) 99654-1120');
  await page.getByRole('button', { name: 'Enviar código' }).click();
  await expect(
    page.getByText(/Se o número estiver cadastrado, você vai receber um código/),
  ).toBeVisible();
  await page.getByLabel('Código de 6 dígitos').fill('000000');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText(/Código inválido ou expirado/)).toBeVisible();
  const codigo = await ultimoCodigo('+5518996541120', t0);
  await page.getByLabel('Código de 6 dígitos').fill(codigo);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Olá, Victor' })).toBeVisible();
});

test('criar conta pelo App entra como Visitante', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByRole('link', { name: 'Criar conta' }).click();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByText('Informe seu nome completo.')).toBeVisible();
  await expect(page.getByText('É necessário aceitar o termo de consentimento.')).toBeVisible();

  await page.getByLabel('Nome completo').fill('Beatriz Lemos');
  await page.getByLabel('E-mail').fill(`beatriz.e2e.${Date.now()}@email.com`);
  await page.getByLabel('Senha').fill('serenidade2026');
  await page.getByRole('checkbox', { name: /Autorizo o CEAK/ }).check();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Olá, Beatriz' })).toBeVisible();
  await page.goto('/perfil');
  await expect(page.getByText('Visitante')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/entrar$/);
});
