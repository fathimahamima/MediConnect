export interface HealthAlert {

  id: string
  title: string
  message: string
  source: string

  severity:
    | 'INFO'
    | 'WARNING'
    | 'CRITICAL'
    | 'EMERGENCY'

  status:
    | 'OPEN'
    | 'ACKNOWLEDGED'
    | 'RESOLVED'

  createdAt: string

  acknowledgedAt: string | null
  resolvedAt: string | null
  resolutionNotes: string | null

  patient?: {
    patientCode: string
    user: {
      fullName: string
    }
  }
}