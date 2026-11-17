import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

export const doctorMedicationRoutes = Router()
export const patientMedicationRoutes = Router()

doctorMedicationRoutes.use(
  requireAuth,
  requireRole('DOCTOR')
)

patientMedicationRoutes.use(
  requireAuth,
  requireRole('PATIENT')
)

const medicationSchema = z.object({
  patientId: z.string().uuid(),
  medicineName: z.string().trim().min(2).max(150),
  dosage: z.string().trim().min(1).max(100),
  frequency: z.string().trim().min(1).max(150),
  instructions: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
}).refine(data =>
  !data.endDate ||
  new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'Invalid medication dates',
  }
)

const logSchema = z.object({
  taken: z.boolean(),
  responseNotes: z.string().max(2000).optional(),
  sideEffects: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
})

// DOCTOR: GET MEDICATIONS

doctorMedicationRoutes.get('/', async (req, res, next) => {
  try {
    const medications = await prisma.medication.findMany({
      where: {
        doctor: {
          userId: req.auth!.userId,
        },
        patient: {
          doctor: {
            userId: req.auth!.userId,
          },
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            user: {
              select: { fullName: true },
            },
          },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({
      success: true,
      medications,
    })
  } catch (error) {
    next(error)
  }
})

// DOCTOR: ADD MEDICATION

doctorMedicationRoutes.post('/', async (req, res, next) => {
  try {
    const parsed = medicationSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid medication details',
      })
      return
    }

    const data = parsed.data

    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: {
        userId: req.auth!.userId,
      },
    })

    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        doctorId: doctor.id,
        user: { status: 'ACTIVE' },
      },
    })

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient unavailable',
      })
      return
    }

    const medication = await prisma.medication.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        medicineName: data.medicineName,
        dosage: data.dosage,
        frequency: data.frequency,
        instructions: data.instructions,
        startDate: new Date(data.startDate),
        endDate: data.endDate
          ? new Date(data.endDate)
          : null,
        isActive: true,
      },
    })

    res.status(201).json({
      success: true,
      medication,
      message: 'Medication added successfully',
    })
  } catch (error) {
    next(error)
  }
})

// DOCTOR: DISCONTINUE MEDICATION RECORD

doctorMedicationRoutes.patch(
  '/:id/deactivate',
  async (req, res, next) => {
    try {
      const result = await prisma.medication.updateMany({
        where: {
          id: String(req.params.id),
          doctor: {
            userId: req.auth!.userId,
          },
          patient: {
            doctor: {
              userId: req.auth!.userId,
            },
          },
        },
        data: { isActive: false },
      })

      if (!result.count) {
        res.status(404).json({
          success: false,
          message: 'Medication not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Medication record deactivated',
      })
    } catch (error) {
      next(error)
    }
  }
)

// PATIENT: VIEW MEDICATIONS

patientMedicationRoutes.get('/', async (req, res, next) => {
  try {
    const medications = await prisma.medication.findMany({
      where: {
        patient: {
          userId: req.auth!.userId,
        },
      },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({
      success: true,
      medications,
    })
  } catch (error) {
    next(error)
  }
})

// PATIENT: RECORD MEDICATION RESPONSE

patientMedicationRoutes.post(
  '/:id/logs',
  async (req, res, next) => {
    try {
      const parsed = logSchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid medication log',
        })
        return
      }

      const now = new Date()

      const medication = await prisma.medication.findFirst({
        where: {
          id: String(req.params.id),
          isActive: true,
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
          patient: {
            userId: req.auth!.userId,
          },
        },
      })

      if (!medication) {
        res.status(404).json({
          success: false,
          message: 'Active medication not found',
        })
        return
      }

      const data = parsed.data

      const log = await prisma.medicationLog.create({
        data: {
          medicationId: medication.id,
          taken: data.taken,
          takenAt: data.taken ? now : null,
          scheduledAt: data.scheduledAt
            ? new Date(data.scheduledAt)
            : null,
          responseNotes: data.responseNotes,
          sideEffects: data.sideEffects,
        },
      })

      res.status(201).json({
        success: true,
        log,
        message: 'Medication response recorded',
      })
    } catch (error) {
      next(error)
    }
  }
)