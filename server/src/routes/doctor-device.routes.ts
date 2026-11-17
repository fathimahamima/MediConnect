import { Router } from 'express'

import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

import {
  assignDeviceSchema,
  deviceIdSchema,
} from '../validators/device.validator.js'

const router = Router()

router.use(
  requireAuth,
  requireRole('DOCTOR'),
)

// =======================================
// GET AVAILABLE DEVICES
// =======================================

router.get(
  '/available',
  async (_req, res, next) => {
    try {
      const devices =
        await prisma.device.findMany({
          where: {
            status: {
              in: ['REGISTERED', 'ACTIVE'],
            },

            assignments: {
              none: {
                unassignedAt: null,
              },
            },
          },

          select: {
            id: true,
            deviceCode: true,
            deviceName: true,
            status: true,
            firmwareVersion: true,
            lastSeenAt: true,
          },

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
  },
)

// =======================================
// GET PATIENTS ELIGIBLE FOR MONITORING
// =======================================

router.get(
  '/eligible-patients',
  async (req, res, next) => {
    try {
      const doctor =
        await prisma.doctor.findUniqueOrThrow({
          where: {
            userId: req.auth!.userId,
          },
        })

      const patients =
        await prisma.patient.findMany({
          where: {
            doctorId: doctor.id,

            monitoringConsentAt: {
              not: null,
            },

            user: {
              status: 'ACTIVE',
            },

            assignments: {
              none: {
                unassignedAt: null,
              },
            },
          },

          select: {
            id: true,
            patientCode: true,

            user: {
              select: {
                fullName: true,
              },
            },
          },

          take: 100,
        })

      res.json({
        success: true,
        patients,
      })

    } catch (error) {
      next(error)
    }
  },
)

// =======================================
// GET DOCTOR'S ACTIVE ASSIGNMENTS
// =======================================

router.get(
  '/assignments',
  async (req, res, next) => {
    try {
      const doctor =
        await prisma.doctor.findUniqueOrThrow({
          where: {
            userId: req.auth!.userId,
          },
        })

      const assignments =
        await prisma.deviceAssignment.findMany({
          where: {
            unassignedAt: null,

            patient: {
              doctorId: doctor.id,
            },
          },

          select: {
            id: true,
            assignedAt: true,

            device: {
              select: {
                id: true,
                deviceCode: true,
                deviceName: true,
                status: true,
                lastSeenAt: true,
              },
            },

            patient: {
              select: {
                id: true,
                patientCode: true,

                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },

          orderBy: {
            assignedAt: 'desc',
          },

          take: 100,
        })

      res.json({
        success: true,
        assignments,
      })

    } catch (error) {
      next(error)
    }
  },
)

// =======================================
// ASSIGN DEVICE
// =======================================

router.post(
  '/assign',
  async (req, res, next) => {
    try {
      const parsed =
        assignDeviceSchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid assignment information',
        })
        return
      }

      const doctor =
        await prisma.doctor.findUniqueOrThrow({
          where: {
            userId: req.auth!.userId,
          },
        })

      const result =
        await prisma.$transaction(
          async tx => {

            const patient =
              await tx.patient.findFirst({
                where: {
                  id: parsed.data.patientId,
                  doctorId: doctor.id,
                  monitoringConsentAt: {
                    not: null,
                  },

                  user: {
                    status: 'ACTIVE',
                  },
                },
              })

            if (!patient) {
              return {
                error:
                  'Patient unavailable or consent missing',
              }
            }

            const device =
              await tx.device.findFirst({
                where: {
                  id: parsed.data.deviceId,

                  status: {
                    in: ['REGISTERED', 'ACTIVE'],
                  },
                },
              })

            if (!device) {
              return {
                error: 'Device unavailable',
              }
            }

            const existing =
              await tx.deviceAssignment.findFirst({
                where: {
                  unassignedAt: null,

                  OR: [
                    {
                      deviceId: device.id,
                    },
                    {
                      patientId: patient.id,
                    },
                  ],
                },
              })

            if (existing) {
              return {
                error:
                  'Device or patient already has an active assignment',
              }
            }

            const assignment =
              await tx.deviceAssignment.create({
                data: {
                  deviceId: device.id,
                  patientId: patient.id,
                },
              })

            await tx.device.update({
              where: {
                id: device.id,
              },

              data: {
                status: 'ACTIVE',
                lastSeenAt: null,
              },
            })

            return {
              assignment,
            }
          },

          {
            isolationLevel: 'Serializable',
          }
        )

      if ('error' in result) {
        res.status(409).json({
          success: false,
          message: result.error,
        })
        return
      }

      res.status(201).json({
        success: true,
        message: 'Device assigned successfully',
        assignment: result.assignment,
      })

    } catch (error) {
      next(error)
    }
  },
)

// =======================================
// UNASSIGN DEVICE
// =======================================

router.patch(
  '/assignments/:id/unassign',
  async (req, res, next) => {
    try {
      const parsed =
        deviceIdSchema.safeParse(req.params.id)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid assignment ID',
        })
        return
      }

      const doctor =
        await prisma.doctor.findUniqueOrThrow({
          where: {
            userId: req.auth!.userId,
          },
        })

      const result =
        await prisma.$transaction(
          async tx => {

            const assignment =
              await tx.deviceAssignment.findFirst({
                where: {
                  id: parsed.data,

                  unassignedAt: null,

                  patient: {
                    doctorId: doctor.id,
                  },
                },
              })

            if (!assignment) {
              return false
            }

            await tx.deviceAssignment.update({
              where: {
                id: assignment.id,
              },

              data: {
                unassignedAt: new Date(),
              },
            })

            await tx.device.updateMany({
              where: {
                id: assignment.deviceId,
                status: 'ACTIVE',
              },

              data: {
                status: 'REGISTERED',
                lastSeenAt: null,
              },
            })

            return true
          },

          {
            isolationLevel: 'Serializable',
          }
        )

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Assignment not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Device unassigned successfully',
      })

    } catch (error) {
      next(error)
    }
  },
)

export default router