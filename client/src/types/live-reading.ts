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

export type LiveConnectionStatus =
  | 'CONNECTING'
  | 'WAITING'
  | 'LIVE'
  | 'OFFLINE'
  | 'UNAVAILABLE'