import { z } from 'zod'

export const doctorRegistrationSchema = z.object({
  fullName: z.string().trim().min(3).max(100),

  email: z.string().trim().email().max(254)
    .transform(value => value.toLowerCase()),

  phone: z.string().trim()
    .regex(/^\+[1-9]\d{7,14}$/, {
      message: 'Enter a valid phone number with country code',
    }),

  password: z.string()
    .min(8, 'Password must contain at least 8 characters')
    .max(72)
    .refine(value => Buffer.byteLength(value, 'utf8') <= 72, {
      message: 'Password is too long',
    })
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/[^A-Za-z0-9]/, 'Include a special character'),

  specialization: z.string().trim().min(2).max(100),

  registrationNumber: z.string().trim().min(3).max(100)
    .transform(value => value.toUpperCase()),

  qualification: z.string().trim().min(2).max(100),

  hospital: z.string().trim().max(150).optional(),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(254),

  password: z.string().min(1).max(72)
    .refine(value => Buffer.byteLength(value, 'utf8') <= 72),

  role: z.enum(['ADMIN', 'DOCTOR', 'PATIENT']),
})