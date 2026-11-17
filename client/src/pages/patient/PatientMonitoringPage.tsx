import {
  useEffect,
  useState,
} from 'react'

import {
  LoaderCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

import {
  patientService,
} from '../../services/patient.service'

import type {
  PatientPortalOverview,
} from '../../types/patient-portal'

import LiveMonitoringPanel
  from '../../components/monitoring/LiveMonitoringPanel'

export default function PatientMonitoringPage() {

  const [data, setData] =
    useState<PatientPortalOverview | null>(null)

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

    patientService.getOverview()

      .then(response => {

        if (!cancelled) {
          setData(response)
        }

      })

      .catch(error => {

        if (!cancelled) {

          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load monitoring information'
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

  if (loading) {

    return (

      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">

        <LoaderCircle
          size={32}
          className="animate-spin text-indigo-600"
        />

        <p className="text-sm text-slate-500">
          Preparing your health monitor...
        </p>

      </div>

    )
  }

  if (error || !data) {

    return (

      <div className="dashboard-card p-8 text-center">

        <AlertCircle
          size={32}
          className="mx-auto mb-4 text-rose-500"
        />

        <p className="font-semibold text-slate-800">

          {error || 'Monitoring unavailable'}

        </p>

        <button

          onClick={() =>
            setRefresh(value => value + 1)
          }

          className="dashboard-button mt-5"

        >

          Try again

        </button>

      </div>

    )
  }

  const assignment =
    data.patient.assignments[0]

  return (

    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Live monitoring
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View your real-time sensor measurements.
          </p>

        </div>

        <button

          onClick={() =>
            setRefresh(value => value + 1)
          }

          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-indigo-300"

        >

          <RefreshCw size={16} />

          Refresh device information

        </button>

      </div>

      <LiveMonitoringPanel

        patientId={data.patient.id}

        patientName={
          data.patient.user.fullName
        }

        deviceName={
          assignment?.device.deviceName
        }

        deviceCode={
          assignment?.device.deviceCode
        }

        monitoringEnabled={

          Boolean(
            data.patient.monitoringConsentAt &&
            assignment &&
            assignment.device.status === 'ACTIVE'
          )

        }

      />

    </div>

  )
}