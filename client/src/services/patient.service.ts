import { api } from '../lib/api'

import type {
  PatientPortalOverview,
} from '../types/patient-portal'

export const patientService = {
  getOverview() {
    return api<PatientPortalOverview>(
      '/patient/overview'
    )
  },

  updateMonitoringConsent(consent: boolean) {
    return api<{
      success: boolean
      monitoringConsentAt: string | null
      message: string
    }>('/patient/monitoring-consent', {
      method: 'PATCH',

      body: JSON.stringify({
        consent,
      }),
    })
  },
}