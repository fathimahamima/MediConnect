import 'dotenv/config'
import { randomBytes } from 'node:crypto'

import { prisma } from '../config/database.js'
import { hashToken } from '../auth/session.js'
import { sendEmail } from './email.service.js'
import { emailTemplate } from './email.templates.js'

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173'

const ACTIVATION_HOURS = Number(
  process.env.PATIENT_ACTIVATION_HOURS || 48
)

export async function sendPatientInvitation(
  patientId: string
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },

    include: {
      user: true,

      doctor: {
        include: {
          user: true,
        },
      },
    },
  })

  if (
    !patient ||
    !patient.user.email ||
    patient.user.status !== 'PENDING' ||
    patient.user.passwordHash
  ) {
    throw new Error(
      'Patient is not eligible for activation'
    )
  }

  const token = randomBytes(32).toString('hex')

  const expiresAt = new Date(
    Date.now() +
    ACTIVATION_HOURS * 60 * 60 * 1000
  )

  await prisma.$transaction([
    prisma.accountToken.deleteMany({
      where: {
        userId: patient.userId,
        type: 'PATIENT_ACTIVATION',
        usedAt: null,
      },
    }),

    prisma.accountToken.create({
      data: {
        userId: patient.userId,
        tokenHash: hashToken(token),
        type: 'PATIENT_ACTIVATION',
        expiresAt,
      },
    }),
  ])

  const activationUrl =
    `${CLIENT_URL}/activate-patient#token=${token}`

  const subject =
    'MediConnect | Activate your patient account'

  const message =
    `Hello ${patient.user.fullName}, ` +
    `your healthcare provider ${patient.doctor.user.fullName} ` +
    `has invited you to MediConnect. ` +
    `Your unique patient ID is ${patient.patientCode}. ` +
    `Activate your account to create your password.`

  const notification =
    await prisma.notification.create({
      data: {
        patientId: patient.id,
        channel: 'EMAIL',
        recipient: patient.user.email,
        subject,
        message: 'Patient account activation invitation',
        status: 'PENDING',
        attempts: 1,
      },
    })

  try {
    const result = await sendEmail({
      to: patient.user.email,
      subject,

      text: [
        message,
        `Activation link: ${activationUrl}`,
        `Expires in ${ACTIVATION_HOURS} hours.`,
        'Keep your patient ID and password private.',
      ].join('\n\n'),

      html: emailTemplate({
        category: 'PATIENT ACCOUNT',

        title: 'Welcome to MediConnect.',

        message,

        buttonText: 'Activate my account',

        buttonUrl: activationUrl,

        notice:
          `Your patient ID is ${patient.patientCode}. ` +
          `This activation link expires in ${ACTIVATION_HOURS} hours.`,
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
        errorMessage: 'Patient invitation email failed',
      },
    })

    throw error
  }
}