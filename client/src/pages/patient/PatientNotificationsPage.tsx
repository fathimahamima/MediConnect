import { useEffect, useState } from 'react'

import {
  ShieldAlert,
  Phone,
  Bell,
} from 'lucide-react'

import { toast } from 'sonner'

import { api } from '../../lib/api'

import type { HealthAlert } from '../../types/alert'

import AlertCard from '../../components/alerts/AlertCard'
import { useRef } from 'react'
import { speakText } from '../../utils/speech'

export default function PatientNotificationsPage() {

  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [spokenAlerts, setSpokenAlerts] = useState(false)

const announcedAlerts = useRef(new Set<string>())

  async function loadAlerts() {
    try {

      const data = await api<{
        alerts: HealthAlert[]
      }>('/patient/alerts')

      setAlerts(data.alerts)
      setError('')

    } catch {
      setError('Unable to retrieve current notifications')
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
  useEffect(() => {

  if (!spokenAlerts || loading || error) return

  const pending = alerts.filter(
    alert =>
      alert.status === 'OPEN' &&
      !announcedAlerts.current.has(alert.id)
  )

  if (!pending.length) return

  pending.forEach(alert => {
    announcedAlerts.current.add(alert.id)
  })

  speakText(
    `MediConnect has ${pending.length} unannounced health alerts. ` +
    'Please review your notifications.'
  )

}, [alerts, spokenAlerts, loading, error])

  async function sendSOS() {

    if (sending) return

    if (!window.confirm(
      'Record an urgent assistance request in MediConnect? ' +
      'This does not contact emergency services.'
    )) return

    setSending(true)

    try {

      await api('/patient/alerts/sos', {
        method: 'POST',
      })

      toast.success('SOS recorded in MediConnect')

      await loadAlerts()

    } catch {
      toast.error(
        'Unable to record SOS. Contact emergency services directly if needed.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          Notifications & safety
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View health alerts and assistance requests.
        </p>

      </div>

      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#450A0A] via-[#991B1B] to-[#BE123C] p-7 text-white">

        <ShieldAlert size={35} className="mb-5" />

        <h2 className="text-2xl font-bold">
          Emergency assistance
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-rose-100">
          Record an urgent assistance request for your
          treating doctor to review in MediConnect.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">

          <button
            disabled={sending}
            onClick={() => void sendSOS()}
            className="rounded-xl bg-white px-6 py-4 font-bold text-red-700 transition hover:bg-rose-50 disabled:opacity-50"
          >
            {sending ? 'Recording...' : 'Send SOS'}
          </button>

          <a
            href="tel:112"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-4 text-sm font-semibold"
          >
            <Phone size={18} />
            Call 112
          </a>

        </div>

        <p className="mt-5 text-xs leading-relaxed text-rose-100">
          SOS requests are recorded in MediConnect. Email notifications
are queued for eligible recipients, including your assigned
doctor and consenting emergency contacts.

Email delivery and immediate assistance are not guaranteed.
For a medical emergency, call 112.
        </p>

      </div>
      <div className="dashboard-card flex items-center justify-between gap-4 p-5">

  <div>

    <h3 className="font-bold text-slate-900">
      Spoken health alerts
    </h3>

    <p className="mt-1 text-xs text-slate-500">
      Read a notification announcement aloud.
    </p>

  </div>

  <button
    onClick={() => {

      if (!spokenAlerts) {
        speakText('Spoken alerts enabled.')
      }

      setSpokenAlerts(!spokenAlerts)
    }}
    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
      spokenAlerts
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-600'
    }`}
  >
    {spokenAlerts ? 'Enabled' : 'Enable'}
  </button>

</div>

      <h2 className="text-xl font-bold text-slate-900">
        Recent alerts
      </h2>

      {loading ? (

        <p>Loading notifications...</p>

      ) : error ? (

        <p className="rounded-xl bg-rose-50 p-4 text-rose-700">
          {error}
        </p>

      ) : alerts.length === 0 ? (

        <div className="dashboard-card p-10 text-center">

          <Bell
            size={35}
            className="mx-auto mb-4 text-indigo-300"
          />

          <h3 className="font-bold">
            No alerts recorded
          </h3>

        </div>

      ) : (

        alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
          />
        ))

      )}

    </div>
  )
}