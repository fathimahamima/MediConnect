import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { prisma } from '../config/database.js'
import {
  setLiveReading,
  type LiveReading,
} from '../services/live-reading.service.js'

import {
  broadcastLiveReading,
} from '../realtime/socket.js'
import {
  verifyDeviceApiKey,
} from '../utils/device-security.js'

import {
  telemetrySchema,
} from '../validators/telemetry.validator.js'
import {
  evaluateRecovery,
} from '../services/recovery.service.js'
import {
  evaluateHealthAlerts,
} from '../services/alert.service.js'

const router = Router()

router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many device requests',
    },
  })
)

// =======================================
// DEVICE CONFIGURATION
// =======================================

router.get(
  '/configuration',
  async (req, res, next) => {
    try {
      const deviceCode =
        req.get('x-device-code') || ''

      const apiKey =
        req.get('x-device-key') || ''
      

      if (
        !/^MC-DEV-[A-F0-9]{8}$/.test(deviceCode) ||
        !/^[a-f0-9]{64}$/.test(apiKey)
      ) {
        res.status(401).json({
          success: false,
          message: 'Invalid device credentials',
          
        })
        return
      }

      const device =
        await prisma.device.findUnique({
          where: {
            deviceCode,
          },

          include: {
            assignments: {
              where: {
                unassignedAt: null,
              },

              take: 1,

              include: {
                patient: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        })

      if (
        !device ||
        !verifyDeviceApiKey(
          apiKey,
          device.apiKeyHash
        )
      ) {
        res.status(401).json({
          success: false,
          message: 'Invalid device credentials',
        })
        return
      }

      const assignment = device.assignments[0]

      const monitoringAllowed =
        device.status === 'ACTIVE' &&
        Boolean(
          assignment?.patient.monitoringConsentAt
        ) &&
        assignment?.patient.user.status === 'ACTIVE'

      res.set('Cache-Control', 'no-store')
      const activeAlert = monitoringAllowed && assignment
  ? await prisma.alert.findFirst({
      where: {
        patientId: assignment.patientId,
        status: 'OPEN',
        severity: {
          in: ['WARNING', 'CRITICAL', 'EMERGENCY'],
        },
      },
      select: {
        id: true,
      },
    })
  : null
      res.json({
        success: true,
        monitoringAllowed,

        assignmentId: monitoringAllowed
          ? assignment.id
          : null,

        uploadIntervalMs: 2000,
        alarmActive: Boolean(activeAlert),
      })

    } catch (error) {
      next(error)
    }
  },
)

// =======================================
// RECEIVE SENSOR MEASUREMENTS
// =======================================

router.post(
  '/telemetry',
  async (req, res, next) => {
    try {
      const deviceCode =
        req.get('x-device-code') || ''

      const apiKey =
        req.get('x-device-key') || ''

      if (
        !/^MC-DEV-[A-F0-9]{8}$/.test(deviceCode) ||
        !/^[a-f0-9]{64}$/.test(apiKey)
      ) {
        res.status(401).json({
          success: false,
          message: 'Invalid device credentials',
        })
        return
      }

      const parsed =
        telemetrySchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid telemetry data',
        })
        return
      }

      const data = parsed.data

      const result = await prisma.$transaction(
        async tx => {

          const device =
            await tx.device.findUnique({
              where: {
                deviceCode,
              },
            })

          if (
            !device ||
            !verifyDeviceApiKey(
              apiKey,
              device.apiKeyHash
            )
          ) {
            return {
              status: 401,
              message: 'Invalid device credentials',
            }
          }

          if (device.status !== 'ACTIVE') {
            return {
              status: 403,
              message: 'Device is not assigned',
            }
          }

          const assignment =
            await tx.deviceAssignment.findFirst({
              where: {
                id: data.assignmentId,
                deviceId: device.id,
                unassignedAt: null,

                patient: {
                  monitoringConsentAt: {
                    not: null,
                  },

                  user: {
                    status: 'ACTIVE',
                  },
                },
              },
            })

          if (!assignment) {
            return {
              status: 403,
              message:
                'Assignment invalid or monitoring consent missing',
            }
          }

          const existing =
            await tx.vitalReading.findUnique({
              where: {
                readingKey: data.readingKey,
              },
            })

          if (existing) {

            if (
              existing.assignmentId !==
              assignment.id
            ) {
              return {
                status: 409,
                message: 'Reading ID conflict',
              }
            }

            return {
              status: 200,
              message: 'Reading already received',
              readingId: existing.id,
            }
          }

          const now = new Date()

const liveReading: LiveReading = {
  patientId: assignment.patientId,
  assignmentId: assignment.id,
  deviceId: device.id,

  heartRate:
    data.signalQuality === 'GOOD'
      ? data.heartRate
      : null,

  spo2:
    data.signalQuality === 'GOOD'
      ? data.spo2
      : null,

  temperature: data.temperature,

  signalQuality: data.signalQuality,

  recordedAt: now.toISOString(),

  isAggregated: false,
}

const previousReading =
  await tx.vitalReading.findFirst({
    where: {
      assignmentId: assignment.id,
    },

    orderBy: {
      recordedAt: 'desc',
    },

    select: {
      recordedAt: true,
    },
  })

const shouldStore =
  !previousReading ||
  now.getTime() -
    previousReading.recordedAt.getTime()
      >= 60000

let readingId: string | undefined

if (shouldStore) {

  const reading =
    await tx.vitalReading.create({
      data: {
        patientId: assignment.patientId,
        assignmentId: assignment.id,

        readingKey: data.readingKey,

        heartRate: liveReading.heartRate,

        spo2: liveReading.spo2,

        temperature: liveReading.temperature,

        signalQuality:
          liveReading.signalQuality,

        sampleCount: 1,

        isAggregated: false,

        recordedAt: now,
      },
    })

  readingId = reading.id
}

// Limit database heartbeat writes

if (
  !device.lastSeenAt ||
  now.getTime() -
    device.lastSeenAt.getTime() >= 10000
) {

  await tx.device.update({
    where: {
      id: device.id,
    },

    data: {
      lastSeenAt: now,
    },
  })
}

return {
  status: shouldStore ? 201 : 200,

  message: shouldStore
    ? 'Reading stored'
    : 'Live reading received',

  readingId,

  liveReading,
}
        },

        {
          isolationLevel: 'Serializable',
        }
      )
      if (result.liveReading) {

  setLiveReading(result.liveReading)
  if (result.status === 201) {

  try {
    await evaluateRecovery(result.liveReading)
  } catch {
    console.error('Recovery evaluation failed')
  }

  try {
    await evaluateHealthAlerts(result.liveReading)
  } catch {
    console.error('Health alert evaluation failed')
  }
}
  try {
    await broadcastLiveReading(
      result.liveReading
    )
  } catch {
    console.error(
      'Live broadcast failed'
    )
  }
}

      res.status(result.status).json({
        success: result.status < 300,
        message: result.message,
        readingId: result.readingId,
      })

    } catch (error) {
      next(error)
    }
  },
)

export default router