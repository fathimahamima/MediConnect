export interface LiveReading {
  patientId: string
  assignmentId: string
  deviceId: string

  heartRate: number | null
  spo2: number | null
  temperature: number | null

  signalQuality:
    | 'GOOD'
    | 'POOR'
    | 'NO_CONTACT'
    | 'SENSOR_ERROR'

  recordedAt: string
  isAggregated: boolean
}

const liveReadings =
  new Map<string, LiveReading>()

export function setLiveReading(
  reading: LiveReading
) {
  liveReadings.set(
    reading.patientId,
    reading
  )
}

export function getLiveReading(
  patientId: string
) {
  const reading =
    liveReadings.get(patientId)

  if (!reading) {
    return null
  }

  const age =
    Date.now() -
    new Date(reading.recordedAt).getTime()

  if (age > 15000) {
    liveReadings.delete(patientId)
    return null
  }

  return reading
}

export function clearLiveReading(
  patientId: string
) {
  liveReadings.delete(patientId)
}

// Remove expired cached readings

const cleanupTimer = setInterval(() => {
  for (const patientId of liveReadings.keys()) {
    getLiveReading(patientId)
  }
}, 30000)

cleanupTimer.unref()