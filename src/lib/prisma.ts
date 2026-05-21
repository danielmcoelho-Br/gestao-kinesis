import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const connectionString = `${process.env.DATABASE_URL}`

const createPrismaClient = () => {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool as any)
  // Preserve queries logging only if desired
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
