export interface RecoveryPlan {
  id: string
  title: string
  description: string | null
  expectedOutcome: string | null

  heartRateMin: number | null
  heartRateMax: number | null

  spo2Min: number | null
  spo2Max: number | null

  temperatureMin: number | null
  temperatureMax: number | null

  status:
    | 'ON_TRACK'
    | 'NEEDS_REVIEW'
    | 'NOT_EVALUATED'

  startDate: string
  endDate: string | null
  isActive?: boolean

  patient?: {
    id: string
    patientCode: string
    user: {
      fullName: string
    }
  }
}