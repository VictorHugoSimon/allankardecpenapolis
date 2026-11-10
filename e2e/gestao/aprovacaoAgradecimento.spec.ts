import { expect, test } from '@playwright/test';
import pg from 'pg';
import { entrar, USUARIOS } from './helpers';

test('aprovação interna por canal: bloqueia sem opt-in e audita decisão sem envio', async ({
  page,
}) => {
  test.skip(process.env.NEXT_PUBLIC_CEAK_E2E !== 'sim', 'Somente banco isolado de testes.');
  const url = process.env.DATABASE_URL ?? '';
  test.skip(!/(localhost|127\.0\.0\.1)/.test(url), 'Não executar contra banco remoto.');
  const db = new pg.Client({ connectionString: url, options: '-c search_path=ceak_v2' });
  await db.connect();
  let pessoaId = '';
  let doacaoId = '';
  try {
    const r = await db.query<{ pessoa_id: string; id: string }>(
      `SELECT d.id, d.pessoa_id FROM ceak_v2.doacao d
        JOIN ceak_v2.usuario u ON u.pessoa_id = d.pessoa_id
       WHERE u.email=$1 AND d.status_pagamento='PAGO'
         AND d.recibo_emitido_em IS NOT NULL
       ORDER BY d.criado_em DESC LIMIT 1`,
      ['victor.alves@email.com'],
    );
    expect(r.rows).toHaveLength(1);
    pessoaId = r.rows[0]!.pessoa_id;
    doacaoId = r.rows[0]!.id;
    expect(
      (
        await db.query(
          'SELECT id FROM ceak_v2.preferencia_comunicacao WHERE pessoa_id=$1 AND canal=$2',
          [pessoaId, 'EMAIL'],
        )
      ).rows,
    ).toHaveLength(0);

    await entrar(page, USUARIOS.ADMINISTRADOR);
    await page.goto(`/doacoes/recibos/${doacaoId}`);
    await expect(
      page.getByRole('heading', { name: 'Aprovações internas de agradecimento' }),
    ).toBeVisible();
    const email = page.getByRole('heading', { name: 'E-mail', exact: true }).locator('..');
    await email.getByRole('checkbox').check();
    await email.getByRole('button', { name: 'Criar solicitação' }).click();
    await expect(email.getByText('RASCUNHO')).toBeVisible();

    await email.getByRole('checkbox', { name: /Analisar consentimento e elegibilidade/ }).check();
    await email.getByRole('button', { name: 'Analisar aprovação interna' }).click();
    await expect(email.getByText('ANALISE_BLOQUEADA')).toBeVisible();
    await expect(email.getByText('RASCUNHO')).toBeVisible();

    await db.query(
      `INSERT INTO ceak_v2.preferencia_comunicacao
        (pessoa_id,canal,finalidade,autorizado,versao,origem,consentido_em)
       VALUES($1,'EMAIL','AGRADECIMENTO_DOACAO',true,'agradecimento-doacao-v1','CI_E2E',now())`,
      [pessoaId],
    );
    await email.getByRole('checkbox', { name: /Analisar consentimento e elegibilidade/ }).check();
    await email.getByRole('button', { name: 'Analisar aprovação interna' }).click();
    await expect(email.getByText('APROVADO', { exact: true })).toBeVisible();
    await expect(email.getByText('APROVACAO_INTERNA')).toBeVisible();

    const estado = await db.query(
      `SELECT a.canal,a.status,a.aprovado_em,
             (SELECT count(*)::int FROM ceak_v2.tentativa_agradecimento t
              WHERE t.aprovacao_id=a.id) AS analises
         FROM ceak_v2.aprovacao_agradecimento a WHERE a.doacao_id=$1`,
      [doacaoId],
    );
    expect(estado.rows).toHaveLength(1);
    expect(estado.rows[0]).toMatchObject({ canal: 'EMAIL', status: 'APROVADO', analises: 2 });
    expect(estado.rows[0].aprovado_em).toBeTruthy();
    await expect(
      page.getByRole('heading', { name: 'Canais externos — não habilitados' }),
    ).toBeVisible();

    await page.context().clearCookies();
    await entrar(page, USUARIOS.TESOURARIA);
    await page.goto(`/doacoes/recibos/${doacaoId}`);
    await expect(page.getByText('APROVADO', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analisar aprovação interna' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancelar aprovação interna' })).toHaveCount(0);

    await page.context().clearCookies();
    await entrar(page, USUARIOS.ADMINISTRADOR);
    await page.goto(`/doacoes/recibos/${doacaoId}`);
    const emailCancelamento = page
      .getByRole('heading', { name: 'E-mail', exact: true })
      .locator('..');
    await emailCancelamento
      .getByLabel('Motivo do cancelamento')
      .fill('Revogação administrativa para teste isolado.');
    await emailCancelamento.getByRole('checkbox', { name: /Confirmo o cancelamento/ }).check();
    await emailCancelamento.getByRole('button', { name: 'Cancelar aprovação interna' }).click();
    await expect(emailCancelamento.getByText('CANCELADO', { exact: true })).toBeVisible();
    await expect(emailCancelamento.getByText('CANCELAMENTO_INTERNO')).toBeVisible();

    const cancelado = await db.query(
      `SELECT a.status, a.aprovado_em, a.aprovado_por_id,
              (SELECT count(*)::int FROM ceak_v2.tentativa_agradecimento t
               WHERE t.aprovacao_id=a.id AND t.resultado='CANCELAMENTO_INTERNO') AS cancelamentos
         FROM ceak_v2.aprovacao_agradecimento a WHERE a.doacao_id=$1 AND a.canal='EMAIL'`,
      [doacaoId],
    );
    expect(cancelado.rows[0]).toMatchObject({
      status: 'CANCELADO',
      aprovado_em: null,
      aprovado_por_id: null,
      cancelamentos: 1,
    });
  } finally {
    if (doacaoId) {
      await db.query('DELETE FROM ceak_v2.aprovacao_agradecimento WHERE doacao_id=$1', [doacaoId]);
    }
    if (pessoaId) {
      await db.query(
        `DELETE FROM ceak_v2.preferencia_comunicacao
         WHERE pessoa_id=$1 AND origem='CI_E2E' AND canal='EMAIL'`,
        [pessoaId],
      );
    }
    await db.end();
  }
});
