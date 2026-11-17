import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Plus, X, Pill } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '../../lib/api'
import { doctorService } from '../../services/doctor.service'

import type { Patient } from '../../types/patient'
import type { Medication } from '../../types/medication'

import PageHeader from '../../components/doctor/PageHeader'

import MedicationCard from '../../components/medication/MedicationCard'

const initialForm = {
  patientId: '',
  medicineName: '',
  dosage: '',
  frequency: '',
  instructions: '',
  startDate: '',
  endDate: '',
}

const fields = [
  {
    key: 'medicineName',
    label: 'Medicine name',
    type: 'text',
  },
  {
    key: 'dosage',
    label: 'Prescribed dosage',
    type: 'text',
  },
  {
    key: 'frequency',
    label: 'Prescribed frequency',
    type: 'text',
  },
  {
    key: 'startDate',
    label: 'Start date',
    type: 'datetime-local',
  },
  {
    key: 'endDate',
    label: 'End date (optional)',
    type: 'datetime-local',
  },
] as const

export default function DoctorMedicationPage() {

  const [medications, setMedications] =
    useState<Medication[]>([])

  const [patients, setPatients] =
    useState<Patient[]>([])

  const [form, setForm] =
    useState(initialForm)

  const [showForm, setShowForm] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [filter, setFilter] =
    useState('')

  async function loadMedications() {
    try {
      setError('')

      const response = await api<{
        medications: Medication[]
      }>('/doctor/medications')

      setMedications(response.medications)

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load medications'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    void loadMedications()

    async function loadPatients() {

      try {

        const first = await doctorService.getPatients('', 1)

        const all = [...first.patients]

        for (let page = 2; page <= first.totalPages; page++) {

          const result = await doctorService.getPatients('', page)

          all.push(...result.patients)
        }

        setPatients(
          all.filter(patient =>
            patient.user.status === 'ACTIVE'
          )
        )

      } catch {
        toast.error('Unable to load patients')
      }
    }

    void loadPatients()

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

    setSaving(true)

    try {

      await api('/doctor/medications', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          startDate: new Date(
            form.startDate
          ).toISOString(),
          endDate: form.endDate
            ? new Date(form.endDate).toISOString()
            : undefined,
        }),
      })

      toast.success('Medication added')

      setForm(initialForm)
      setShowForm(false)

      await loadMedications()

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to add medication'
      )

    } finally {
      setSaving(false)
    }
  }

  async function deactivate(id: string) {

    if (!window.confirm(
      'Deactivate this medication record?'
    )) return

    try {

      await api(
        `/doctor/medications/${id}/deactivate`,
        { method: 'PATCH' }
      )

      toast.success('Medication record deactivated')

      await loadMedications()

    } catch {
      toast.error('Unable to deactivate medication')
    }
  }

  const visible = medications.filter(
    medication =>
      !filter ||
      medication.patient?.id === filter
  )

  return (
    <div className="space-y-6">

      <PageHeader
        title="Medication management"
        description="Manage prescriptions and review patient-reported treatment responses."
        action={
          <button
            onClick={() => setShowForm(value => !value)}
            className="dashboard-button gap-2"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Close form' : 'Add medication'}
          </button>
        }
      />

      {showForm && (

        <form
          onSubmit={submit}
          className="dashboard-card space-y-5 p-6"
        >

          <h2 className="text-xl font-bold text-slate-900">
            Add prescribed medication
          </h2>

          <div>

            <label className="dashboard-label">
              Select patient
            </label>

            <select
              required
              value={form.patientId}
              onChange={e => update('patientId', e.target.value)}
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

          <div className="grid gap-4 md:grid-cols-2">

            {fields.map(field => (

              <div key={field.key}>

                <label className="dashboard-label">
                  {field.label}
                </label>

                <input
                  required={field.key !== 'endDate'}
                  type={field.type}
                  value={form[field.key]}
                  onChange={e =>
                    update(field.key, e.target.value)
                  }
                  className="dashboard-input mt-2"
                />

              </div>

            ))}

          </div>

          <div>
            <label className="dashboard-label">
              Instructions
            </label>

            <textarea
              rows={4}
              value={form.instructions}
              onChange={e =>
                update('instructions', e.target.value)
              }
              className="dashboard-input mt-2"
            />
          </div>

          <button
            disabled={saving}
            type="submit"
            className="dashboard-button"
          >
            {saving ? 'Saving...' : 'Save medication'}
          </button>

        </form>

      )}

      <div className="dashboard-card flex flex-wrap items-center gap-4 p-4">

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="dashboard-input !w-auto flex-1"
        >

          <option value="">All patients</option>

          {patients.map(patient => (

            <option
              key={patient.id}
              value={patient.id}
            >
              {patient.user.fullName}
            </option>

          ))}

        </select>

        <button
          onClick={() => void loadMedications()}
          className="dashboard-button"
        >
          Refresh responses
        </button>

      </div>

      {loading ? (

        <p className="text-slate-500">
          Loading medications...
        </p>

      ) : error ? (

        <p className="rounded-xl bg-rose-50 p-4 text-rose-600">
          {error}
        </p>

      ) : visible.length === 0 ? (

        <div className="dashboard-card p-12 text-center">

          <Pill
            size={40}
            className="mx-auto mb-4 text-indigo-400"
          />

          <h2 className="font-bold text-slate-900">
            No medications found
          </h2>

        </div>

      ) : (

        <div className="grid items-start gap-5 xl:grid-cols-2">

          {visible.map(medication => (

            <MedicationCard
              key={medication.id}
              medication={medication}
              action={
                medication.isActive && (
                  <button
                    onClick={() =>
                      void deactivate(medication.id)
                    }
                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600"
                  >
                    Deactivate record
                  </button>
                )
              }
            />

          ))}

        </div>

      )}

    </div>
  )
}