import { api } from '../lib/api'

import type {
  Device,
  EligiblePatient,
  DeviceAssignment,
} from '../types/device'

export const deviceService = {

  getDevices() {
    return api<{ devices: Device[] }>(
      '/admin/devices'
    )
  },

  registerDevice(
    deviceName: string,
    firmwareVersion: string
  ) {
    return api<{
      device: Device
      apiKey: string
    }>('/admin/devices', {
      method: 'POST',
      body: JSON.stringify({
        deviceName,
        firmwareVersion,
      }),
    })
  },

  regenerateKey(id: string) {
    return api<{ apiKey: string }>(
      `/admin/devices/${id}/regenerate-key`,
      { method: 'POST' }
    )
  },

  updateStatus(
    id: string,
    action: 'enable' | 'disable'
  ) {
    return api(
      `/admin/devices/${id}/${action}`,
      { method: 'PATCH' }
    )
  },

  getAvailableDevices() {
    return api<{ devices: Device[] }>(
      '/doctor/devices/available'
    )
  },

  getEligiblePatients() {
    return api<{ patients: EligiblePatient[] }>(
      '/doctor/devices/eligible-patients'
    )
  },

  getAssignments() {
    return api<{ assignments: DeviceAssignment[] }>(
      '/doctor/devices/assignments'
    )
  },

  assignDevice(
    deviceId: string,
    patientId: string
  ) {
    return api('/doctor/devices/assign', {
      method: 'POST',
      body: JSON.stringify({
        deviceId,
        patientId,
      }),
    })
  },

  unassignDevice(id: string) {
    return api(
      `/doctor/devices/assignments/${id}/unassign`,
      { method: 'PATCH' }
    )
  },
}