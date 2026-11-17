import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'

import { prisma } from '../config/database.js'

import {
  doctorRegistrationSchema,
  loginSchema,
} from '../validators/auth.validator.js'

import {
  createSession,
  destroySession,
  COOKIE_NAME,
} from '../auth/session.js'

import { requireAuth } from '../middleware/auth.js'
import {
  sendDoctorVerificationEmail,
} from '../services/verification.service.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Try again later.',
  },
})

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts.',
  },
})

const dummyHash = bcrypt.hashSync(
  'unused-authentication-placeholder',
  12,
)

// ==========================================
// DOCTOR REGISTRATION
// ==========================================

router.post(
  '/register/doctor',
  registrationLimiter,
  async (req, res, next) => {
    try {
      const parsed =
        doctorRegistrationSchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message:
            parsed.error.issues[0]?.message ||
            'Invalid registration details',
        })
        return
      }

      const data = parsed.data

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      const existingDoctor = await prisma.doctor.findUnique({
        where: {
          registrationNumber: data.registrationNumber,
        },
      })

      if (existingUser || existingDoctor) {
        res.status(409).json({
          success: false,
          message: 'An account with these details already exists',
        })
        return
      }

      const passwordHash = await bcrypt.hash(
        data.password,
        12,
      )

      const user = await prisma.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: 'DOCTOR',
          status: 'PENDING',

          doctor: {
            create: {
              specialization: data.specialization,
              registrationNumber: data.registrationNumber,
              qualification: data.qualification,
              hospital: data.hospital || null,
              approval: 'PENDING',
            },
          },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
        },
      })

      let verificationEmailSent = false

try {
  await sendDoctorVerificationEmail(user.id)
  verificationEmailSent = true
} catch {
  console.error(
    'Doctor verification email could not be sent'
  )
}

res.status(201).json({
  success: true,

  message: verificationEmailSent
    ? 'Account created. Check your inbox for the verification email.'
    : 'Account created, but the verification email could not be sent. Please request another email.',

  verificationEmailSent,

  user,
})
    } catch (error) {
      next(error)
    }
  },
)

// ==========================================
// LOGIN FOR ALL THREE ROLES
// ==========================================

router.post(
  '/login',
  loginLimiter,
  async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Enter valid login details',
        })
        return
      }

      const {
        identifier,
        password,
        role,
      } = parsed.data

      const user = role === 'PATIENT'
        ? (
            await prisma.patient.findUnique({
              where: {
                patientCode: identifier.toUpperCase(),
              },
              include: {
                user: {
                  include: {
                    doctor: true,
                  },
                },
              },
            })
          )?.user
        : await prisma.user.findUnique({
            where: {
              email: identifier.toLowerCase(),
            },
            include: {
              doctor: true,
            },
          })

      const passwordValid = await bcrypt.compare(
        password,
        user?.passwordHash || dummyHash,
      )
      

      if (
        !user ||
        !user.passwordHash ||
        user.role !== role ||
        !passwordValid
      ) {
        res.status(401).json({
          success: false,
          message: 'Invalid login credentials',
        })
        return
      }

      if (
        user.role === 'DOCTOR' &&
        user.doctor?.approval !== 'APPROVED'
      ) {
        res.status(403).json({
          success: false,
          message:
            'Your doctor account has not been approved',
        })
        return
      }

      if (
        user.role === 'DOCTOR' &&
        !user.emailVerified
      ) {
        res.status(403).json({
          success: false,
          message: 'Email verification is required',
        })
        return
      }

      if (user.status !== 'ACTIVE') {
        res.status(403).json({
          success: false,
          message: 'Your account is not active',
        })
        return
      }

      await destroySession(
        req.cookies?.[COOKIE_NAME],
        res,
      )

      await createSession(user.id, res)

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      })
    } catch (error) {
      next(error)
    }
  },
)

// ==========================================
// GET CURRENT LOGGED-IN USER
// ==========================================

router.get(
  '/me',
  requireAuth,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.auth!.userId,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,

          doctor: {
            select: {
              id: true,
              specialization: true,
              qualification: true,
              approval: true,
            },
          },

          patient: {
            select: {
              id: true,
              patientCode: true,
            },
          },
        },
      })

      res.json({
        success: true,
        user,
      })
    } catch (error) {
      next(error)
    }
  },
)

// ==========================================
// LOGOUT
// ==========================================

router.post('/logout', async (req, res, next) => {
  try {
    await destroySession(
      req.cookies?.[COOKIE_NAME],
      res,
    )

    res.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
})

export default router