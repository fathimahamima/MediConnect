import type {
  Request,
  Response,
  NextFunction,
} from 'express'

import type { Role } from '@prisma/client'

import { prisma } from '../config/database.js'

import {
  COOKIE_NAME,
  hashToken,
} from '../auth/session.js'

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        role: Role
      }
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[COOKIE_NAME]

    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/.test(token)
    ) {
      res.status(401).json({
        success: false,
        message: 'Please sign in',
      })
      return
    }

    const session = await prisma.session.findUnique({
      where: {
        tokenHash: hashToken(token),
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
      !session ||
      session.expiresAt <= new Date() ||
      session.user.status !== 'ACTIVE' ||
      (
        session.user.role === 'DOCTOR' &&
        session.user.doctor?.approval !== 'APPROVED'
      )
    ) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      })
      return
    }

    req.auth = {
      userId: session.userId,
      role: session.user.role,
    }

    next()
  } catch (error) {
    next(error)
  }
}

export function requireRole(...roles: Role[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (
      !req.auth ||
      !roles.includes(req.auth.role)
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      })
      return
    }

    next()
  }
}