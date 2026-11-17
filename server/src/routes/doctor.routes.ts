import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'

import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

import {
  createPatientSchema,
} from '../validators/patient.validator.js'

import {
  sendPatientInvitation,
} from '../services/patient-invitation.service.js'

const router = Router()

router.use(requireAuth, requireRole('DOCTOR'))

const invitationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many invitation requests',
  },
})

const patientSelect = {
  id: true,
  patientCode: true,
  dateOfBirth: true,
  gender: true,
  bloodGroup: true,
  createdAt: true,
  monitoringConsentAt: true,

  user: {
    select: {
      fullName: true,
      email: true,
      phone: true,
      status: true,
      emailVerified: true,
    },
  },
} as const

// ==========================================
// DOCTOR DASHBOARD STATISTICS
// ==========================================

router.get('/overview', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: {
        userId: req.auth!.userId,
      },
    })

    const [
      totalPatients,
      activePatients,
      pendingPatients,
      assignedDevices,
      openAlerts,
      recentPatients,
    ] = await Promise.all([
      prisma.patient.count({
        where: {
          doctorId: doctor.id,
        },
      }),

      prisma.patient.count({
        where: {
          doctorId: doctor.id,
          user: {
            status: 'ACTIVE',
          },
        },
      }),

      prisma.patient.count({
        where: {
          doctorId: doctor.id,
          user: {
            status: 'PENDING',
          },
        },
      }),

      prisma.deviceAssignment.count({
        where: {
          unassignedAt: null,

          patient: {
            doctorId: doctor.id,
          },

          device: {
            status: 'ACTIVE',
          },
        },
      }),

      prisma.alert.count({
        where: {
          status: 'OPEN',

          patient: {
            doctorId: doctor.id,
          },
        },
      }),

      prisma.patient.findMany({
        where: {
          doctorId: doctor.id,
        },

        select: patientSelect,

        orderBy: {
          createdAt: 'desc',
        },

        take: 5,
      }),
    ])

    res.json({
      success: true,

      stats: {
        totalPatients,
        activePatients,
        pendingPatients,
        assignedDevices,
        openAlerts,
      },

      recentPatients,
    })
  } catch (error) {
    next(error)
  }
})

// ==========================================
// GET ALL PATIENTS
// ==========================================

router.get('/patients', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: {
        userId: req.auth!.userId,
      },
    })

    const query = z.object({
      search: z.string().trim().max(100).default(''),

      page: z.coerce.number()
        .int().min(1).max(10000).default(1),
    }).safeParse(req.query)

    if (!query.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid search request',
      })
      return
    }

    const { search, page } = query.data
    const pageSize = 20

    const where = {
      doctorId: doctor.id,

      ...(search ? {
        OR: [
          {
            patientCode: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            user: {
              fullName: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          },
        ],
      } : {}),
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        select: patientSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      prisma.patient.count({ where }),
    ])

    res.json({
      success: true,
      patients,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    next(error)
  }
})

// ==========================================
// REGISTER A NEW PATIENT
// ==========================================

router.post(
  '/patients',
  invitationLimiter,
  async (req, res, next) => {
    try {
      const parsed =
        createPatientSchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,

          message:
            parsed.error.issues[0]?.message ||
            'Invalid patient details',
        })
        return
      }

      const data = parsed.data

      const doctor =
        await prisma.doctor.findUniqueOrThrow({
          where: {
            userId: req.auth!.userId,
          },
        })

      const existingUser =
        await prisma.user.findUnique({
          where: {
            email: data.email,
          },
        })

      if (existingUser) {
        res.status(409).json({
          success: false,

          message:
            'An account with this email already exists',
        })
        return
      }

      const patientCode =
        `MC-${randomBytes(4)
          .toString('hex')
          .toUpperCase()}`

      const patient = await prisma.$transaction(
        async tx => {
          const user = await tx.user.create({
            data: {
              fullName: data.fullName,
              email: data.email,
              phone: data.phone,
              role: 'PATIENT',
              status: 'PENDING',
            },
          })

          return tx.patient.create({
            data: {
              patientCode,
              userId: user.id,
              doctorId: doctor.id,

              dateOfBirth: data.dateOfBirth
                ? new Date(data.dateOfBirth)
                : null,

              gender: data.gender || null,

              bloodGroup: data.bloodGroup || null,

              medicalNotes: data.medicalNotes || null,

              emergencyContacts: {
                create: {
                  fullName:
                    data.emergencyContact.fullName,

                  relationship:
                    data.emergencyContact.relationship,

                  phone:
                    data.emergencyContact.phone,

                  email:
                    data.emergencyContact.email || null,

                  isPrimary: true,

                  consentAt:
                    data.emergencyContact.consentConfirmed
                      ? new Date()
                      : null,
                },
              },
            },

            select: patientSelect,
          })
        },
      )

      let invitationSent = false

      try {
        await sendPatientInvitation(patient.id)
        invitationSent = true
      } catch {
        console.error(
          'Patient invitation could not be sent'
        )
      }

      res.status(201).json({
        success: true,
        patient,
        invitationSent,

        message: invitationSent
          ? 'Patient registered. Invitation submitted to email service.'
          : 'Patient registered, but invitation delivery request failed.',
      })
    } catch (error) {
      next(error)
    }
  },
)

// ==========================================
// GET INDIVIDUAL PATIENT PROFILE
// ==========================================

router.get(
  '/patients/:id',
  async (req, res, next) => {
    try {
      const doctor =
        await prisma.doctor.findUniqueOrThrow({
          where: {
            userId: req.auth!.userId,
          },
        })

      const id = z.string().uuid()
        .safeParse(req.params.id)

      if (!id.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid patient ID',
        })
        return
      }

      const patient = await prisma.patient.findFirst({
        where: {
          id: id.data,
          doctorId: doctor.id,
        },

        select: {
          ...patientSelect,

          medicalNotes: true,

          emergencyContacts: true,

          assignments: {
            where: {
              unassignedAt: null,
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
            },
          },
        },
      })

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
        })
        return
      }

      res.json({
        success: true,
        patient,
      })
    } catch (error) {
      next(error)
    }
  },
)

// ==========================================
// RESEND PATIENT INVITATION
// ==========================================

router.post(
  '/patients/:id/resend-invitation',
  invitationLimiter,
  async (req, res, next) => {
    try {
      const doctor =
        await prisma.doctor.findUniqueOrThrow({
          where: {
            userId: req.auth!.userId,
          },
        })

      const id = z.string().uuid()
        .safeParse(req.params.id)

      if (!id.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid patient ID',
        })
        return
      }

      const patient = await prisma.patient.findFirst({
        where: {
          id: id.data,
          doctorId: doctor.id,
        },

        include: {
          user: true,
        },
      })

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
        })
        return
      }

      if (
        patient.user.status !== 'PENDING' ||
        patient.user.passwordHash
      ) {
        res.status(409).json({
          success: false,
          message: 'Patient is not awaiting activation',
        })
        return
      }

      await sendPatientInvitation(patient.id)

      res.json({
        success: true,
        message: 'New invitation submitted to email service',
      })
    } catch (error) {
      next(error)
    }
  },
)

export default router