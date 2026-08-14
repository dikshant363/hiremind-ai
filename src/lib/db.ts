import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const shouldLogQuery = process.env.NODE_ENV === 'development' && process.env.DEBUG_SQL === 'true';

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: shouldLogQuery ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db