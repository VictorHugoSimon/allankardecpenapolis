'use strict';
/**
 * Teste integrado de RLS no PostgreSQL isolado do CI.
 * Cria duas pessoas apenas dentro de uma transação com ROLLBACK obrigatório.
 * Nunca usar este script contra um banco persistente ou de produção.
 */
const { Client } = require('pg');
const { randomUUID } = require('node:crypto');

async function main() {
  if (process.env.NEXT_PUBLIC_CEAK_E2E !== 'sim' ||
      !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '')) {
    throw new Error('Teste RLS permitido somente no PostgreSQL local isolado de CI.');
  }
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const pessoaA = randomUUID();
  const pessoaB = randomUUID();
  await db.query('BEGIN');
  try {
    await db.query(
      'INSERT INTO ceak_v2.pessoa (id, nome, atualizado_em) VALUES ($1, $2, now()), ($3, $4, now())',
      [pessoaA, 'Pessoa CI A', pessoaB, 'Pessoa CI B'],
    );
    await db.query(`
      INSERT INTO ceak_v2.preferencia_comunicacao
        (pessoa_id, canal, finalidade, autorizado, versao, origem, consentido_em)
      VALUES ($1, 'EMAIL', 'AGRADECIMENTO_DOACAO', true, 'teste-v1', 'CI', now()),
             ($2, 'EMAIL', 'AGRADECIMENTO_DOACAO', true, 'teste-v1', 'CI', now())
    `, [pessoaA, pessoaB]);

    await db.query("SELECT set_config('app.pessoa_id', $1, true)", [pessoaA]);
    await db.query("SELECT set_config('app.perfil', 'MEMBRO', true)");
    await db.query('SET LOCAL ROLE ceak_app');

    const visiveis = await db.query(
      'SELECT pessoa_id, autorizado FROM ceak_v2.preferencia_comunicacao ORDER BY pessoa_id'
    );
    if (visiveis.rowCount !== 1 || visiveis.rows[0].pessoa_id !== pessoaA) {
      throw new Error('RLS SELECT expôs dados de outra pessoa.');
    }

    const tentativaAtualizacao = await db.query(
      'UPDATE ceak_v2.preferencia_comunicacao SET autorizado=false, revogado_em=now() WHERE pessoa_id=$1',
      [pessoaB],
    );
    if (tentativaAtualizacao.rowCount !== 0) {
      throw new Error('RLS UPDATE permitiu alterar autorização de outra pessoa.');
    }

    await db.query('SAVEPOINT tentativa_cruzada');
    let bloqueouInclusao = false;
    try {
      await db.query(`
        INSERT INTO ceak_v2.preferencia_comunicacao
          (pessoa_id, canal, finalidade, autorizado, versao, origem, consentido_em)
        VALUES ($1, 'WHATSAPP', 'AGRADECIMENTO_DOACAO', true, 'teste-v1', 'CI', now())
      `, [pessoaB]);
    } catch (err) {
      bloqueouInclusao = err.code === '42501';
      await db.query('ROLLBACK TO SAVEPOINT tentativa_cruzada');
    }
    if (!bloqueouInclusao) throw new Error('RLS INSERT não rejeitou consentimento de outra pessoa.');

    const revogacao = await db.query(`
      UPDATE ceak_v2.preferencia_comunicacao
         SET autorizado=false, revogado_em=now(), consentido_em=null
       WHERE pessoa_id=$1 AND canal='EMAIL'
    `, [pessoaA]);
    if (revogacao.rowCount !== 1) throw new Error('Titular não conseguiu revogar a própria autorização.');

    console.log('RLS validado: titular acessa e revoga sua escolha; leitura, alteração e inclusão cruzadas bloqueadas.');
  } finally {
    await db.query('ROLLBACK');
    await db.end();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
