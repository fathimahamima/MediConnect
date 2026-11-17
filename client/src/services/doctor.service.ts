import { api } from '../lib/api'

import type {
  DoctorOverview,
  Patient,
  PatientDetails,
  PatientListResponse,
  CreatePatientInput,
} from '../types/patient'

export const doctorService = {
  getOverview() {
    return api<DoctorOverview>(
      '/doctor/overview'
    )
  },

  getPatients(search = '', page = 1) {
    const params = new URLSearchParams({
      search,
      page: String(page),
    })

    return api<PatientListResponse>(
      `/doctor/patients?${params}`
    )
  },

  createPatient(data: CreatePatientInput) {
    return api<{
      success: boolean
      patient: Patient
      invitationSent: boolean
      message: string
    }>('/doctor/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getPatient(id: string) {
    return api<{
      success: boolean
      patient: PatientDetails
    }>(`/doctor/patients/${id}`)
  },

  resendInvitation(id: string) {
    return api<{
      success: boolean
      message: string
    }>(`/doctor/patients/${id}/resend-invitation`, {
      method: 'POST',
    })
  },
}