export interface VitalReading {
  heartRate: number | null
  spo2: number | null
  temperature: number | null
  signalQuality: string
  recordedAt: string
  isAggregated: boolean
}

export interface PatientPortalOverview {
  success: boolean

  patient: {
    id: string
    patientCode: string
    gender: string | null
    bloodGroup: string | null
    dateOfBirth: string | null
    monitoringConsentAt: string | null
    createdAt: string

    user: {
      fullName: string
      email: string | null
      phone: string | null
      status: string
    }

    doctor: {
      id: string
      specialization: string
      qualification: string
      hospital: string | null

      user: {
        fullName: string
      }
    }

    emergencyContacts: {
      id: string
      fullName: string
      relationship: string
      phone: string | null
      email: string | null
      isPrimary: boolean
      consentAt: string | null
    }[]

    assignments: {
      id: string
      assignedAt: string

      device: {
        deviceCode: string
        deviceName: string
        status: string
        lastSeenAt: string | null
      }
    }[]
  }

  latestReading: VitalReading | null

  recoveryPlans: {
    id: string
    title: string
    description: string | null
    expectedOutcome: string | null
    status: 'ON_TRACK' | 'NEEDS_REVIEW' | 'NOT_EVALUATED'
    startDate: string
    endDate: string | null
    heartRateMin: number | null
    heartRateMax: number | null
    spo2Min: number | null
    spo2Max: number | null
    temperatureMin: number | null
    temperatureMax: number | null
  }[]

  medications: {
    id: string
    medicineName: string
    dosage: string
    frequency: string
    instructions: string | null
    startDate: string
    endDate: string | null
  }[]

  openAlerts: number

  recentAlerts: {
    id: string
    title: string
    message: string
    severity: string
    status: string
    createdAt: string
  }[]
}