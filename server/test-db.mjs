import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()

    const result = await prisma.$queryRaw`
      SELECT NOW() AS server_time
    `

    console.log('================================')
    console.log('MediConnect Database')
    console.log('Connection successful!')
    console.log(result)
    console.log('================================')
  } catch (error) {
    console.error('Database connection failed:')
    console.error(error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()