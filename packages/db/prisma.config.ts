import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig, env } from 'prisma/config';

// Carrega o .env da raiz do monorepo (e um .env local, se existir).
config({ path: resolve(import.meta.dirname, '../../.env'), quiet: true });
config({ quiet: true });

const databaseUrl = env('DATABASE_URL');
const databaseSchema = process.env.CEAK_DB_SCHEMA?.trim();
const scopedDatabaseUrl = databaseSchema
  ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}options=${encodeURIComponent(`-c search_path=${databaseSchema},public`)}`
  : databaseUrl;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: scopedDatabaseUrl,
  },
});
