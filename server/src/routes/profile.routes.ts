import { Router } from 'express'
import { prisma } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {

  const user = await prisma.user.findUnique({

    where: {
      id: req.auth!.userId,
    },

    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,

      doctor: {
        select: {
          specialization: true,
          registrationNumber: true,
          qualification: true,
          hospital: true,
          approval: true,
        },
      },

      patient: {
        select: {
          patientCode: true,
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          monitoringConsentAt: true,

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
      },
    },
  })

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found',
    })
  }

  res.setHeader('Cache-Control', 'no-store')

  return res.json({
    success: true,
    profile: user,
  })
})

export default router