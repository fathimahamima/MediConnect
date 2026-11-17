import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X, Target } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '../../lib/api'
import { doctorService } from '../../services/doctor.service'
import type { Patient } from '../../types/patient'
import type { RecoveryPlan } from '../../types/recovery'

import PageHeader from '../../components/doctor/PageHeader'
import RecoveryPlanCard from '../../components/recovery/RecoveryPlanCard'

const initialForm = {
  patientId: '',
  title: '',
  description: '',
  expectedOutcome: '',
  heartRateMin: '',
  heartRateMax: '',
  spo2Min: '',
  spo2Max: '',
  temperatureMin: '',
  temperatureMax: '',
  startDate: '',
  endDate: '',
}

const targetFields = [
  { key: 'heartRateMin', label: 'Minimum heart rate (BPM)' },
  { key: 'heartRateMax', label: 'Maximum heart rate (BPM)' },
  { key: 'spo2Min', label: 'Minimum SpO₂ (%)' },
  { key: 'spo2Max', label: 'Maximum SpO₂ (%)' },
  { key: 'temperatureMin', label: 'Minimum sensor temperature (°C)' },
  { key: 'temperatureMax', label: 'Maximum sensor temperature (°C)' },
] as const

export default function DoctorRecoveryPage() {

  const [plans, setPlans] = useState<RecoveryPlan[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [form, setForm] = useState(initialForm)

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setError('')

      const [planData, firstPage] = await Promise.all([
        api<{ plans: RecoveryPlan[] }>('/doctor/recovery'),
        doctorService.getPatients('', 1),
      ])

      const allPatients = [...firstPage.patients]

      for (let page = 2; page <= firstPage.totalPages; page++) {
        const response = await doctorService.getPatients('', page)
        allPatients.push(...response.patients)
      }

      setPlans(planData.plans)

      setPatients(
        allPatients.filter(
          patient => patient.user.status === 'ACTIVE'
        )
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load recovery plans'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function update(
    key: keyof typeof initialForm,
    value: string
  ) {
    setForm(previous => ({
      ...previous,
      [key]: value,
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()

    if (saving) return

    if (!window.confirm(
      'Creating this plan replaces the patient’s previous active recovery plan. Continue?'
    )) return

    setSaving(true)

    try {
      await api('/doctor/recovery', {
        method: 'POST',

        body: JSON.stringify({
          ...form,

          heartRateMin: Number(form.heartRateMin),
          heartRateMax: Number(form.heartRateMax),

          spo2Min: Number(form.spo2Min),
          spo2Max: Number(form.spo2Max),

          temperatureMin: Number(form.temperatureMin),
          temperatureMax: Number(form.temperatureMax),

          startDate: new Date(form.startDate).toISOString(),

          endDate: form.endDate
            ? new Date(form.endDate).toISOString()
            : undefined,
        }),
      })

      toast.success('Recovery plan created')

      setForm(initialForm)
      setShowForm(false)

      await loadData()

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to create plan'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(id: string) {

    if (!window.confirm('Deactivate this recovery plan?')) return

    try {
      await api(`/doctor/recovery/${id}/deactivate`, {
        method: 'PATCH',
      })

      toast.success('Recovery plan deactivated')

      await loadData()

    } catch {
      toast.error('Unable to deactivate plan')
    }
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Recovery management"
        description="Personalized recovery targets and treatment monitoring."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="dashboard-button gap-2"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Close form' : 'Create recovery plan'}
          </button>
        }
      />

      {showForm && (

        <form
          onSubmit={submit}
          className="dashboard-card space-y-5 p-6"
        >

          <h2 className="text-xl font-bold text-slate-900">
            New personalized recovery plan
          </h2>

          <div>
            <label className="dashboard-label">Patient</label>

            <select
              required
              value={form.patientId}
              onChange={e => update('patientId', e.target.value)}
              className="dashboard-input mt-2"
            >
              <option value="">Select patient</option>

              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.user.fullName} — {patient.patientCode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="dashboard-label">Plan title</label>
            <input
              required
              minLength={3}
              value={form.title}
              onChange={e => update('title', e.target.value)}
              className="dashboard-input mt-2"
              placeholder="Enter recovery plan title"
            />
          </div>

          <div>
            <label className="dashboard-label">Description</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              className="dashboard-input mt-2"
              rows={3}
            />
          </div>

          <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-700">
            Enter individualized targets appropriate for the
            patient and sensor measurement method.
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {targetFields.map(field => (
              <div key={field.key}>
                <label className="dashboard-label">
                  {field.label}
                </label>

                <input
                  required
                  type="number"
                  step="any"
                  value={form[field.key]}
                  onChange={e => update(field.key, e.target.value)}
                  className="dashboard-input mt-2"
                />
              </div>
            ))}

            <div>
              <label className="dashboard-label">Start date</label>
              <input
                required
                type="datetime-local"
                value={form.startDate}
                onChange={e => update('startDate', e.target.value)}
                className="dashboard-input mt-2"
              />
            </div>

            <div>
              <label className="dashboard-label">End date (optional)</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={e => update('endDate', e.target.value)}
                className="dashboard-input mt-2"
              />
            </div>

          </div>

          <div>
            <label className="dashboard-label">Expected outcome</label>

            <textarea
              value={form.expectedOutcome}
              onChange={e => update('expectedOutcome', e.target.value)}
              className="dashboard-input mt-2"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="dashboard-button"
          >
            {saving ? 'Saving...' : 'Save recovery plan'}
          </button>

        </form>
      )}

      <button
        onClick={() => void loadData()}
        className="text-sm font-semibold text-indigo-600"
      >
        Refresh evaluation
      </button>

      {loading ? (
        <p className="text-slate-500">Loading recovery plans...</p>

      ) : error ? (
        <p className="rounded-xl bg-rose-50 p-4 text-rose-600">
          {error}
        </p>

      ) : plans.length === 0 ? (

        <div className="dashboard-card p-12 text-center">
          <Target size={40} className="mx-auto mb-4 text-indigo-400" />
          <h2 className="font-bold text-slate-900">No recovery plans</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a personalized recovery plan for your patient.
          </p>
        </div>

      ) : (

        plans.map(plan => (
          <RecoveryPlanCard
            key={plan.id}
            plan={plan}
            onDeactivate={() => void deactivate(plan.id)}
          />
        ))

      )}

    </div>
  )
}