import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../config/database.js'

async function createAdmin() {
  const data = z.object({
    fullName: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(12).max(72)
      .refine(value =>
        Buffer.byteLength(value, 'utf8') <= 72
      ),
  }).parse({
    fullName: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })

  const email = data.email.toLowerCase()

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    throw new Error(
      'An account with this email already exists'
    )
  }

  const passwordHash = await bcrypt.hash(
    data.password,
    12,
  )

  const admin = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  })

  console.log('Administrator created successfully')
  console.log(admin)
}

createAdmin()
  .catch(error => {
    console.error('Admin creation failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })