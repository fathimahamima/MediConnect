
import { prisma } from '../config/database.js'

import { sendEmail } from './email.service.js'
import { emailTemplate } from './email.templates.js'

const MAX_ATTEMPTS = 3
const CLAIM_TIMEOUT_MS = 5 * 60 * 1000

// =====================================
// ELIGIBLE EMAIL RECIPIENTS
// =====================================

async function getEligibleRecipients(alertId: string) {

  const alert = await prisma.alert.findUnique({

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

  const recipients = new Set<string>()

  if (!alert) {
    return recipients
  }

  const patient = alert.patient

  const urgent =
    alert.severity === 'CRITICAL' ||
    alert.severity === 'EMERGENCY'

  if (patient.user.status !== 'ACTIVE') {
    return recipients
  }

  if (
    patient.user.email &&
    patient.user.emailVerified
  ) {
    recipients.add(
      patient.user.email.trim().toLowerCase()
    )
  }

  if (
    patient.doctor.user.email &&
    patient.doctor.user.emailVerified &&
    patient.doctor.user.status === 'ACTIVE' &&
    patient.doctor.approval === 'APPROVED'
  ) {
    recipients.add(
      patient.doctor.user.email.trim().toLowerCase()
    )
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

  return recipients
}

// =====================================
// QUEUE ALERT EMAILS
// =====================================

export async function queueAlertNotifications(
  alertId: string
) {

  const recipients =
    await getEligibleRecipients(alertId)

  await prisma.$transaction(async tx => {

    const alert = await tx.alert.findUnique({
      where: { id: alertId },
    })

    if (!alert || alert.status === 'RESOLVED') {
      return
    }

    const urgent =
      alert.severity === 'CRITICAL' ||
      alert.severity === 'EMERGENCY'

    const subject = urgent
      ? 'MediConnect — Urgent assistance notification'
      : 'MediConnect — Health monitoring notification'

    for (const recipient of recipients) {

      const existing =
        await tx.notification.findFirst({
          where: {
            alertId,
            channel: 'EMAIL',
            recipient,
          },
        })

      if (existing) continue

      await tx.notification.create({

        data: {
          patientId: alert.patientId,
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
          attempts: 0,
          nextAttemptAt: new Date(),
        },
      })
    }

  }, {
    isolationLevel: 'Serializable',
  })
}

// =====================================
// RECOVER INTERRUPTED NOTIFICATIONS
// =====================================

async function recoverInterruptedNotifications() {

  const cutoff = new Date(
    Date.now() - CLAIM_TIMEOUT_MS
  )

  const interrupted = {
    channel: 'EMAIL' as const,
    status: 'PENDING' as const,
    alertId: { not: null },

    attempts: {
      gt: 0,
    },

    nextAttemptAt: null,

    OR: [
      {
        lastAttemptAt: {
          lt: cutoff,
        },
      },
      {
        lastAttemptAt: null,
      },
    ],
  }

  await prisma.notification.updateMany({

    where: {
      ...interrupted,

      attempts: {
        gt: 0,
        lt: MAX_ATTEMPTS,
      },
    },

    data: {
      nextAttemptAt: new Date(),
      errorMessage: 'Interrupted email attempt',
    },
  })

  await prisma.notification.updateMany({

    where: {
      ...interrupted,

      attempts: {
        gte: MAX_ATTEMPTS,
      },
    },

    data: {
      status: 'FAILED',
      errorMessage: 'Maximum email attempts reached',
    },
  })
}

// =====================================
// PROCESS EMAIL QUEUE
// =====================================

export async function processEmailNotifications() {

  await recoverInterruptedNotifications()

  const now = new Date()

  const pending =
    await prisma.notification.findMany({

      where: {
        channel: 'EMAIL',
        status: 'PENDING',
        alertId: { not: null },

        attempts: {
          lt: MAX_ATTEMPTS,
        },

        OR: [
          {
            nextAttemptAt: {
              lte: now,
            },
          },
          {
            attempts: 0,
            nextAttemptAt: null,
          },
        ],
      },

      orderBy: {
        createdAt: 'asc',
      },

      take: 10,
    })

  for (const notification of pending) {

    const claimedAt = new Date()

    const claimed =
      await prisma.notification.updateMany({

        where: {
          id: notification.id,
          status: 'PENDING',
          attempts: notification.attempts,
          nextAttemptAt: notification.nextAttemptAt,
        },

        data: {
          attempts: {
            increment: 1,
          },

          lastAttemptAt: claimedAt,
          nextAttemptAt: null,
        },
      })

    if (!claimed.count) continue

    const attempt = notification.attempts + 1

    try {

      if (!notification.alertId) {
        throw new Error('Alert unavailable')
      }

      const recipients =
        await getEligibleRecipients(
          notification.alertId
        )

      const alert = await prisma.alert.findUnique({

        where: {
          id: notification.alertId,
        },

        select: {
          status: true,
        },
      })

      if (
        !alert ||
        alert.status === 'RESOLVED' ||
        !recipients.has(
          notification.recipient.trim().toLowerCase()
        )
      ) {

        await prisma.notification.updateMany({

          where: {
            id: notification.id,
            status: 'PENDING',
            lastAttemptAt: claimedAt,
          },

          data: {
            status: 'FAILED',
            nextAttemptAt: null,

            errorMessage:
              'Notification cancelled: alert resolved ' +
              'or recipient no longer eligible',
          },
        })

        continue
      }

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

      await prisma.notification.updateMany({

        where: {
          id: notification.id,
          status: 'PENDING',
          lastAttemptAt: claimedAt,
        },

        data: {
          status: 'SENT',
          sentAt: new Date(),
          providerMessageId: result.messageId,
          errorMessage: null,
          nextAttemptAt: null,
        },
      })

      console.log('Notification email accepted')

    } catch {

      const retryAllowed =
        attempt < MAX_ATTEMPTS

      const retryDelay =
        attempt === 1
          ? 30000
          : 120000

      await prisma.notification.updateMany({

        where: {
          id: notification.id,
          status: 'PENDING',
          lastAttemptAt: claimedAt,
        },

        data: {

          status: retryAllowed
            ? 'PENDING'
            : 'FAILED',

          nextAttemptAt: retryAllowed
            ? new Date(Date.now() + retryDelay)
            : null,

          errorMessage: retryAllowed
            ? 'Email submission failed; retry scheduled'
            : 'Maximum email attempts reached',
        },
      })

      console.error(
        retryAllowed
          ? 'Notification retry scheduled'
          : 'Notification permanently failed'
      )
    }
  }
}
