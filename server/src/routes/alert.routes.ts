import { Router } from 'express'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'

import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'
import {
  queueAlertNotifications,
} from '../services/alert-notification.service.js'
export const doctorAlertRoutes = Router()
export const patientAlertRoutes = Router()

doctorAlertRoutes.use(
  requireAuth,
  requireRole('DOCTOR')
)

patientAlertRoutes.use(
  requireAuth,
  requireRole('PATIENT')
)

// DOCTOR: VIEW PATIENT ALERTS

doctorAlertRoutes.get('/', async (req, res, next) => {
  try {

    const alerts = await prisma.alert.findMany({
      where: {
        patient: {
          doctor: {
            userId: req.auth!.userId,
          },
        },
      },
      include: {
        patient: {
          select: {
            patientCode: true,
            user: {
              select: { fullName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ success: true, alerts })

  } catch (error) {
    next(error)
  }
})

// DOCTOR: ACKNOWLEDGE ALERT

doctorAlertRoutes.patch(
  '/:id/acknowledge',
  async (req, res, next) => {
    try {

      const result = await prisma.alert.updateMany({
        where: {
          id: String(req.params.id),
          status: 'OPEN',
          patient: {
            doctor: {
              userId: req.auth!.userId,
            },
          },
        },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedById: req.auth!.userId,
          acknowledgedAt: new Date(),
        },
      })

      if (!result.count) {
        res.status(404).json({
          success: false,
          message: 'Open alert not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Alert acknowledged',
      })

    } catch (error) {
      next(error)
    }
  }
)

// DOCTOR: RESOLVE ALERT

doctorAlertRoutes.patch(
  '/:id/resolve',
  async (req, res, next) => {
    try {

      const parsed = z.object({
        notes: z.string().trim().min(3).max(2000),
      }).safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Resolution notes are required',
        })
        return
      }

      const result = await prisma.alert.updateMany({
        where: {
          id: String(req.params.id),
          status: 'ACKNOWLEDGED',
          patient: {
            doctor: {
              userId: req.auth!.userId,
            },
          },
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNotes: parsed.data.notes,
        },
      })

      if (!result.count) {
        res.status(404).json({
          success: false,
          message: 'Acknowledged alert not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Alert resolved',
      })

    } catch (error) {
      next(error)
    }
  }
)

// PATIENT: VIEW OWN ALERTS

patientAlertRoutes.get('/', async (req, res, next) => {
  try {

    const alerts = await prisma.alert.findMany({
      where: {
        patient: {
          userId: req.auth!.userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    let notificationsQueued = false



    res.json({
  success: true,
  alert,
 
})

  } catch (error) {
    next(error)
  }
})

// PATIENT: MANUAL SOS

patientAlertRoutes.post(
  '/sos',

  rateLimit({
    windowMs: 60000,
    limit: 5,
    message: {
      success: false,
      message: 'Too many requests',
    },
  }),

  async (req, res, next) => {
    try {

      const patient = await prisma.patient.findUnique({
        where: {
          userId: req.auth!.userId,
        },
      })

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
        })
        return
      }

      const alert = await prisma.$transaction(
        async tx => {

          const existing = await tx.alert.findFirst({
            where: {
              patientId: patient.id,
              source: 'MANUAL_SOS',
              status: {
                in: ['OPEN', 'ACKNOWLEDGED'],
              },
            },
          })

          if (existing) return existing

          return tx.alert.create({
            data: {
              patientId: patient.id,
              title: 'Emergency assistance requested',
              message:
                'The patient has manually requested ' +
                'urgent assistance through MediConnect.',
              source: 'MANUAL_SOS',
              severity: 'EMERGENCY',
              status: 'OPEN',
            },
          })

        },
        {
          isolationLevel: 'Serializable',
        }
      )
      let notificationsQueued = false

try {

  await queueAlertNotifications(alert.id)

  notificationsQueued = true

} catch {

  console.error('Unable to queue SOS notifications')
}

      res.json({
  success: true,
  alert,
  notificationsQueued,
  message: notificationsQueued
    ? 'SOS recorded and notification queue processed'
    : 'SOS recorded, but notification scheduling failed',
})

    } catch (error) {
      next(error)
    }
  }
)