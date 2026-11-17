import { z } from 'zod'

export const telemetrySchema = z.object({

  readingKey: z.string().uuid(),

  assignmentId: z.string().uuid(),

  heartRate: z.number()
    .min(30)
    .max(220)
    .nullable(),

  spo2: z.number()
    .min(1)
    .max(100)
    .nullable(),

  temperature: z.number()
    .min(-55)
    .max(125)
    .nullable(),

  signalQuality: z.enum([
    'GOOD',
    'POOR',
    'NO_CONTACT',
    'SENSOR_ERROR',
  ]),

}).strict().superRefine((data, ctx) => {

  if (
    data.signalQuality === 'GOOD' &&
    (
      data.heartRate === null ||
      data.spo2 === null
    )
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Good optical signal requires HR and SpO2',
    })
  }

  if (
    data.signalQuality === 'NO_CONTACT' ||
    data.signalQuality === 'SENSOR_ERROR'
  ) {
    if (
      data.heartRate !== null ||
      data.spo2 !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Invalid optical readings must be null',
      })
    }
  }
})