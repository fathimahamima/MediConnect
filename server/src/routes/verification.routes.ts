import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'

import { prisma } from '../config/database.js'
import { hashToken } from '../auth/session.js'

import {
  sendDoctorVerificationEmail,
} from '../services/verification.service.js'

const router = Router()

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many requests. Please try again later.',
  },
})

// ==========================================
// VERIFY EMAIL
// ==========================================

router.post(
  '/verify-email',
  verificationLimiter,
  async (req, res, next) => {
    try {
      const parsed = z.object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
      }).safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid verification link',
        })
        return
      }

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
                    doctor: true,
                  },
                },
              },
            })

          if (
            !accountToken ||
            accountToken.type !== 'EMAIL_VERIFICATION' ||
            accountToken.usedAt ||
            accountToken.expiresAt <= new Date() ||
            accountToken.user.role !== 'DOCTOR' ||
            !accountToken.user.doctor
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

          const approval =
            accountToken.user.doctor.approval

          await tx.user.update({
            where: {
              id: accountToken.userId,
            },

            data: {
              emailVerified: true,

              ...(approval === 'APPROVED' &&
              accountToken.user.status === 'PENDING'
                ? { status: 'ACTIVE' as const }
                : {}),
            },
          })

          return {
            approval,
          }
        },
        {
          isolationLevel: 'Serializable',
        },
      )

      if (!result) {
        res.status(400).json({
          success: false,
          message:
            'This verification link is invalid, expired or already used.',
        })
        return
      }

      res.json({
        success: true,
        approval: result.approval,

        message:
          result.approval === 'APPROVED'
            ? 'Email verified successfully. Sign in to check your account access.'
            : 'Email verified successfully. Administrator approval is still required.',
      })
    } catch (error) {
      next(error)
    }
  },
)

// ==========================================
// RESEND VERIFICATION EMAIL
// ==========================================

router.post(
  '/resend-verification',
  resendLimiter,
  async (req, res, next) => {
    try {
      const parsed = z.object({
        email: z.string().trim().email().max(254),
      }).safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Enter a valid email address',
        })
        return
      }

      const email =
        parsed.data.email.toLowerCase()

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (
        user &&
        user.role === 'DOCTOR' &&
        !user.emailVerified
      ) {
        try {
          await sendDoctorVerificationEmail(user.id)
        } catch {
          console.error(
            'Verification resend failed'
          )
        }
      }

      res.json({
        success: true,
        message:
          'If an unverified doctor account exists, a verification email will be requested.',
      })
    } catch (error) {
      next(error)
    }
  },
)

export default router