import {
  useEffect,
  useState,
} from 'react'

import {
  Users,
  Radio,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react'

import { api } from '../../lib/api'

import PageHeader
  from '../../components/doctor/PageHeader'

import LiveMonitoringPanel
  from '../../components/monitoring/LiveMonitoringPanel'

interface MonitoringAssignment {

  id: string

  assignedAt: string

  patient: {

    id: string

    patientCode: string

    user: {
      fullName: string
    }
  }

  device: {

    id: string

    deviceCode: string

    deviceName: string

    status: string

    lastSeenAt: string | null
  }
}

interface AssignmentsResponse {

  success: boolean

  assignments: MonitoringAssignment[]
}

export default function DoctorMonitoringPage() {

  const [assignments, setAssignments] =
    useState<MonitoringAssignment[]>([])

  const [selectedId, setSelectedId] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [refresh, setRefresh] =
    useState(0)

  useEffect(() => {

    let cancelled = false

    setLoading(true)
    setError('')

    api<AssignmentsResponse>(
      '/doctor/devices/assignments'
    )

      .then(response => {

        if (cancelled) return

        setAssignments(
          response.assignments
        )

        setSelectedId(previous => {

          const stillAvailable =
            response.assignments.some(
              item => item.id === previous
            )

          return stillAvailable

            ? previous

            : response.assignments[0]?.id || ''

        })

      })

      .catch(error => {

        if (!cancelled) {

          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load assigned patients'
          )
        }

      })

      .finally(() => {

        if (!cancelled) {
          setLoading(false)
        }

      })

    return () => {
      cancelled = true
    }

  }, [refresh])

  const selected =
    assignments.find(
      item => item.id === selectedId
    )

  return (

    <div className="space-y-6">

      <PageHeader

        title="Live patient monitoring"

        description="Access real-time measurements from your assigned patients."

        action={

          <button

            onClick={() =>
              setRefresh(value => value + 1)
            }

            className="dashboard-button gap-2"

          >

            <RefreshCw size={16} />

            Refresh patients

          </button>

        }

      />

      {loading ? (

        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">

          <LoaderCircle
            size={32}
            className="animate-spin text-indigo-600"
          />

          <p className="text-sm text-slate-500">
            Loading assigned patients...
          </p>

        </div>

      ) : error ? (

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">

          {error}

        </div>

      ) : assignments.length === 0 ? (

        <div className="dashboard-card flex min-h-[350px] flex-col items-center justify-center p-8 text-center">

          <div className="mb-5 rounded-3xl bg-indigo-50 p-5 text-indigo-500">

            <Users size={35} />

          </div>

          <h2 className="text-xl font-bold text-slate-900">

            No assigned monitoring devices

          </h2>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">

            Assign a registered monitoring device
            to an eligible patient before starting
            live monitoring.

          </p>

        </div>

      ) : (

        <>

          {/* PATIENT SELECTOR */}

          <div className="dashboard-card p-5 sm:p-6">

            <div className="mb-4 flex items-center gap-3">

              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">

                <Radio size={21} />

              </div>

              <div>

                <h2 className="font-bold text-slate-900">

                  Select patient

                </h2>

                <p className="mt-1 text-xs text-slate-500">

                  {assignments.length} active device assignments

                </p>

              </div>

            </div>

            <select

              value={selectedId}

              onChange={event =>
                setSelectedId(event.target.value)
              }

              className="dashboard-input"

            >

              {assignments.map(assignment => (

                <option

                  key={assignment.id}

                  value={assignment.id}

                >

                  {assignment.patient.user.fullName}
                  {' — '}
                  {assignment.patient.patientCode}
                  {' — '}
                  {assignment.device.deviceName}

                </option>

              ))}

            </select>

          </div>

          {/* SELECTED PATIENT MONITOR */}

          {selected && (

            <LiveMonitoringPanel

              key={selected.id}

              patientId={
                selected.patient.id
              }

              patientName={
                selected.patient.user.fullName
              }

              deviceName={
                selected.device.deviceName
              }

              deviceCode={
                selected.device.deviceCode
              }

              monitoringEnabled={
                selected.device.status === 'ACTIVE'
              }

            />

          )}

        </>

      )}

    </div>

  )
}