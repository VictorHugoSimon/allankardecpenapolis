import { PrismaPg } from '@prisma/adapter-pg';
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

  const adapter = new PrismaPg(
    { connectionString: scopedDatabaseUrl },
    databaseSchema ? { schema: databaseSchema } : undefined,
  );

  return new PrismaClient({ adapter });
}

/** Cliente Prisma único por processo (reaproveitado no hot reload do Next). */
export const prisma: PrismaClient = globalForPrisma.__ceakPrisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__ceakPrisma = prisma;

export type { PrismaClient };
