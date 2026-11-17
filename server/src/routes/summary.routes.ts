import { Router } from 'express'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'

import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

import {
  generateAISummary,
} from '../services/gemini.service.js'

export const doctorSummaryRoutes = Router()
export const patientSummaryRoutes = Router()

doctorSummaryRoutes.use(
  requireAuth,
  requireRole('DOCTOR')
)

patientSummaryRoutes.use(
  requireAuth,
  requireRole('PATIENT')
)

const generateSchema = z.object({
  patientId: z.string().uuid(),
  days: z.number().int().min(1).max(30),
})

function summarize(values: (number | null)[]) {

  const valid = values.filter(
    (v): v is number =>
      v !== null && Number.isFinite(v)
  )

  if (!valid.length) {

    return {
      count: 0,
      minimum: null,
      maximum: null,
      average: null,
    }
  }

  return {
    count: valid.length,
    minimum: Math.min(...valid),
    maximum: Math.max(...valid),

    average: Number(
      (
        valid.reduce((sum, v) => sum + v, 0) /
        valid.length
      ).toFixed(2)
    ),
  }
}

// DOCTOR: LIST SUMMARIES

doctorSummaryRoutes.get('/', async (req, res, next) => {

  try {

    const summaries = await prisma.healthSummary.findMany({

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

    res.setHeader('Cache-Control', 'no-store')

    res.json({
      success: true,
      summaries,
    })

  } catch (error) {
    next(error)
  }
})

// DOCTOR: GENERATE AI DRAFT

doctorSummaryRoutes.post(

  '/generate',

  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    message: {
      success: false,
      message: 'AI generation limit reached. Try later.',
    },
  }),

  async (req, res, next) => {

    try {

      const parsed = generateSchema.safeParse(req.body)

      if (!parsed.success) {

        res.status(400).json({
          success: false,
          message: 'Invalid patient or reporting period',
        })

        return
      }

      const { patientId, days } = parsed.data

      const allowedIds =
        (process.env.AI_DEMO_PATIENT_IDS || '')
          .split(',')
          .map(id => id.trim())
          .filter(Boolean)

      if (
        process.env.AI_SUMMARY_ENABLED !== 'true' ||
        process.env.AI_DEMO_ONLY !== 'true' ||
        !allowedIds.includes(patientId)
      ) {

        res.status(403).json({
          success: false,
          message:
            'AI summaries are currently restricted to authorized fictional demo accounts.',
        })

        return
      }

      const patient = await prisma.patient.findFirst({

        where: {
          id: patientId,

          doctor: {
            userId: req.auth!.userId,
          },
        },

        select: {
          id: true,
          doctorId: true,
        },
      })

      if (!patient) {

        res.status(404).json({
          success: false,
          message: 'Patient not found',
        })

        return
      }

      const end = new Date()

      const start = new Date(
        end.getTime() - days * 86400000
      )

      const dateRange = {
        gte: start,
        lte: end,
      }

      const [
        readings,
        plans,
        alerts,
        medicationLogs,
      ] = await Promise.all([

        prisma.vitalReading.findMany({

          where: {
            patientId,
            recordedAt: dateRange,
          },

          select: {
            heartRate: true,
            spo2: true,
            temperature: true,
            signalQuality: true,
            recordedAt: true,
          },

          orderBy: {
            recordedAt: 'asc',
          },

          take: 50001,
        }),

        prisma.recoveryPlan.findMany({

          where: {
            patientId,

            isActive: true,

            startDate: { lte: end },

            OR: [
              { endDate: null },
              { endDate: { gte: start } },
            ],
          },

          select: {
            heartRateMin: true,
            heartRateMax: true,
            spo2Min: true,
            spo2Max: true,
            temperatureMin: true,
            temperatureMax: true,
            startDate: true,
            endDate: true,
          },

          take: 2,
        }),

        prisma.alert.groupBy({

          by: ['severity'],

          where: {
            patientId,
            createdAt: dateRange,
          },

          _count: {
            _all: true,
          },
        }),

        prisma.medicationLog.groupBy({

          by: ['taken'],

          where: {
            medication: {
              patientId,
            },
            createdAt: dateRange,
          },

          _count: {
            _all: true,
          },
        }),

      ])

      if (!readings.length) {

        res.status(400).json({
          success: false,
          message:
            'No stored readings found for this period.',
        })

        return
      }

      if (readings.length > 50000) {

        res.status(400).json({
          success: false,
          message: 'Select a shorter reporting period',
        })

        return
      }

      const validOptical = readings.filter(
        r => r.signalQuality === 'GOOD'
      )

      const statistics = {

        reportingPeriodDays: days,

        storedSnapshots: readings.length,

        goodOpticalSnapshots: validOptical.length,

        heartRateBPM: summarize(
          validOptical.map(r => r.heartRate)
        ),

        oxygenSaturationPercent: summarize(
          validOptical.map(r => r.spo2)
        ),

        sensorTemperatureCelsius: summarize(
          readings.map(r => r.temperature)
        ),

        activeTargetComparisons: plans.map(plan => {

          const applicable = readings.filter(r =>
            r.recordedAt >= plan.startDate &&
            (!plan.endDate || r.recordedAt <= plan.endDate)
          )

          function compare(
            values: (number | null)[],
            min: number | null,
            max: number | null
          ) {

            const valid = values.filter(
              (v): v is number =>
                v !== null && Number.isFinite(v)
            )

            const evaluable =
              min !== null && max !== null

            return {
              minimumTarget: min,
              maximumTarget: max,
              validSamples: valid.length,

              outsideTarget: evaluable
                ? valid.filter(
                    v => v < min! || v > max!
                  ).length
                : null,
            }
          }

          return {

            heartRate: compare(
              applicable.map(r =>
                r.signalQuality === 'GOOD'
                  ? r.heartRate
                  : null
              ),
              plan.heartRateMin,
              plan.heartRateMax
            ),

            spo2: compare(
              applicable.map(r =>
                r.signalQuality === 'GOOD'
                  ? r.spo2
                  : null
              ),
              plan.spo2Min,
              plan.spo2Max
            ),

            temperature: compare(
              applicable.map(r => r.temperature),
              plan.temperatureMin,
              plan.temperatureMax
            ),
          }
        }),

        healthAlerts: alerts.map(alert => ({
          severity: alert.severity,
          count: alert._count._all,
        })),

        medicationIntake: {

          taken: medicationLogs.find(
            log => log.taken
          )?._count._all || 0,

          notTaken: medicationLogs.find(
            log => !log.taken
          )?._count._all || 0,
        },
      }

      // No names, IDs, emails or clinical notes
      // are submitted to Gemini.

      let aiResult

      try {

        aiResult = await generateAISummary(statistics)

      } catch {

        res.status(502).json({
          success: false,
          message:
            'AI generation failed. Check Gemini configuration or quota.',
        })

        return
      }

      const stillAuthorized =
        await prisma.patient.findFirst({

          where: {
            id: patientId,

            doctor: {
              userId: req.auth!.userId,
            },
          },

          select: { id: true, doctorId: true },
        })

      if (!stillAuthorized) {

        res.status(403).json({
          success: false,
          message: 'Patient access changed',
        })

        return
      }

      const summary = await prisma.healthSummary.create({

        data: {
          patientId,
          doctorId: stillAuthorized.doctorId,
          periodStart: start,
          periodEnd: end,
          content: aiResult.content,
          aiModel: aiResult.model,
          status: 'DRAFT',
        },
      })

      res.status(201).json({
        success: true,
        summary,
        message: 'AI draft generated successfully',
      })

    } catch (error) {
      next(error)
    }
  }
)

// DOCTOR: REVIEW AI SUMMARY

doctorSummaryRoutes.patch(
  '/:id/review',
  async (req, res, next) => {

    try {

      const id = z.string().uuid()
        .safeParse(req.params.id)

      const parsed = z.object({

        decision: z.enum([
          'APPROVED',
          'REJECTED',
        ]),

        content: z.string()
          .trim()
          .min(10)
          .max(10000),

        reviewNotes: z.string()
          .trim()
          .min(3)
          .max(2000),

      }).safeParse(req.body)

      if (!id.success || !parsed.success) {

        res.status(400).json({
          success: false,
          message: 'Invalid review information',
        })

        return
      }

      const result = await prisma.healthSummary.updateMany({

        where: {

          id: id.data,

          status: 'DRAFT',

          doctor: {
            userId: req.auth!.userId,
          },

          patient: {
            doctor: {
              userId: req.auth!.userId,
            },
          },
        },

        data: {

          status: parsed.data.decision,

          content: parsed.data.content,

          reviewNotes: parsed.data.reviewNotes,

          reviewedAt: new Date(),
        },
      })

      if (!result.count) {

        res.status(404).json({
          success: false,
          message: 'Reviewable summary not found',
        })

        return
      }

      res.json({
        success: true,
        message: 'Summary reviewed successfully',
      })

    } catch (error) {
      next(error)
    }
  }
)

// PATIENT: VIEW APPROVED SUMMARIES ONLY

patientSummaryRoutes.get('/', async (req, res, next) => {

  try {

    const summaries = await prisma.healthSummary.findMany({

      where: {

        status: 'APPROVED',

        patient: {
          userId: req.auth!.userId,
        },
      },

      select: {
        id: true,
        content: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        createdAt: true,
        reviewedAt: true,
        aiModel: true,
      },

      orderBy: { createdAt: 'desc' },

      take: 100,
    })

    res.setHeader('Cache-Control', 'no-store')

    res.json({
      success: true,
      summaries,
    })

  } catch (error) {
    next(error)
  }
})