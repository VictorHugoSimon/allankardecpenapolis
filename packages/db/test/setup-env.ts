import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dirname, '../../../.env'), quiet: true });

// Falha explicitamente se a suíte isolada usar o schema público por engano.
if (process.env.CEAK_DB_SCHEMA === 'ceak_v2') {
  const { prisma } = await import('../src/client');
  const [contexto] = await prisma.$queryRaw<Array<{ schema_atual: string }>>`SELECT current_schema() AS schema_atual`;
  console.info('[CEAK TEST]', { solicitado: process.env.CEAK_DB_SCHEMA, ativo: contexto?.schema_atual });
  if (contexto?.schema_atual !== 'ceak_v2') {
    throw new Error('Suíte de integração fora do schema isolado ceak_v2.');
  }
}
