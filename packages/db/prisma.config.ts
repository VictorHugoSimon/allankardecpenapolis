import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig, env } from 'prisma/config';

// Carrega o .env da raiz do monorepo (e um .env local, se existir).
config({ path: resolve(import.meta.dirname, '../../.env'), quiet: true });
config({ quiet: true });

const databaseUrl = env('DATABASE_URL');
const databaseSchema = process.env.CEAK_DB_SCHEMA?.trim();

function migrationDatabaseUrl(url: string, schema?: string) {
  if (!schema) return url;

  const parsed = new URL(url);
  // Prisma Migrate deve usar a conexão direta do Neon, não o pooler transacional.
  parsed.hostname = parsed.hostname.replace('-pooler.', '.');
  parsed.searchParams.set('schema', schema);
  return parsed.toString();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: migrationDatabaseUrl(databaseUrl, databaseSchema),
  },
});
