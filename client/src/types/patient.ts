export type PatientStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'

export interface Patient {
  id: string
  patientCode: string
  dateOfBirth: string | null
  gender: string | null
  bloodGroup: string | null
  createdAt: string
  monitoringConsentAt: string | null

  user: {
    fullName: string
    email: string | null
    phone: string | null
    status: PatientStatus
    emailVerified: boolean
  }
}

export interface DoctorStats {
  totalPatients: number
  activePatients: number
  pendingPatients: number
  assignedDevices: number
  openAlerts: number
}

export interface DoctorOverview {
  success: boolean
  stats: DoctorStats
  recentPatients: Patient[]
}

export interface PatientListResponse {
  success: boolean
  patients: Patient[]
  total: number
  page: number
  totalPages: number
}

export interface CreatePatientInput {
  fullName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  medicalNotes?: string

  emergencyContact: {
    fullName: string
    relationship: string
    phone: string
    email?: string
    consentConfirmed: boolean
  }

  registrationConsent: boolean
}

export interface EmergencyContact {
  id: string
  fullName: string
  relationship: string
  phone: string | null
  email: string | null
  isPrimary: boolean
  consentAt: string | null
}

export interface PatientDetails extends Patient {
  medicalNotes: string | null
  emergencyContacts: EmergencyContact[]

  assignments: {
    id: string
    assignedAt: string

    device: {
      id: string
      deviceCode: string
      deviceName: string
      status: string
      lastSeenAt: string | null
    }
  }[]
}