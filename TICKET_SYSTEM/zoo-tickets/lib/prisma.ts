import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
