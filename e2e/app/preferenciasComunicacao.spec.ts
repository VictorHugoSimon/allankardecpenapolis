import { expect, test } from '@playwright/test';
import pg from 'pg';
import { entrarApp, JOAO, VICTOR } from './helpers';

/**
 * E2E de opt-in no PWA, executado apenas contra PostgreSQL local efêmero do CI.
 * Usa pessoas do seed de teste e limpa as preferências criadas nesta jornada.
 */
test('membro autoriza e revoga e-mail sem autorizar WhatsApp ou outra pessoa', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_CEAK_E2E !== 'sim', 'Somente no ambiente isolado de testes.');
  const url = process.env.DATABASE_URL ?? '';
  test.skip(!/(localhost|127\.0\.0\.1)/.test(url), 'Não executar contra bancos remotos.');
  const db = new pg.Client({
    connectionString: url,
    options: '-c search_path=ceak_v2',
  });
  await db.connect();
  try {
    const { rows } = await db.query<{ id: string; email: string }>(
      `SELECT p.id, u.email FROM ceak_v2.pessoa p
        JOIN ceak_v2.usuario u ON u.pessoa_id=p.id
       WHERE u.email = ANY($1::text[])`,
      [[VICTOR, JOAO]],
    );
    const victor = rows.find((r) => r.email === VICTOR)?.id;
    const joao = rows.find((r) => r.email === JOAO)?.id;
    expect(victor).toBeTruthy();
    expect(joao).toBeTruthy();

    await entrarApp(page, VICTOR);
    await page.goto('/perfil');
    await page.getByRole('link', { name: 'Preferências de comunicação' }).click();
    await expect(page).toHaveURL(/\/perfil\/comunicacao$/);
    await expect(page.getByRole('heading', { name: 'Comunicações' })).toBeVisible();

    const email = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'E-mail', exact: true }),
    });
    const whatsapp = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'WhatsApp', exact: true }),
    });
    await expect(email.getByText('Não autorizado')).toBeVisible();
    await expect(whatsapp.getByText('Não autorizado')).toBeVisible();

    await email.getByRole('checkbox').check();
    await email.getByRole('button', { name: 'Autorizar este canal' }).click();
    await expect(email.getByText('Autorizado', { exact: true })).toBeVisible();
    await expect(whatsapp.getByText('Não autorizado')).toBeVisible();

    const autorizado = await db.query(
      `SELECT pessoa_id, canal, autorizado, consentido_em, revogado_em
         FROM ceak_v2.preferencia_comunicacao WHERE pessoa_id = $1`,
      [victor],
    );
    expect(autorizado.rows).toHaveLength(1);
    expect(autorizado.rows[0]).toMatchObject({
      pessoa_id: victor, canal: 'EMAIL', autorizado: true, revogado_em: null,
    });
    expect(autorizado.rows[0].consentido_em).toBeTruthy();

    await page.context().clearCookies();
    await entrarApp(page, JOAO);
    await page.goto('/perfil/comunicacao');
    await expect(page.getByText('Não autorizado')).toHaveCount(2);
    expect((await db.query(
      'SELECT id FROM ceak_v2.preferencia_comunicacao WHERE pessoa_id=$1',
      [joao],
    )).rows).toHaveLength(0);

    await page.context().clearCookies();
    await entrarApp(page, VICTOR);
    await page.goto('/perfil/comunicacao');
    const emailRevogar = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'E-mail', exact: true }),
    });
    await emailRevogar.getByRole('checkbox').check();
    await emailRevogar.getByRole('button', { name: 'Revogar autorização' }).click();
    await expect(emailRevogar.getByText('Não autorizado')).toBeVisible();

    const revogado = await db.query(
      `SELECT autorizado, revogado_em FROM ceak_v2.preferencia_comunicacao
       WHERE pessoa_id=$1 AND canal='EMAIL'`,
      [victor],
    );
    expect(revogado.rows).toHaveLength(1);
    expect(revogado.rows[0].autorizado).toBe(false);
    expect(revogado.rows[0].revogado_em).toBeTruthy();
  } finally {
    // Somente registros de teste. A validação do ambiente local já foi feita acima.
    await db.query(
      `DELETE FROM ceak_v2.preferencia_comunicacao
       WHERE origem='AUTODECLARACAO_APP' AND finalidade='AGRADECIMENTO_DOACAO'
         AND pessoa_id IN
         (SELECT p.id FROM ceak_v2.pessoa p JOIN ceak_v2.usuario u ON u.pessoa_id=p.id
           WHERE u.email=ANY($1::text[]))`,
      [[VICTOR, JOAO]],
    );
    await db.end();
  }
});
