import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler } from 'express'

import {
  prisma,
  connectDatabase,
  disconnectDatabase,
} from './config/database.js'
import verificationRoutes from './routes/verification.routes.js'
import doctorRoutes from './routes/doctor.routes.js'
import activationRoutes from './routes/activation.routes.js'
import patientRoutes from './routes/patient.routes.js'
import adminDeviceRoutes from './routes/admin-device.routes.js'
import doctorDeviceRoutes from './routes/doctor-device.routes.js'
import deviceRoutes from './routes/device.routes.js'
import {
  initializeRealtime,
} from './realtime/socket.js'
import recoveryRoutes from './routes/recovery.routes.js'
import {
  doctorMedicationRoutes,
  patientMedicationRoutes,
} from './routes/medication.routes.js'
import {
  doctorAlertRoutes,
  patientAlertRoutes,
} from './routes/alert.routes.js'
import {
  startNotificationWorker,
  stopNotificationWorker,
} from './workers/notification.worker.js'
import {
  doctorReportRoutes,
  patientReportRoutes,
} from './routes/report.routes.js'
import {
  doctorSummaryRoutes,
  patientSummaryRoutes,
} from './routes/summary.routes.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const app = express()
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

const PORT = Number(process.env.PORT || 5000)

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173'

const httpServer = createServer(app)

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
              ],
              imgSrc: [
                "'self'",
                'data:',
                'blob:',
              ],
              fontSrc: [
                "'self'",
                'data:',
              ],
              connectSrc: [
                "'self'",
              ],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
  })
)

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
)
const errorHandler: ErrorRequestHandler =
  (error, _req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      res.status(409).json({
        success: false,
        message: 'A record with these details already exists',
      })
      return
    }

    console.error('API error:', error?.code || error?.name)

    res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred',
    })
  }

app.use(errorHandler)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/api/device', deviceRoutes)
// Protect browser state-changing requests
app.use((req, res, next) => {
  const unsafeMethods = [
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
  ]

  if (
    unsafeMethods.includes(req.method) &&
    req.path.startsWith('/api/')
  ) {
    const origin = req.get('origin')

    if (origin !== CLIENT_URL) {
      res.status(403).json({
        success: false,
        message: 'Request origin not allowed',
      })
      return
    }
  }

  next()
})
// Real-time communication foundation
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
})

// Block socket connections until we implement
// authenticated, role-based access.
initializeRealtime(io)

// API health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      success: true,
      application: 'MediConnect',
      status: 'online',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(503).json({
      success: false,
      application: 'MediConnect',
      status: 'degraded',
      database: 'disconnected',
    })
  }
})

// API home
// API home (development only)
if (process.env.NODE_ENV !== 'production') {

  app.get('/', (_req, res) => {

    res.json({
      success: true,
      message: 'Welcome to MediConnect API',
    })

  })
}
app.use('/api/auth', authRoutes)
app.use('/api/auth', verificationRoutes)
app.use('/api/auth', activationRoutes)

app.use('/api/admin', adminRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/patient', patientRoutes)
app.use('/api/admin/devices', adminDeviceRoutes)

app.use('/api/doctor/devices', doctorDeviceRoutes)
app.use('/api/doctor/recovery', recoveryRoutes)
app.use(
  '/api/doctor/medications',
  doctorMedicationRoutes
)

app.use(
  '/api/patient/medications',
  patientMedicationRoutes
)
app.use('/api/doctor/alerts', doctorAlertRoutes)

app.use('/api/patient/alerts', patientAlertRoutes)
app.use(
  '/api/doctor/reports',
  doctorReportRoutes
)

app.use(
  '/api/patient/reports',
  patientReportRoutes
)
app.use(
  '/api/doctor/summaries',
  doctorSummaryRoutes
)

app.use(
  '/api/patient/summaries',
  patientSummaryRoutes
)
// PRODUCTION FRONTEND

if (process.env.NODE_ENV === 'production') {

  const currentDirectory = path.dirname(
    fileURLToPath(import.meta.url)
  )

  const clientDist = path.resolve(
    currentDirectory,
    '../../client/dist'
  )

  app.use(express.static(clientDist))

  app.use((req, res, next) => {

    if (
      req.method !== 'GET' ||
      req.path === '/api' ||
      req.path.startsWith('/api/') ||
      req.path.startsWith('/socket.io/') ||
      path.extname(req.path)
    ) {
      next()
      return
    }

    res.sendFile(
      path.join(clientDist, 'index.html')
    )
  })
}
// Unknown routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  })
})

// Start server
async function startServer() {
  try {
    await connectDatabase()
    startNotificationWorker()

    httpServer.listen(PORT,'0.0.0.0', () => {
      console.log('')
      console.log('================================')
      console.log('     MEDICONNECT BACKEND')
      console.log('================================')
      console.log(`Server: http://localhost:${PORT}`)
      console.log('Database: Connected')
      console.log('Status: Online')
      console.log('================================')
    })
  } catch (error) {
    console.error('Startup failed:', error)
    await disconnectDatabase()
    process.exit(1)
  }
}

startServer()

function shutdown() {
  stopNotificationWorker()
  io.close()

  httpServer.close(async () => {
    await disconnectDatabase()
    process.exit(0)
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)