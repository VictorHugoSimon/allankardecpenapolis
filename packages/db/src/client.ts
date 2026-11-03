import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as { __ceakPrisma?: PrismaClient };

function criarClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  const databaseSchema = process.env.CEAK_DB_SCHEMA?.trim();
  const scopedDatabaseUrl =
    databaseUrl && databaseSchema
      ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}options=${encodeURIComponent(`-c search_path=${databaseSchema},public`)}`
      : databaseUrl;

  const adapter = new PrismaPg({ connectionString: scopedDatabaseUrl });
  return new PrismaClient({ adapter });
}

/** Cliente Prisma único por processo (reaproveitado no hot reload do Next). */
export const prisma: PrismaClient = globalForPrisma.__ceakPrisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__ceakPrisma = prisma;

export type { PrismaClient };
