import type { Server } from 'socket.io'

import { prisma } from '../config/database.js'

import {
  hashToken,
} from '../auth/session.js'

import {
  getLiveReading,
  type LiveReading,
} from '../services/live-reading.service.js'

import { z } from 'zod'

let socketServer: Server | null = null

function getCookie(
  header: string,
  name: string
) {
  for (const part of header.split(';')) {
    const item = part.trim()

    if (item.startsWith(`${name}=`)) {
      return item.slice(name.length + 1)
    }
  }

  return null
}

async function getSocketUser(
  token: string
) {

  const session =
    await prisma.session.findUnique({
      where: {
        tokenHash: hashToken(token),
      },

      include: {
        user: {
          include: {
            doctor: true,
            patient: true,
          },
        },
      },
    })

  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.user.status !== 'ACTIVE'
  ) {
    return null
  }

  if (
    session.user.role === 'DOCTOR' &&
    session.user.doctor?.approval !== 'APPROVED'
  ) {
    return null
  }

  return session.user
}

export function initializeRealtime(
  io: Server
) {

  socketServer = io

  io.use(async (socket, next) => {
    try {

      if (
        socket.handshake.headers.origin !==
        process.env.CLIENT_URL
      ) {
        next(new Error('Invalid origin'))
        return
      }

      const cookieName =
        process.env.COOKIE_NAME ||
        'mediconnect_session'

      const token = getCookie(
        socket.handshake.headers.cookie || '',
        cookieName
      )

      if (
        !token ||
        !/^[a-f0-9]{64}$/.test(token)
      ) {
        next(new Error('Unauthorized'))
        return
      }

      const user =
        await getSocketUser(token)

      if (!user) {
        next(new Error('Unauthorized'))
        return
      }

      socket.data.sessionToken = token
      socket.data.userId = user.id

      next()

    } catch {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', socket => {

    socket.on(
      'patient:subscribe',
      async (patientId, callback) => {

        const reply = (data: object) => {
          if (typeof callback === 'function') {
            callback(data)
          }
        }

        try {

          const parsed =
            z.string().uuid().safeParse(patientId)

          if (!parsed.success) {
            reply({ success: false })
            return
          }

          const user = await getSocketUser(
            socket.data.sessionToken
          )

          if (!user) {
            socket.disconnect(true)
            return
          }

          const patient =
            await prisma.patient.findFirst({
              where: {
                id: parsed.data,

                monitoringConsentAt: {
                  not: null,
                },

                user: {
                  status: 'ACTIVE',
                },

                OR: [
                  {
                    userId: user.id,
                  },
                  {
                    doctor: {
                      userId: user.id,
                    },
                  },
                ],
              },

              select: {
                id: true,

                assignments: {
                  where: {
                    unassignedAt: null,
                    device: {
                      status: 'ACTIVE',
                    },
                  },

                  take: 1,

                  select: {
                    id: true,
                  },
                },
              },
            })

          if (!patient?.assignments.length) {
            reply({
              success: false,
              message: 'Monitoring unavailable',
            })
            return
          }

          for (const room of socket.rooms) {
            if (room.startsWith('patient:')) {
              await socket.leave(room)
            }
          }

          await socket.join(
            `patient:${patient.id}`
          )

          const reading =
            getLiveReading(patient.id)

          if (
            reading &&
            reading.assignmentId ===
              patient.assignments[0].id
          ) {
            socket.emit(
              'vitals:update',
              reading
            )
          }

          reply({
            success: true,
          })

        } catch {

          reply({
            success: false,
            message: 'Subscription failed',
          })
        }
      }
    )

    socket.on('patient:unsubscribe', () => {

      for (const room of socket.rooms) {
        if (room.startsWith('patient:')) {
          void socket.leave(room)
        }
      }
    })
  })
}

// ====================================
// AUTHORIZED LIVE BROADCAST
// ====================================

export async function broadcastLiveReading(
  reading: LiveReading
) {

  if (!socketServer) return

  const room =
    `patient:${reading.patientId}`

  const sockets =
    await socketServer.in(room).fetchSockets()

  // Verify current consent and assignment

  const assignment =
    await prisma.deviceAssignment.findFirst({
      where: {
        id: reading.assignmentId,
        patientId: reading.patientId,
        deviceId: reading.deviceId,
        unassignedAt: null,

        device: {
          status: 'ACTIVE',
        },

        patient: {
          monitoringConsentAt: {
            not: null,
          },

          user: {
            status: 'ACTIVE',
          },
        },
      },

      include: {
        patient: {
          include: {
            doctor: true,
          },
        },
      },
    })

  if (!assignment) return

  for (const socket of sockets) {

    const user = await getSocketUser(
      socket.data.sessionToken
    )

    if (!user) {
      socket.disconnect(true)
      continue
    }

    const allowed =
      user.id === assignment.patient.userId ||
      (
        user.role === 'DOCTOR' &&
        user.doctor?.id ===
          assignment.patient.doctorId
      )

    if (!allowed) {
      await socket.leave(room)
      continue
    }

    socket.emit(
      'vitals:update',
      reading
    )
  }
}