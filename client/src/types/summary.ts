export interface HealthSummary {

  id: string

  content: string

  status:
    | 'DRAFT'
    | 'APPROVED'
    | 'REJECTED'

  periodStart: string
  periodEnd: string

  aiModel: string | null

  createdAt: string
  reviewedAt: string | null

  reviewNotes?: string | null

  patient?: {
    patientCode: string

    user: {
      fullName: string
    }
  }
}