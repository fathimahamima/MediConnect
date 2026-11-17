export interface Device {
  id: string
  deviceCode: string
  deviceName: string
  status: 'REGISTERED' | 'ACTIVE' | 'DISABLED'
  firmwareVersion?: string | null
  lastSeenAt: string | null
  createdAt?: string

  assignments?: {
    id: string
    assignedAt: string
    patient: {
      patientCode: string
    }
  }[]
}

export interface EligiblePatient {
  id: string
  patientCode: string
  user: {
    fullName: string
  }
}

export interface DeviceAssignment {
  id: string
  assignedAt: string
  device: Device
  patient: EligiblePatient
}