import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as { __ceakPrisma?: PrismaClient };

function runtimeDatabaseUrl(url?: string, schema?: string) {
  if (!url || !schema) return url;

  const parsed = new URL(url);
  // O CEAK v2 usa a conexão direta do Neon; os previews legados permanecem intactos.
  parsed.hostname = parsed.hostname.replace('-pooler.', '.');
  return parsed.toString();
}

function criarClient(): PrismaClient {
  const databaseSchema = process.env.CEAK_DB_SCHEMA?.trim();
  const scopedDatabaseUrl = runtimeDatabaseUrl(process.env.DATABASE_URL, databaseSchema);

  // Prisma 7: o parâmetro schema do adapter nem sempre ajusta o search_path
  // das consultas raw. Configure ambos para manter o schema isolado em todas
  // as conexões, sem cair silenciosamente no schema public.
  if (databaseSchema && !/^[a-z][a-z0-9_]{0,62}$/.test(databaseSchema)) {
    throw new Error('CEAK_DB_SCHEMA inválido.');
  }
  const pool = new Pool({
    connectionString: scopedDatabaseUrl,
    ...(databaseSchema ? { options: `-c search_path=${databaseSchema}` } : {}),
  });
  const adapter = new PrismaPg(pool, databaseSchema ? { schema: databaseSchema } : undefined);

  return new PrismaClient({ adapter });
}

/** Cliente Prisma único por processo (reaproveitado no hot reload do Next). */
export const prisma: PrismaClient = globalForPrisma.__ceakPrisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__ceakPrisma = prisma;

export type { PrismaClient };
