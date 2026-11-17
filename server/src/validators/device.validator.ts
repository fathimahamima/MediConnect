import { z } from 'zod'

export const registerDeviceSchema = z.object({
  deviceName: z.string()
    .trim()
    .min(3)
    .max(100),

  firmwareVersion: z.string()
    .trim()
    .max(50)
    .optional(),
})

export const assignDeviceSchema = z.object({
  patientId: z.string().uuid(),
  deviceId: z.string().uuid(),
})

export const deviceIdSchema = z.string().uuid()