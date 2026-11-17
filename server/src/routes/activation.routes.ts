import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'

import { prisma } from '../config/database.js'
import { hashToken } from '../auth/session.js'

const router = Router()

const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
})

const activationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),

  password: z.string()
    .min(8)
    .max(72)
    .refine(value =>
      Buffer.byteLength(value, 'utf8') <= 72
    )
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
})

// ==========================================
// VALIDATE ACTIVATION LINK
// ==========================================

router.post(
  '/patient-invitation',
  activationLimiter,
  async (req, res, next) => {
    try {
      const parsed = z.object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
      }).safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid invitation link',
        })
        return
      }

      const record = await prisma.accountToken.findUnique({
        where: {
          tokenHash: hashToken(parsed.data.token),
        },

        include: {
          user: {
            include: {
              patient: true,
            },
          },
        },
      })

      if (
        !record ||
        record.type !== 'PATIENT_ACTIVATION' ||
        record.usedAt ||
        record.expiresAt <= new Date() ||
        record.user.role !== 'PATIENT' ||
        record.user.status !== 'PENDING' ||
        record.user.passwordHash ||
        !record.user.patient
      ) {
        res.status(400).json({
          success: false,
          message: 'Invitation is invalid or expired',
        })
        return
      }

      res.json({
        success: true,

        patient: {
          fullName: record.user.fullName,
          patientCode: record.user.patient.patientCode,
        },
      })
    } catch (error) {
      next(error)
    }
  },
)

// ==========================================
// ACTIVATE PATIENT AND CREATE PASSWORD
// ==========================================

router.post(
  '/activate-patient',
  activationLimiter,
  async (req, res, next) => {
    try {
      const parsed = activationSchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid link or password requirements not met',
        })
        return
      }

      const passwordHash = await bcrypt.hash(
        parsed.data.password,
        12,
      )

      const result = await prisma.$transaction(
        async tx => {
          const accountToken =
            await tx.accountToken.findUnique({
              where: {
                tokenHash: hashToken(parsed.data.token),
              },

              include: {
                user: {
                  include: {
                    patient: true,
                  },
                },
              },
            })

          if (
            !accountToken ||
            accountToken.type !== 'PATIENT_ACTIVATION' ||
            accountToken.usedAt ||
            accountToken.expiresAt <= new Date() ||
            accountToken.user.role !== 'PATIENT' ||
            accountToken.user.status !== 'PENDING' ||
            accountToken.user.passwordHash ||
            !accountToken.user.patient
          ) {
            return null
          }

          const consumed =
            await tx.accountToken.updateMany({
              where: {
                id: accountToken.id,
                usedAt: null,

                expiresAt: {
                  gt: new Date(),
                },
              },

              data: {
                usedAt: new Date(),
              },
            })

          if (consumed.count !== 1) {
            return null
          }

          await tx.user.update({
            where: {
              id: accountToken.userId,
            },

            data: {
              passwordHash,
              emailVerified: true,
              status: 'ACTIVE',
            },
          })

          await tx.accountToken.updateMany({
            where: {
              userId: accountToken.userId,
              type: 'PATIENT_ACTIVATION',
              usedAt: null,
            },

            data: {
              usedAt: new Date(),
            },
          })

          return {
            patientCode:
              accountToken.user.patient.patientCode,
          }
        },

        {
          isolationLevel: 'Serializable',
        },
      )

      if (!result) {
        res.status(400).json({
          success: false,
          message: 'Invitation is invalid, expired or already used',
        })
        return
      }

      res.json({
        success: true,
        message: 'Patient account activated successfully',
        patientCode: result.patientCode,
      })
    } catch (error) {
      next(error)
    }
  },
)

export default router