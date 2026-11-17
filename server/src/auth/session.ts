import { randomBytes, createHash } from 'node:crypto'
import type { Response } from 'express'
import { prisma } from '../config/database.js'

export const COOKIE_NAME =
  process.env.COOKIE_NAME || 'mediconnect_session'

const SESSION_DAYS =
  Number(process.env.SESSION_DURATION_DAYS || 7)

export function hashToken(token: string) {
  return createHash('sha256')
    .update(token)
    .digest('hex')
}

export async function createSession(
  userId: string,
  res: Response,
) {
  const token = randomBytes(32).toString('hex')

  const expiresAt = new Date(
    Date.now() +
    SESSION_DAYS * 24 * 60 * 60 * 1000
  )

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  })

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function destroySession(
  token: string | undefined,
  res: Response,
) {
  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    })
  }

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}