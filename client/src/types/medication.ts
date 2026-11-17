export interface MedicationLog {
  id: string
  taken: boolean
  takenAt: string | null
  scheduledAt: string | null
  responseNotes: string | null
  sideEffects: string | null
  createdAt: string
}

export interface Medication {
  id: string
  medicineName: string
  dosage: string
  frequency: string
  instructions: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  logs: MedicationLog[]

  patient?: {
    id: string
    patientCode: string
    user: {
      fullName: string
    }
  }
}