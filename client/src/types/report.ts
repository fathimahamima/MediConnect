export interface VitalStatistics {
  min: number | null
  max: number | null
  average: number | null
  count: number
}

export interface HealthReport {

  success: boolean

  patient: {
    id: string
    patientCode: string

    user: {
      fullName: string
    }

    doctor: {
      specialization: string
      user: {
        fullName: string
      }
    }
  }

  period: {
    from: string
    to: string
  }

  generatedAt: string
  truncated: boolean

  summary: {
    totalReadings: number
    heartRate: VitalStatistics
    spo2: VitalStatistics
    temperature: VitalStatistics
  }

  readings: {
    id: string
    heartRate: number | null
    spo2: number | null
    temperature: number | null
    signalQuality: string
    recordedAt: string
  }[]

  alerts: {
    id: string
    title: string
    severity: string
    status: string
    createdAt: string
  }[]

  medicationLogs: {
    id: string
    taken: boolean
    createdAt: string
    medication: {
      medicineName: string
    }
  }[]
}