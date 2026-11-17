import { prisma } from '../config/database.js'

import { sendEmail } from './email.service.js'
import { emailTemplate } from './email.templates.js'

export async function queueAlertNotifications(
  alertId: string
) {

  await prisma.$transaction(async tx => {

    const alert = await tx.alert.findUnique({
      where: { id: alertId },

      include: {
        patient: {
          include: {
            user: true,
            doctor: {
              include: {
                user: true,
              },
            },
            emergencyContacts: {
              where: {
                consentAt: { not: null },
              },
            },
          },
        },
      },
    })

    if (!alert) return

    const patient = alert.patient

    const urgent =
      alert.severity === 'CRITICAL' ||
      alert.severity === 'EMERGENCY'

    const recipients = new Set<string>()

    if (
      patient.user.email &&
      patient.user.emailVerified &&
      patient.user.status === 'ACTIVE'
    ) {
      recipients.add(patient.user.email)
    }

    if (
      patient.doctor.user.email &&
      patient.doctor.user.emailVerified &&
      patient.doctor.user.status === 'ACTIVE' &&
      patient.doctor.approval === 'APPROVED'
    ) {
      recipients.add(patient.doctor.user.email)
    }

    if (urgent) {
      for (const contact of patient.emergencyContacts) {

        if (contact.email) {
          recipients.add(
            contact.email.trim().toLowerCase()
          )
        }
      }
    }

    const subject = urgent
      ? 'MediConnect — Urgent assistance notification'
      : 'MediConnect — Health monitoring notification'

    for (const recipient of recipients) {

      const existing = await tx.notification.findFirst({
        where: {
          alertId,
          channel: 'EMAIL',
          recipient,
        },
      })

      if (existing) continue

      await tx.notification.create({
        data: {
          patientId: patient.id,
          alertId,
          channel: 'EMAIL',
          recipient,
          subject,
          message:
            'A health monitoring notification requires ' +
            'attention. Please review MediConnect or ' +
            'contact the patient directly. ' +
            'This is not an emergency dispatch service.',
          status: 'PENDING',
        },
      })
    }

  }, {
    isolationLevel: 'Serializable',
  })
}

export async function processEmailNotifications() {

  const pending = await prisma.notification.findMany({
    where: {
      channel: 'EMAIL',
      status: 'PENDING',
      alertId: { not: null },
      attempts: 0,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 10,
  })

  for (const notification of pending) {

    const claimed = await prisma.notification.updateMany({
      where: {
        id: notification.id,
        status: 'PENDING',
        attempts: 0,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    })

    if (!claimed.count) continue

    try {

      const subject =
        notification.subject ||
        'MediConnect notification'

      const result = await sendEmail({
        to: notification.recipient,
        subject,

        html: emailTemplate({
          category: 'Health monitoring',
          title: subject,
          message: notification.message,

          buttonText: 'Open MediConnect',
          buttonUrl: process.env.CLIENT_URL,

          notice:
            'MediConnect is an experimental monitoring ' +
            'platform. In an emergency, contact ' +
            'emergency services directly.',
        }),

        text: notification.message,
      })

      await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          providerMessageId: result.messageId,
          errorMessage: null,
        },
      })

    } catch {

      await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          status: 'FAILED',
          errorMessage: 'Email submission failed',
        },
      })
    }
  }
}