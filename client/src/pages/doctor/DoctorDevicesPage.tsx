import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import {
  Cpu,
  Link2,
  RefreshCw,
  Unlink,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { deviceService } from '../../services/device.service'

import type {
  Device,
  EligiblePatient,
  DeviceAssignment,
} from '../../types/device'

import DeviceCard from '../../components/devices/DeviceCard'
import PageHeader from '../../components/doctor/PageHeader'

export default function DoctorDevicesPage() {

  const [devices, setDevices] = useState<Device[]>([])

  const [patients, setPatients] =
    useState<EligiblePatient[]>([])

  const [assignments, setAssignments] =
    useState<DeviceAssignment[]>([])

  const [deviceId, setDeviceId] = useState('')
  const [patientId, setPatientId] = useState('')

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {

    try {

      const [
        available,
        eligible,
        assigned,
      ] = await Promise.all([

        deviceService.getAvailableDevices(),

        deviceService.getEligiblePatients(),

        deviceService.getAssignments(),

      ])

      setDevices(available.devices)
      setPatients(eligible.patients)
      setAssignments(assigned.assignments)

      setError('')

    } catch {

      setError('Unable to load device information')

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    void loadData()

    const timer = window.setInterval(
      () => void loadData(),
      10000
    )

    return () => window.clearInterval(timer)

  }, [])

  async function assign(event: FormEvent) {

    event.preventDefault()

    if (busy || !deviceId || !patientId) return

    if (!window.confirm(
      'Confirm device assignment? Verify that this device belongs to the selected patient.'
    )) return

    setBusy(true)

    try {

      await deviceService.assignDevice(
        deviceId,
        patientId
      )

      toast.success('Device assigned successfully')

      setDeviceId('')
      setPatientId('')

      await loadData()

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : 'Device assignment failed'
      )

    } finally {
      setBusy(false)
    }
  }

  async function unassign(id: string) {

    if (busy) return

    if (!window.confirm(
      'End this device assignment and stop monitoring through this device?'
    )) return

    setBusy(true)

    try {

      await deviceService.unassignDevice(id)

      toast.success('Device unassigned')

      await loadData()

    } catch {

      toast.error('Unable to unassign device')

    } finally {
      setBusy(false)
    }
  }

  const stats = [
    {
      label: 'Assigned devices',
      value: assignments.length,
    },
    {
      label: 'Available devices',
      value: devices.length,
    },
    {
      label: 'Eligible patients',
      value: patients.length,
    },
  ]

  return (
    <div className="space-y-6">

      <PageHeader
        title="Device management"
        description="Connect patients to MediConnect monitoring devices."
        action={
          <button
            onClick={() => void loadData()}
            className="dashboard-button gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">

        {stats.map(stat => (

          <div
            key={stat.label}
            className="dashboard-card p-5"
          >

            <p className="text-3xl font-bold text-indigo-600">
              {stat.value}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {stat.label}
            </p>

          </div>

        ))}

      </div>

      {error && (

        <p className="rounded-xl bg-rose-50 p-4 text-rose-700">
          {error}
        </p>

      )}

      <form
        onSubmit={assign}
        className="dashboard-card space-y-5 p-6"
      >

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

            <Link2 size={24} />

          </div>

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Assign monitoring device
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Connect one available device to an eligible patient.
            </p>

          </div>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <div>

            <label className="dashboard-label">
              Select monitoring device
            </label>

            <select
              required
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              className="dashboard-input mt-2"
            >

              <option value="">Choose device</option>

              {devices.map(device => (

                <option
                  key={device.id}
                  value={device.id}
                >
                  {device.deviceName}
                  {' — '}
                  {device.deviceCode}
                </option>

              ))}

            </select>

          </div>

          <div>

            <label className="dashboard-label">
              Select patient
            </label>

            <select
              required
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="dashboard-input mt-2"
            >

              <option value="">Choose patient</option>

              {patients.map(patient => (

                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.user.fullName}
                  {' — '}
                  {patient.patientCode}
                </option>

              ))}

            </select>

          </div>

        </div>

        <div className="rounded-xl bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-700">

          Only activated patients who have provided monitoring
          consent and do not have another assigned device
          are eligible.

        </div>

        <button
          disabled={
            busy ||
            loading ||
            !deviceId ||
            !patientId
          }
          type="submit"
          className="dashboard-button gap-2 disabled:opacity-50"
        >

          <Link2 size={18} />

          {busy ? 'Processing...' : 'Assign device'}

        </button>

      </form>

      <h2 className="text-xl font-bold text-slate-900">
        Active device assignments
      </h2>

      {loading ? (

        <p>Loading devices...</p>

      ) : assignments.length === 0 ? (

        <div className="dashboard-card p-12 text-center">

          <Cpu
            size={40}
            className="mx-auto mb-4 text-indigo-300"
          />

          <h3 className="font-bold">
            No active assignments
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Assign a registered device to begin monitoring.
          </p>

        </div>

      ) : (

        <div className="grid gap-5 xl:grid-cols-2">

          {assignments.map(assignment => (

            <DeviceCard
              key={assignment.id}
              device={assignment.device}
              patientName={assignment.patient.user.fullName}

              action={

                <div className="space-y-4">

                  <p className="text-xs text-slate-500">

                    Patient ID: {assignment.patient.patientCode}

                    <br />

                    Assigned: {new Date(
                      assignment.assignedAt
                    ).toLocaleString()}

                  </p>

                  <div className="flex flex-wrap gap-3">

                    <Link
                      to="/doctor/monitoring"
                      className="dashboard-button"
                    >
                      View monitoring
                    </Link>

                    <button
                      disabled={busy}
                      onClick={() => void unassign(assignment.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm text-rose-600"
                    >

                      <Unlink size={16} />

                      Unassign

                    </button>

                  </div>

                </div>

              }
            />

          ))}

        </div>

      )}

    </div>
  )
}