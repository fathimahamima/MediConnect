import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

export const doctorReportRoutes = Router()
export const patientReportRoutes = Router()

doctorReportRoutes.use(
  requireAuth,
  requireRole('DOCTOR')
)

patientReportRoutes.use(
  requireAuth,
  requireRole('PATIENT')
)

const dateSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
}).refine(data => {

  const from = new Date(data.from).getTime()
  const to = new Date(data.to).getTime()

  return (
    to > from &&
    to - from <= 31 * 24 * 60 * 60 * 1000
  )

}, {
  message: 'Select a valid date range of up to 31 days',
})

async function generateReport(
  patientId: string,
  from: Date,
  to: Date
) {

  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },

    select: {
      id: true,
      patientCode: true,

      user: {
        select: {
          fullName: true,
        },
      },

      doctor: {
        select: {
          specialization: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  })

  const [readings, alerts, medicationLogs] =
    await Promise.all([

      prisma.vitalReading.findMany({
        where: {
          patientId,
          recordedAt: {
            gte: from,
            lt: to,
          },
        },
        select: {
          id: true,
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

      prisma.alert.findMany({
        where: {
          patientId,
          createdAt: {
            gte: from,
            lt: to,
          },
        },
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 500,
      }),

      prisma.medicationLog.findMany({
        where: {
          medication: {
            patientId,
          },
          createdAt: {
            gte: from,
            lt: to,
          },
        },
        select: {
          id: true,
          taken: true,
          createdAt: true,
          medication: {
            select: {
              medicineName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 500,
      }),

    ])

  const truncated = readings.length > 50000

  const records = readings.slice(0, 50000)

  function summarize(values: (number | null)[]) {

    const valid = values.filter(
      (value): value is number =>
        value !== null && Number.isFinite(value)
    )

    if (!valid.length) {
      return {
        min: null,
        max: null,
        average: null,
        count: 0,
      }
    }

    return {
      min: Math.min(...valid),
      max: Math.max(...valid),

      average: Number(
        (
          valid.reduce((sum, value) => sum + value, 0) /
          valid.length
        ).toFixed(2)
      ),

      count: valid.length,
    }
  }

  return {
    success: true,

    patient,

    period: {
      from,
      to,
    },

    generatedAt: new Date(),

    truncated,

    summary: {

      totalReadings: records.length,

      heartRate: summarize(
        records.map(r =>
          r.signalQuality === 'GOOD'
            ? r.heartRate
            : null
        )
      ),

      spo2: summarize(
        records.map(r =>
          r.signalQuality === 'GOOD'
            ? r.spo2
            : null
        )
      ),

      temperature: summarize(
        records.map(r => r.temperature)
      ),
    },

    readings: records,
    alerts,
    medicationLogs,
  }
}

// DOCTOR REPORT

doctorReportRoutes.get(
  '/:patientId',
  async (req, res, next) => {
    try {

      const patientId = z.string().uuid()
        .safeParse(req.params.patientId)

      const dates = dateSchema.safeParse(req.query)

      if (!patientId.success || !dates.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid patient or date range',
        })
        return
      }

      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId.data,

          doctor: {
            userId: req.auth!.userId,
          },
        },
        select: { id: true },
      })

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
        })
        return
      }

      const report = await generateReport(
        patient.id,
        new Date(dates.data.from),
        new Date(dates.data.to)
      )

      res.setHeader('Cache-Control', 'no-store')
      res.json(report)

    } catch (error) {
      next(error)
    }
  }
)

// PATIENT REPORT

patientReportRoutes.get(
  '/',
  async (req, res, next) => {
    try {

      const dates = dateSchema.safeParse(req.query)

      if (!dates.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid date range',
        })
        return
      }

      const patient = await prisma.patient.findUnique({
        where: {
          userId: req.auth!.userId,
        },
        select: {
          id: true,
        },
      })

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
        })
        return
      }

      const report = await generateReport(
        patient.id,
        new Date(dates.data.from),
        new Date(dates.data.to)
      )

      res.setHeader('Cache-Control', 'no-store')
      res.json(report)

    } catch (error) {
      next(error)
    }
  }
)