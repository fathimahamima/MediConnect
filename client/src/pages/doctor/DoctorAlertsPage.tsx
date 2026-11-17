import { useEffect, useState } from 'react'

import {
  ShieldAlert,
  RefreshCw,
} from 'lucide-react'

import { toast } from 'sonner'

import { api } from '../../lib/api'

import type { HealthAlert } from '../../types/alert'

import AlertCard from '../../components/alerts/AlertCard'
import PageHeader from '../../components/doctor/PageHeader'

export default function DoctorAlertsPage() {

  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadAlerts() {
    try {

      const data = await api<{
        alerts: HealthAlert[]
      }>('/doctor/alerts')

      setAlerts(data.alerts)
      setError('')

    } catch {
      setError('Unable to retrieve current alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    void loadAlerts()

    const timer = window.setInterval(
      () => void loadAlerts(),
      5000
    )

    return () => window.clearInterval(timer)

  }, [])

  async function updateAlert(
    id: string,
    action: 'acknowledge' | 'resolve'
  ) {

    if (busy) return

    let notes = ''

    if (action === 'resolve') {

      notes = window.prompt(
        'Enter your review and resolution notes:'
      )?.trim() || ''

      if (notes.length < 3) return
    }

    setBusy(true)

    try {

      await api(`/doctor/alerts/${id}/${action}`, {
        method: 'PATCH',
        body: action === 'resolve'
          ? JSON.stringify({ notes })
          : undefined,
      })

      toast.success(
        action === 'resolve'
          ? 'Alert resolved'
          : 'Alert acknowledged'
      )

      await loadAlerts()

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to update alert'
      )
    } finally {
      setBusy(false)
    }
  }

  const visible = alerts.filter(
    alert =>
      filter === 'ALL' ||
      alert.status === filter
  )

  const stats = [
    {
      label: 'Open alerts',
      value: alerts.filter(a => a.status === 'OPEN').length,
      color: 'text-amber-600',
    },
    {
      label: 'Active SOS',
      value: alerts.filter(a =>
        a.severity === 'EMERGENCY' &&
        a.status !== 'RESOLVED'
      ).length,
      color: 'text-rose-600',
    },
    {
      label: 'Acknowledged',
      value: alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
      color: 'text-indigo-600',
    },
    {
      label: 'Resolved',
      value: alerts.filter(a => a.status === 'RESOLVED').length,
      color: 'text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6">

      <PageHeader
        title="Health alerts"
        description="Review patient target-range deviations and requests for assistance."
        action={
          <button
            onClick={() => void loadAlerts()}
            className="dashboard-button gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        {stats.map(item => (
          <div
            key={item.label}
            className="dashboard-card p-5"
          >
            <p className={`text-3xl font-bold ${item.color}`}>
              {item.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {item.label}
            </p>
          </div>
        ))}

      </div>

      <p className="text-xs text-slate-400">
        Counts reflect the latest 100 retrieved alerts.
        Automatically refreshes every 5 seconds.
      </p>

      <div className="flex flex-wrap gap-2">

        {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(item => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-3 text-xs font-semibold ${
              filter === item
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {item}
          </button>
        ))}

      </div>

      {loading ? (
        <p>Loading alerts...</p>

      ) : error ? (
        <p className="rounded-xl bg-rose-50 p-4 text-rose-700">
          {error}
        </p>

      ) : visible.length === 0 ? (

        <div className="dashboard-card p-12 text-center">

          <ShieldAlert
            size={40}
            className="mx-auto mb-4 text-indigo-300"
          />

          <h2 className="font-bold">
            No matching alerts
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Absence of alerts does not establish patient safety.
          </p>

        </div>

      ) : (

        visible.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            action={
              alert.status !== 'RESOLVED' && (
                <button
                  disabled={busy}
                  onClick={() => void updateAlert(
                    alert.id,
                    alert.status === 'OPEN'
                      ? 'acknowledge'
                      : 'resolve'
                  )}
                  className="dashboard-button"
                >
                  {alert.status === 'OPEN'
                    ? 'Acknowledge alert'
                    : 'Resolve alert'}
                </button>
              )
            }
          />
        ))

      )}

    </div>
  )
}