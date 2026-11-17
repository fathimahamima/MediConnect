import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

export async function connectDatabase() {
  await prisma.$connect()

  console.log(
    'MediConnect PostgreSQL database connected'
  )
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}