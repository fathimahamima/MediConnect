import 'dotenv/config'
import { randomBytes } from 'node:crypto'

import { prisma } from '../config/database.js'
import { hashToken } from '../auth/session.js'
import { sendEmail } from './email.service.js'
import { emailTemplate } from './email.templates.js'

const VERIFICATION_MINUTES = Number(
  process.env.EMAIL_VERIFICATION_MINUTES || 30
)

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173'

export async function sendDoctorVerificationEmail(
  userId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (
    !user ||
    !user.email ||
    user.emailVerified ||
    user.role !== 'DOCTOR'
  ) {
    return
  }

  const token = randomBytes(32).toString('hex')

  const expiresAt = new Date(
    Date.now() +
    VERIFICATION_MINUTES * 60 * 1000
  )

  await prisma.$transaction([
    prisma.accountToken.deleteMany({
      where: {
        userId,
        type: 'EMAIL_VERIFICATION',
        usedAt: null,
      },
    }),

    prisma.accountToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    }),
  ])

  const verificationUrl =
    `${CLIENT_URL}/verify-email#token=${token}`

  const notification = await prisma.notification.create({
    data: {
      channel: 'EMAIL',
      recipient: user.email,
      subject: 'MediConnect | Verify your email',
      message: 'Doctor account verification email',
      status: 'PENDING',
      attempts: 1,
    },
  })

  try {
    const result = await sendEmail({
      to: user.email,

      subject: 'MediConnect | Verify your email',

      text: [
        `Hello ${user.fullName},`,
        'Welcome to MediConnect.',
        'Verify your email using this link:',
        verificationUrl,
        `This link expires in ${VERIFICATION_MINUTES} minutes.`,
      ].join('\n\n'),

      html: emailTemplate({
        category: 'ACCOUNT VERIFICATION',

        title: 'Verify your email address.',

        message:
          `Hello ${user.fullName}, welcome to MediConnect. Verify your email address to continue setting up your doctor account.`,

        buttonText: 'Verify email address',

        buttonUrl: verificationUrl,

        notice:
          `This link expires in ${VERIFICATION_MINUTES} minutes. Administrator approval is also required before you can sign in.`,
      }),
    })

    await prisma.notification.update({
      where: {
        id: notification.id,
      },

      data: {
        status: 'SENT',
        providerMessageId: result.messageId,
        sentAt: new Date(),
      },
    })
  } catch (error) {
    await prisma.notification.update({
      where: {
        id: notification.id,
      },

      data: {
        status: 'FAILED',
        errorMessage: 'Email delivery request failed',
      },
    })

    throw error
  }
}