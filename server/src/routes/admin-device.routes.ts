import { Router } from 'express'

import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

import {
  registerDeviceSchema,
  deviceIdSchema,
} from '../validators/device.validator.js'

import {
  generateDeviceCode,
  generateDeviceApiKey,
  hashDeviceApiKey,
} from '../utils/device-security.js'

const router = Router()

router.use(
  requireAuth,
  requireRole('ADMIN'),
)

const deviceSelect = {
  id: true,
  deviceCode: true,
  deviceName: true,
  status: true,
  firmwareVersion: true,
  lastSeenAt: true,
  createdAt: true,

  assignments: {
    where: {
      unassignedAt: null,
    },

    select: {
      id: true,
      assignedAt: true,

      patient: {
        select: {
          patientCode: true,
        },
      },
    },
  },
} as const

// =======================================
// GET REGISTERED DEVICES
// =======================================

router.get('/', async (_req, res, next) => {
  try {
    const devices =
      await prisma.device.findMany({
        select: deviceSelect,

        orderBy: {
          createdAt: 'desc',
        },

        take: 100,
      })

    res.json({
      success: true,
      devices,
    })

  } catch (error) {
    next(error)
  }
})

// =======================================
// REGISTER NEW DEVICE
// =======================================

router.post('/', async (req, res, next) => {
  try {
    const parsed =
      registerDeviceSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid device information',
      })
      return
    }

    const deviceCode = generateDeviceCode()
    const apiKey = generateDeviceApiKey()

    const device = await prisma.device.create({
      data: {
        deviceCode,

        deviceName:
          parsed.data.deviceName,

        firmwareVersion:
          parsed.data.firmwareVersion,

        apiKeyHash:
          hashDeviceApiKey(apiKey),

        status: 'REGISTERED',
      },

      select: deviceSelect,
    })

    res.set('Cache-Control', 'no-store')

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      device,
      apiKey,
    })

  } catch (error) {
    next(error)
  }
})

// =======================================
// REGENERATE DEVICE API KEY
// =======================================

router.post(
  '/:id/regenerate-key',
  async (req, res, next) => {
    try {
      const parsed =
        deviceIdSchema.safeParse(req.params.id)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid device ID',
        })
        return
      }

      const apiKey = generateDeviceApiKey()

      const result =
        await prisma.device.updateMany({
          where: {
            id: parsed.data,
          },

          data: {
            apiKeyHash:
              hashDeviceApiKey(apiKey),

            lastSeenAt: null,
          },
        })

      if (!result.count) {
        res.status(404).json({
          success: false,
          message: 'Device not found',
        })
        return
      }

      res.set('Cache-Control', 'no-store')

      res.json({
        success: true,
        message: 'Device API key regenerated',
        apiKey,
      })

    } catch (error) {
      next(error)
    }
  },
)

// =======================================
// DISABLE DEVICE
// =======================================

router.patch(
  '/:id/disable',
  async (req, res, next) => {
    try {
      const parsed =
        deviceIdSchema.safeParse(req.params.id)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid device ID',
        })
        return
      }

      await prisma.$transaction(
        async tx => {

          await tx.device.update({
            where: {
              id: parsed.data,
            },

            data: {
              status: 'DISABLED',
            },
          })

          await tx.deviceAssignment.updateMany({
            where: {
              deviceId: parsed.data,
              unassignedAt: null,
            },

            data: {
              unassignedAt: new Date(),
            },
          })
        },

        {
          isolationLevel: 'Serializable',
        }
      )

      res.json({
        success: true,
        message: 'Device disabled',
      })

    } catch (error) {
      next(error)
    }
  },
)

// =======================================
// ENABLE DISABLED DEVICE
// =======================================

router.patch(
  '/:id/enable',
  async (req, res, next) => {
    try {
      const parsed =
        deviceIdSchema.safeParse(req.params.id)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid device ID',
        })
        return
      }

      const result =
        await prisma.device.updateMany({
          where: {
            id: parsed.data,
            status: 'DISABLED',
          },

          data: {
            status: 'REGISTERED',
            lastSeenAt: null,
          },
        })

      if (!result.count) {
        res.status(409).json({
          success: false,
          message: 'Device cannot be enabled',
        })
        return
      }

      res.json({
        success: true,
        message: 'Device enabled',
      })

    } catch (error) {
      next(error)
    }
  },
)

export default router