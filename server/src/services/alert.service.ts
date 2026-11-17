import { prisma } from '../config/database.js'
import type { LiveReading } from './live-reading.service.js'
import {
  queueAlertNotifications,
} from './alert-notification.service.js'

export async function evaluateHealthAlerts(
  reading: LiveReading
) {
  const now = new Date()

  const plan = await prisma.recoveryPlan.findFirst({
    where: {
      patientId: reading.patientId,
      isActive: true,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
      patient: {
        monitoringConsentAt: { not: null },
        user: { status: 'ACTIVE' },
        assignments: {
          some: {
            id: reading.assignmentId,
            unassignedAt: null,
            device: { status: 'ACTIVE' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!plan) return

  const parameters = [
    {
      name: 'Heart rate',
      source: 'HEART_RATE',
      value: reading.signalQuality === 'GOOD'
        ? reading.heartRate
        : null,
      min: plan.heartRateMin,
      max: plan.heartRateMax,
      unit: 'BPM',
    },
    {
      name: 'Oxygen saturation',
      source: 'SPO2',
      value: reading.signalQuality === 'GOOD'
        ? reading.spo2
        : null,
      min: plan.spo2Min,
      max: plan.spo2Max,
      unit: '%',
    },
    {
      name: 'Sensor temperature',
      source: 'TEMPERATURE',
      value: reading.temperature,
      min: plan.temperatureMin,
      max: plan.temperatureMax,
      unit: '°C',
    },
  ]

  for (const parameter of parameters) {

    if (
      parameter.value === null ||
      parameter.min === null ||
      parameter.max === null
    ) continue

    const outside =
      parameter.value < parameter.min ||
      parameter.value > parameter.max

    if (!outside) continue

    const createdAlert = await prisma.$transaction(async tx => {

      const existing = await tx.alert.findFirst({
        where: {
          patientId: reading.patientId,
          source: parameter.source,
          status: {
            in: ['OPEN', 'ACKNOWLEDGED'],
          },
        },
      })

      if (existing) return existing

      return tx.alert.create({
        data: {
          patientId: reading.patientId,
          title: `${parameter.name} outside target`,
          message:
            `${parameter.name}: ${parameter.value} ` +
            `${parameter.unit}. Doctor-defined target: ` +
            `${parameter.min}–${parameter.max} ` +
            `${parameter.unit}. Review recommended.`,
          source: parameter.source,
          severity: 'WARNING',
          status: 'OPEN',
        },
      })

    }, {
      isolationLevel: 'Serializable',
    })
    if (createdAlert) {
  try {
    await queueAlertNotifications(createdAlert.id)
  } catch {
    console.error('Unable to queue alert notifications')
  }
}
  }
}