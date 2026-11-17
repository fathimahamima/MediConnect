import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('DOCTOR'))

const schema = z.object({
  patientId: z.string().uuid(),
  title: z.string().trim().min(3).max(100),
  description: z.string().max(2000).optional(),
  expectedOutcome: z.string().max(2000).optional(),
  clinicalNotes: z.string().max(2000).optional(),

  heartRateMin: z.number().min(30).max(220),
  heartRateMax: z.number().min(30).max(220),

  spo2Min: z.number().min(1).max(100),
  spo2Max: z.number().min(1).max(100),

  temperatureMin: z.number().min(-55).max(125),
  temperatureMax: z.number().min(-55).max(125),

  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
}).refine(data =>
  data.heartRateMin <= data.heartRateMax &&
  data.spo2Min <= data.spo2Max &&
  data.temperatureMin <= data.temperatureMax &&
  (
    !data.endDate ||
    new Date(data.endDate) > new Date(data.startDate)
  ),
  {
    message: 'Invalid target ranges or dates',
  }
)

// GET RECOVERY PLANS

router.get('/', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: { userId: req.auth!.userId },
    })

    const plans = await prisma.recoveryPlan.findMany({
      where: {
        doctorId: doctor.id,
        patient: { doctorId: doctor.id },
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
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ success: true, plans })
  } catch (error) {
    next(error)
  }
})

// CREATE RECOVERY PLAN

router.post('/', async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Check recovery plan details and target ranges',
      })
      return
    }

    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: { userId: req.auth!.userId },
    })

    const data = parsed.data

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

    const plan = await prisma.$transaction(
      async tx => {
        await tx.recoveryPlan.updateMany({
          where: {
            patientId: patient.id,
            isActive: true,
          },
          data: { isActive: false },
        })

        return tx.recoveryPlan.create({
          data: {
            ...data,
            doctorId: doctor.id,
            startDate: new Date(data.startDate),
            endDate: data.endDate
              ? new Date(data.endDate)
              : null,
            status: 'NOT_EVALUATED',
            isActive: true,
          },
        })
      },
      { isolationLevel: 'Serializable' }
    )

    res.status(201).json({
      success: true,
      message: 'Recovery plan created',
      plan,
    })
  } catch (error) {
    next(error)
  }
})

// DEACTIVATE RECOVERY PLAN

router.patch('/:id/deactivate', async (req, res, next) => {
  try {
    const result = await prisma.recoveryPlan.updateMany({
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
        message: 'Recovery plan not found',
      })
      return
    }

    res.json({
      success: true,
      message: 'Recovery plan deactivated',
    })
  } catch (error) {
    next(error)
  }
})

export default router