import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../config/database.js'

import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('ADMIN'))

// Get registered doctors
router.get('/doctors', async (_req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
      take: 100,
    })

    res.json({
      success: true,
      doctors,
    })
  } catch (error) {
    next(error)
  }
})

// Approve or reject a doctor account
router.patch(
  '/doctors/:id/approval',
  async (req, res, next) => {
    try {
      const parsed = z.object({
        approval: z.enum(['APPROVED', 'REJECTED']),
      }).safeParse(req.body)

      const id = z.string().uuid()
        .safeParse(req.params.id)

      if (!parsed.success || !id.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid approval request',
        })
        return
      }

      const doctor = await prisma.doctor.findUnique({
        where: { id: id.data },
        include: { user: true },
      })

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: 'Doctor not found',
        })
        return
      }

      const approved =
        parsed.data.approval === 'APPROVED'

      await prisma.$transaction(async tx => {
        await tx.doctor.update({
          where: { id: doctor.id },
          data: {
            approval: parsed.data.approval,
            approvedAt: approved ? new Date() : null,
          },
        })

        await tx.user.update({
          where: { id: doctor.userId },
          data: {
            status: approved
              ? doctor.user.emailVerified
                ? 'ACTIVE'
                : 'PENDING'
              : 'SUSPENDED',
          },
        })

        if (!approved) {
          await tx.session.deleteMany({
            where: { userId: doctor.userId },
          })
        }
      })

      res.json({
        success: true,
        message: approved
          ? 'Doctor approved'
          : 'Doctor rejected',
      })
    } catch (error) {
      next(error)
    }
  },
)

export default router