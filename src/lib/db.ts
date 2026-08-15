import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (envUrl.startsWith('file:')) {
    const rawPath = envUrl.replace(/^file:/, '')
    if (path.isAbsolute(rawPath)) {
      return envUrl
    }
    const cwd = process.cwd()
    const candidates = [
      path.resolve(/*turbopackIgnore: true*/ cwd, 'prisma', rawPath),
      path.resolve(/*turbopackIgnore: true*/ cwd, rawPath),
      path.resolve(/*turbopackIgnore: true*/ cwd, 'db', 'custom.db'),
      path.resolve(/*turbopackIgnore: true*/ cwd, 'prisma', 'dev.db'),
      path.resolve(/*turbopackIgnore: true*/ cwd, '..', '..', 'db', 'custom.db'),
      path.resolve(/*turbopackIgnore: true*/ cwd, '..', '..', 'prisma', rawPath),
      path.resolve(/*turbopackIgnore: true*/ cwd, '..', '..', 'prisma', 'dev.db'),
      path.resolve(/*turbopackIgnore: true*/ cwd, '..', 'db', 'custom.db'),
    ]
    for (const candidate of candidates) {
      if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
        return `file:${candidate}`
      }
    }
    return `file:${path.resolve(/*turbopackIgnore: true*/ cwd, 'prisma', rawPath)}`
  }

  return envUrl
}

function createPrismaClient(): PrismaClient {
  const dbUrl = getDatabaseUrl()
  const shouldLogQuery = process.env.NODE_ENV === 'development' && process.env.DEBUG_SQL === 'true'
  return new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: shouldLogQuery ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db