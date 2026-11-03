import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as { __ceakPrisma?: PrismaClient };

function runtimeDatabaseUrl(url?: string, schema?: string) {
  if (!url || !schema) return url;

  const parsed = new URL(url);
  // O pooler transacional do Neon não aceita `options=search_path` no startup.
  // Os novos previews CEAK v2 usam a conexão direta e mantêm o legado intacto.
  parsed.hostname = parsed.hostname.replace('-pooler.', '.');
  parsed.searchParams.set('options', `-c search_path=${schema},public`);
  return parsed.toString();
}

function criarClient(): PrismaClient {
  const scopedDatabaseUrl = runtimeDatabaseUrl(
    process.env.DATABASE_URL,
    process.env.CEAK_DB_SCHEMA?.trim(),
  );

  const adapter = new PrismaPg({ connectionString: scopedDatabaseUrl });
  return new PrismaClient({ adapter });
}

/** Cliente Prisma único por processo (reaproveitado no hot reload do Next). */
export const prisma: PrismaClient = globalForPrisma.__ceakPrisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__ceakPrisma = prisma;

export type { PrismaClient };
