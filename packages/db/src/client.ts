import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as { __ceakPrisma?: PrismaClient };

function criarClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

/** Cliente Prisma único por processo (reaproveitado no hot reload do Next). */
export const prisma: PrismaClient = globalForPrisma.__ceakPrisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__ceakPrisma = prisma;

export type { PrismaClient };
