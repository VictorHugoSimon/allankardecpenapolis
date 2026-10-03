import { expect, test } from '@playwright/test';
import { consultar, entrar, ultimoLink, USUARIOS } from './helpers';

const SITE = process.env.PLAYWRIGHT_SITE_URL ?? 'http://localhost:3000';

/** Critério de aceite: jornada 6 do PROMPT (administrativa). */
test('Jornada 6 · Login → Command Center → Conteúdo pendente → Revisar → Aprovar → Publicação (com auditoria)', async ({
  page,
}) => {
  const inicio = new Date();
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await expect(page.getByRole('heading', { level: 1, name: 'CEAK Command Center' })).toBeVisible();

  // Conteúdo pendente pelo alerta do Command Center.
  await page
    .getByRole('main')
    .getByRole('link', { name: /Conteúdos aguardando aprovação/ })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Central de aprovações' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Filtrar por tipo' })
      .getByRole('link', { name: /Conteúdo/ }),
  ).toHaveAttribute('aria-current', 'true');
  await page
    .getByRole('link', { name: /Revisar: Resumo da palestra “Família e Espiritualidade”/ })
    .click();

  // Revisar no editor (abas por canal) e aprovar.
  await expect(
    page.getByRole('heading', { level: 1, name: 'Resumo da palestra “Família e Espiritualidade”' }),
  ).toBeVisible();
  await expect(page.getByText('Aguardando aprovação de um responsável')).toBeVisible();
  await page.getByRole('tab', { name: 'Instagram' }).click();
  await expect(page.getByLabel('Texto para Instagram')).toHaveValue(/Laços que atravessam o tempo/);
  await page.getByRole('button', { name: 'Aprovar' }).click();
  await expect(page.getByText('Conteúdo aprovado · registrado na auditoria')).toBeVisible();
  await expect(page.getByText(/Aprovado por Antônio Ferreira/)).toBeVisible();

  // Publicação: Blog no site; Instagram fica na fila (token expirado).
  await page.getByRole('button', { name: 'Publicar agora nos 4 canais' }).click();
  await expect(
    page.getByText('Publicado em Blog, Facebook, Google · Instagram na fila', { exact: true }),
  ).toBeVisible();
  const blog = await page.getByRole('link', { name: 'Ver no blog' }).getAttribute('href');
  expect(blog).toMatch(/\/blog\/resumo-da-palestra-familia-e-espiritualidade$/);

  const id = page.url().split('/').pop()!;
  const aud = await consultar<{ acao: string; usuario: string }>(
    `SELECT a.acao, p.nome AS usuario FROM auditoria a JOIN usuario u ON u.id = a.usuario_id JOIN pessoa p ON p.id = u.pessoa_id
     WHERE a.entidade = 'Conteudo' AND a.entidade_id = $1 AND a.criado_em >= $2 ORDER BY a.criado_em`,
    [id, inicio],
  );
  expect(aud.map((a) => a.acao)).toEqual(['aprovou conteúdo', 'publicou conteúdo']);
  expect(aud.every((a) => a.usuario === 'Antônio Ferreira')).toBe(true);

  await page.goto(`${SITE}/blog/resumo-da-palestra-familia-e-espiritualidade`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Resumo da palestra “Família e Espiritualidade”' }),
  ).toBeVisible();
});

test('rejeitar devolve ao autor e nada é publicado sem aprovação', async ({ page }) => {
  await entrar(page, USUARIOS.SECRETARIA);
  await page.goto('/conteudo');
  await page.getByRole('link', { name: 'Revisar: Divulgação: O perdão como libertação' }).click();
  await expect(page.getByRole('button', { name: /Publicar agora/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Rejeitar' }).click();
  await expect(page.getByText('Conteúdo devolvido ao autor')).toBeVisible();
  await expect(page.getByText('Devolvido ao autor com comentários')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar para revisão' })).toBeVisible();
});

test('seletor de perfil só para quem tem duas ou mais funções e muda os menus', async ({
  page,
}) => {
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await expect(page.getByLabel('Perfil de acesso')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);

  await entrar(page, USUARIOS.SECRETARIA);
  const menu = page.getByRole('complementary', { name: 'Menu principal' });
  await expect(menu.getByRole('link', { name: 'Conteúdo' })).toBeVisible();
  await page.getByLabel('Perfil de acesso').selectOption('INSTRUTOR');
  await page.getByRole('button', { name: 'Trocar' }).click();
  await expect(page.getByLabel('Perfil de acesso')).toHaveValue('INSTRUTOR');
  await expect(menu.getByRole('link')).toHaveText([
    /^Visão Geral/,
    /^Pessoas/,
    /^Agenda/,
    /^Estudos/,
  ]);
  expect((await page.goto('/conteudo'))?.status()).toBe(403);

  // Como Instrutor, só os próprios alunos (turma "Sábado aberto").
  await page.goto('/pessoas');
  await expect(page.getByText('Seus alunos')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Victor Alves' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carla Nogueira' })).toHaveCount(0);
  await page.goto('/estudos');
  await expect(page.getByRole('cell', { name: 'Sábado aberto' })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Turma 2026/ })).toHaveCount(0);
});

test('financeiro: Tesouraria aprova e paga contas com auditoria', async ({ page }) => {
  await entrar(page, USUARIOS.TESOURARIA);
  await page.goto('/financeiro');
  await expect(page.getByText('Realizado em setembro')).toBeVisible();
  await expect(page.getByText('R$ 18.840').first()).toBeVisible();
  await page.getByRole('link', { name: 'Contas a pagar' }).click();
  await page
    .getByRole('button', { name: 'Aprovar: CPFL Paulista — Energia elétrica — set/26' })
    .click();
  await expect(page.getByText('Lançamento aprovado · registrado na auditoria')).toBeVisible();
  await page
    .getByRole('button', { name: 'Pagar: CPFL Paulista — Energia elétrica — set/26' })
    .click();
  await expect(page.getByText('Pagamento registrado · registrado na auditoria')).toBeVisible();
  const linha = page.getByRole('row', { name: /CPFL Paulista/ });
  await expect(linha.getByText('Pago')).toBeVisible();
  const aud = await consultar<{ antes: { status: string }; depois: { status: string } }>(
    `SELECT antes, depois FROM auditoria WHERE entidade = 'Lancamento' AND acao = 'alterou status do lançamento'
     AND entidade_id = (SELECT id::text FROM lancamento WHERE contraparte = 'CPFL Paulista' LIMIT 1) ORDER BY criado_em`,
  );
  expect(aud.map((a) => `${a.antes.status}→${a.depois.status}`)).toEqual([
    'PENDENTE→APROVADO',
    'APROVADO→PAGO',
  ]);

  // Novo lançamento nasce pendente e vai para a Central de aprovações.
  await page.getByRole('link', { name: 'Novo lançamento' }).click();
  await page.getByLabel('Fornecedor').fill('Papelaria Penápolis');
  await page.getByLabel('Descrição').fill('Material para o ESDE');
  await page.getByLabel('Categoria').selectOption({ label: 'Material' });
  await page.getByLabel('Valor (R$)').fill('86,40');
  await page.getByLabel('Vencimento').fill('2026-10-20');
  await page.getByRole('button', { name: 'Lançar' }).click();
  await expect(
    page.getByRole('row', { name: /Papelaria Penápolis/ }).getByText('Pendente'),
  ).toBeVisible();
  await page.goto('/aprovacoes?tipo=FINANCEIRO');
  await expect(
    page.getByText(/Pagamento Papelaria Penápolis — Material para o ESDE · R\$\s86,40/),
  ).toBeVisible();
});

test('agenda: Secretaria cria atividade; Instrutor só consulta', async ({ page }) => {
  const titulo = `Reunião de voluntários ${Date.now()}`;
  await entrar(page, USUARIOS.SECRETARIA);
  await page.goto('/agenda?mes=2026-10');
  await page.getByRole('link', { name: 'Nova atividade' }).click();
  await page.getByLabel('Título').fill(titulo);
  await page.getByLabel('Tipo').selectOption('EVENTO');
  await page.getByLabel('Data').fill('2026-10-24');
  await page.getByLabel('Horário').fill('16:00');
  await page.getByLabel('Local').fill('Sala 1');
  await page.getByRole('button', { name: 'Criar atividade' }).click();
  await expect(page.getByText('Atividade criada e registrada na auditoria.')).toBeVisible();
  await expect(
    page.getByRole('row', { name: new RegExp(titulo) }).getByText('Rascunho'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);

  await entrar(page, USUARIOS.INSTRUTOR);
  await page.goto('/agenda');
  await expect(page.getByRole('link', { name: 'Nova atividade' })).toHaveCount(0);
  await page.goto('/agenda/nova');
  await expect(page.getByRole('heading', { name: 'Acesso não permitido' })).toBeVisible();
});

test('eventos: detalhe e QR Code assinado para a entrada do salão', async ({ page }) => {
  await entrar(page, USUARIOS.SECRETARIA);
  await page.goto('/eventos');
  await page.getByRole('link', { name: /Palestra: A esperança que sustenta/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Palestra: A esperança que sustenta' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'QR Code do check-in' }).click();
  await expect(
    page.getByRole('img', { name: /QR Code do check-in de A esperança que sustenta/ }),
  ).toBeVisible();
  await expect(page.getByText(/\/checkin\?evento=[0-9a-f-]{36}&t=[\w-]{22}/)).toBeVisible();
});

test('convite: link por e-mail para definir a senha e entrar', async ({ page }) => {
  const email = `convite.${Date.now()}@allankardecpenapolis.com.br`;
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.goto('/config/usuarios');
  await page.getByRole('link', { name: 'Convidar usuário' }).click();
  await page.getByLabel('Nome completo').fill('Beatriz Lemos');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Perfil').selectOption('SECRETARIA');
  const t0 = Date.now();
  await page.getByRole('button', { name: 'Enviar convite' }).click();
  await expect(
    page.getByText('Convite enviado por e-mail · registrado na auditoria.'),
  ).toBeVisible();
  const link = await ultimoLink(email, t0);
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto(link);
  await page.getByLabel('Nova senha').fill('acolhimento2026');
  await page.getByLabel('Confirme a senha').fill('acolhimento2026');
  await page.getByRole('button', { name: 'Salvar senha' }).click();
  await expect(page.getByText('Senha definida. Você já pode entrar no CEAK Gestão.')).toBeVisible();
  // O link é de uso único.
  await page.goto(link);
  await page.getByLabel('Nova senha').fill('outrasenha2026');
  await page.getByLabel('Confirme a senha').fill('outrasenha2026');
  await page.getByRole('button', { name: 'Salvar senha' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Link inválido ou expirado',
  );

  await entrar(page, email, 'acolhimento2026');
  await expect(page.getByText('Secretaria', { exact: true })).toBeVisible();
});

test('busca do topo respeita os módulos do perfil', async ({ page }) => {
  await entrar(page, USUARIOS.ADMINISTRADOR);
  await page.getByLabel('Buscar').fill('Sabesp');
  await page.getByLabel('Buscar').press('Enter');
  await expect(page.getByRole('link', { name: /Sabesp — Água e esgoto/ })).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);

  await entrar(page, USUARIOS.SECRETARIA);
  await page.goto('/busca?q=Sabesp');
  await expect(page.getByText('Nada encontrado nos módulos do seu perfil.')).toBeVisible();
});
