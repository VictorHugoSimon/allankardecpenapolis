/* Teste de integração somente no PostgreSQL local descartável da CI. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');

const endereco = new URL(process.env.DATABASE_URL || 'postgresql://invalid');
if (
  process.env.CEAK_TEST_PUSH_FILA !== 'SIM' ||
  !['localhost', '127.0.0.1', '::1'].includes(endereco.hostname) ||
  process.env.CEAK_DB_SCHEMA !== 'ceak_v2' ||
  process.env.NODE_ENV === 'production'
) {
  throw new Error('Teste permitido apenas em PostgreSQL local isolado com confirmação.');
}
const comunicacaoId = randomUUID();
const tabela = 'ceak_v2.entrega_push';
const clientes = Array.from(
  { length: 2 },
  () => new Client({ connectionString: process.env.DATABASE_URL }),
);

async function reivindicar(db) {
  await db.query('BEGIN');
  try {
    const sql = [
      'UPDATE ' + tabela + ' AS fila',
      "SET status = 'PROCESSANDO', bloqueado_ate = now() + interval '5 minutes', tentativas = fila.tentativas + 1",
      'WHERE fila.id IN (',
      'SELECT id FROM ' + tabela,
      "WHERE comunicacao_id = $1 AND ((status = 'PENDENTE' AND proxima_em <= now())",
      "OR (status = 'PROCESSANDO' AND bloqueado_ate < now() AND tentativas < 5))",
      'ORDER BY proxima_em, criado_em, id LIMIT 50 FOR UPDATE SKIP LOCKED)',
      'RETURNING fila.id, fila.tentativas',
    ].join(' ');
    const resultado = await db.query(sql, [comunicacaoId]);
    return resultado.rows;
  } catch (erro) {
    await db.query('ROLLBACK');
    throw erro;
  }
}
async function main() {
  for (const db of clientes) await db.connect();
  const db = clientes[0];
  try {
    await db.query(
      'INSERT INTO ' + tabela + ' (comunicacao_id, dispositivo_id) SELECT $1::uuid, gen_random_uuid() FROM generate_series(1,1000)',
      [comunicacaoId],
    );
    // Manter as duas transações abertas simultaneamente exercita SKIP LOCKED.
    const [a, b] = await Promise.all(clientes.map(reivindicar));
    assert.equal(a.length, 50);
    assert.equal(b.length, 50);
    const ids = new Set([...a, ...b].map((x) => x.id));
    assert.equal(ids.size, 100);
    for (const conn of clientes) await conn.query('COMMIT');
    for (let i = 0; i < 18; i++) {
      const lote = await reivindicar(db);
      assert.equal(lote.length, 50);
      for (const item of lote) {
        assert.ok(!ids.has(item.id), 'Claim duplicado.');
        ids.add(item.id);
      }
      await db.query('COMMIT');
    }
    assert.equal(ids.size, 1000);
    assert.equal((await reivindicar(db)).length, 0);
    await db.query('COMMIT');
    const id = a[0].id;
    await db.query(
      "UPDATE " + tabela + " SET bloqueado_ate = now() - interval '1 minute' WHERE id = $1",
      [id],
    );
    const recuperado = await reivindicar(db);
    assert.equal(recuperado.length, 1);
    assert.equal(recuperado[0].id, id);
    assert.equal(recuperado[0].tentativas, 2);
    await db.query('COMMIT');
    const antigo = await db.query(
      "UPDATE " + tabela + " SET status = 'ENVIADO' WHERE id = $1 AND status = 'PROCESSANDO' AND tentativas = 1",
      [id],
    );
    assert.equal(antigo.rowCount, 0);
    await db.query(
      "UPDATE " + tabela + " SET tentativas = 5, bloqueado_ate = now() - interval '1 minute' WHERE id = $1",
      [id],
    );
    await db.query(
      "UPDATE " + tabela + " SET status = 'FALHA', bloqueado_ate = NULL WHERE comunicacao_id = $1 AND status = 'PROCESSANDO' AND bloqueado_ate < now() AND tentativas >= 5",
      [comunicacaoId],
    );
    const estado = await db.query('SELECT status, tentativas FROM ' + tabela + ' WHERE id = $1', [
      id,
    ]);
    assert.deepEqual(estado.rows[0], { status: 'FALHA', tentativas: 5 });
    const contagem = await db.query(
      'SELECT count(*)::int AS total FROM ' + tabela + ' WHERE comunicacao_id = $1',
      [comunicacaoId],
    );
    assert.equal(contagem.rows[0].total, 1000);
    process.stdout.write(
      'PostgreSQL: 1.000 claims unicos, dois workers, recuperacao e tentativa antiga OK.\n',
    );
  } finally {
    await db
      .query('DELETE FROM ' + tabela + ' WHERE comunicacao_id = $1', [comunicacaoId])
      .catch(() => undefined);
    await Promise.all(clientes.map((conn) => conn.end().catch(() => undefined)));
  }
}
main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
