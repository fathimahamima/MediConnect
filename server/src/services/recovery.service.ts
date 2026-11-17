import { prisma } from '../config/database.js'
import type { LiveReading } from './live-reading.service.js'

export async function evaluateRecovery(
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
        assignments: {
          some: {
            id: reading.assignmentId,
            unassignedAt: null,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!plan) return null

  const results = [
    {
      name: 'Heart rate',
      value: reading.signalQuality === 'GOOD'
        ? reading.heartRate
        : null,
      min: plan.heartRateMin,
      max: plan.heartRateMax,
    },
    {
      name: 'SpO2',
      value: reading.signalQuality === 'GOOD'
        ? reading.spo2
        : null,
      min: plan.spo2Min,
      max: plan.spo2Max,
    },
    {
      name: 'Sensor temperature',
      value: reading.temperature,
      min: plan.temperatureMin,
      max: plan.temperatureMax,
    },
  ]

  const available = results.filter(
    item =>
      item.value !== null &&
      item.min !== null &&
      item.max !== null
  )

  const outsideTargets = available.filter(
    item =>
      item.value! < item.min! ||
      item.value! > item.max!
  )

  const status =
    outsideTargets.length > 0
      ? 'NEEDS_REVIEW'
      : available.length === results.length
        ? 'ON_TRACK'
        : 'NOT_EVALUATED'

  if (plan.status !== status) {
    await prisma.recoveryPlan.updateMany({
      where: {
        id: plan.id,
        isActive: true,
      },
      data: { status },
    })
  }

  return {
    planId: plan.id,
    status,
    outsideTargets,
    results,
  }
}