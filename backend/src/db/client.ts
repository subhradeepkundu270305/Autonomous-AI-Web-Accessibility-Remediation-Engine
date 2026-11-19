import { PrismaClient } from '@prisma/client';

// Singleton Prisma client — safe to import from anywhere in the backend.
// In development, use a global to prevent hot-reload from exhausting connections.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
