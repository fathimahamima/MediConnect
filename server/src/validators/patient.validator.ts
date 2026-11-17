import { z } from 'zod'

const phoneSchema = z.string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, {
    message: 'Enter phone number with country code',
  })

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(3).max(100),

  email: z.string()
    .trim()
    .email()
    .max(254)
    .transform(value => value.toLowerCase()),

  phone: phoneSchema,

  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(value => {
      const date = new Date(value)

      return Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value &&
        date <= new Date() &&
        date.getUTCFullYear() >= 1900
    }, 'Invalid date of birth')
    .optional(),

  gender: z.enum([
    'Male',
    'Female',
    'Other',
    'Prefer not to say',
  ]).optional(),

  bloodGroup: z.enum([
    'A+', 'A-',
    'B+', 'B-',
    'AB+', 'AB-',
    'O+', 'O-',
    'Unknown',
  ]).optional(),

  medicalNotes: z.string()
    .trim()
    .max(2000)
    .optional(),

  emergencyContact: z.object({
    fullName: z.string().trim().min(3).max(100),

    relationship: z.string().trim().min(2).max(50),

    phone: phoneSchema,

    email: z.string().trim().email().max(254)
      .transform(value => value.toLowerCase())
      .optional(),

    consentConfirmed: z.boolean(),
  }),

  registrationConsent: z.literal(true),
})