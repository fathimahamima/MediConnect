import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

const router = Router()

router.use(
  requireAuth,
  requireRole('PATIENT'),
)

// ==========================================
// PATIENT OVERVIEW
// ==========================================

router.get('/overview', async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.auth!.userId,
      },

      select: {
        id: true,
        patientCode: true,
        gender: true,
        bloodGroup: true,
        dateOfBirth: true,
        monitoringConsentAt: true,
        createdAt: true,

        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            status: true,
          },
        },

        doctor: {
          select: {
            id: true,
            specialization: true,
            qualification: true,
            hospital: true,

            user: {
              select: {
                fullName: true,
              },
            },
          },
        },

        emergencyContacts: {
          select: {
            id: true,
            fullName: true,
            relationship: true,
            phone: true,
            email: true,
            isPrimary: true,
            consentAt: true,
          },
        },

        assignments: {
          where: {
            unassignedAt: null,
          },

          take: 1,

          select: {
            id: true,
            assignedAt: true,

            device: {
              select: {
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
        message: 'Patient profile not found',
      })
      return
    }

    const [
      latestReading,
      recoveryPlans,
      medications,
      openAlerts,
      recentAlerts,
    ] = await Promise.all([
      prisma.vitalReading.findFirst({
        where: {
          patientId: patient.id,
        },

        orderBy: {
          recordedAt: 'desc',
        },

        select: {
          heartRate: true,
          spo2: true,
          temperature: true,
          signalQuality: true,
          recordedAt: true,
          isAggregated: true,
        },
      }),

      prisma.recoveryPlan.findMany({
        where: {
          patientId: patient.id,
          isActive: true,
        },

        select: {
          id: true,
          title: true,
          description: true,
          expectedOutcome: true,
          status: true,
          startDate: true,
          endDate: true,
          heartRateMin: true,
          heartRateMax: true,
          spo2Min: true,
          spo2Max: true,
          temperatureMin: true,
          temperatureMax: true,
        },

        take: 10,
        orderBy: { createdAt: 'desc' },
      }),

      prisma.medication.findMany({
        where: {
          patientId: patient.id,
          isActive: true,
        },

        select: {
          id: true,
          medicineName: true,
          dosage: true,
          frequency: true,
          instructions: true,
          startDate: true,
          endDate: true,
        },

        take: 20,
        orderBy: { createdAt: 'desc' },
      }),

      prisma.alert.count({
        where: {
          patientId: patient.id,
          status: 'OPEN',
        },
      }),

      prisma.alert.findMany({
        where: {
          patientId: patient.id,
        },

        orderBy: {
          createdAt: 'desc',
        },

        take: 5,

        select: {
          id: true,
          title: true,
          message: true,
          severity: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    res.json({
      success: true,
      patient,
      latestReading,
      recoveryPlans,
      medications,
      openAlerts,
      recentAlerts,
    })

  } catch (error) {
    next(error)
  }
})

// ==========================================
// UPDATE MONITORING CONSENT
// ==========================================

router.patch(
  '/monitoring-consent',
  async (req, res, next) => {
    try {
      const parsed = z.object({
        consent: z.boolean(),
      }).safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid consent request',
        })
        return
      }

      const patient =
        await prisma.$transaction(
          async tx => {
            const existing =
              await tx.patient.findUniqueOrThrow({
                where: {
                  userId: req.auth!.userId,
                },
              })

            if (!parsed.data.consent) {
              await tx.deviceAssignment.updateMany({
                where: {
                  patientId: existing.id,
                  unassignedAt: null,
                },

                data: {
                  unassignedAt: new Date(),
                },
              })
            }

            return tx.patient.update({
              where: {
                id: existing.id,
              },

              data: {
                monitoringConsentAt:
                  parsed.data.consent
                    ? existing.monitoringConsentAt ||
                      new Date()
                    : null,
              },

              select: {
                monitoringConsentAt: true,
              },
            })
          },
          {
            isolationLevel: 'Serializable',
          },
        )

      res.json({
        success: true,

        monitoringConsentAt:
          patient.monitoringConsentAt,

        message: parsed.data.consent
          ? 'Monitoring consent recorded'
          : 'Monitoring consent withdrawn and active device assignments ended',
      })

    } catch (error) {
      next(error)
    }
  },
)

export default router