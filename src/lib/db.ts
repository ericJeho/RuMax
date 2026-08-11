import { PrismaClient } from '@prisma/client';

/**
 * A single Prisma client per process. Next.js hot-reloads server modules in
 * development, which would otherwise open a new connection pool on every edit and
 * exhaust Postgres' connection limit within a few minutes.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
