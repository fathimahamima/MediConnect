import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../config/database.js'

async function resetAdminPassword() {
  const data = z.object({
    email: z.string().email(),
    password: z.string().min(12).max(72)
      .refine(value =>
        Buffer.byteLength(value, 'utf8') <= 72
      ),
  }).parse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })

  const email = data.email.toLowerCase()

  const admin = await prisma.user.findUnique({
    where: { email },
  })

  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('Administrator account not found')
  }

  const passwordHash = await bcrypt.hash(
    data.password,
    12,
  )

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash },
  })

  console.log('Admin password reset successfully')
}

resetAdminPassword()
  .catch(error => {
    console.error('Password reset failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })