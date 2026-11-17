import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Pill, RefreshCw, ClipboardPen } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '../../lib/api'

import type { Medication } from '../../types/medication'

import MedicationCard, {
  isMedicationCurrent,
} from '../../components/medication/MedicationCard'

const initialLog = {
  taken: '',
  responseNotes: '',
  sideEffects: '',
}

export default function PatientMedicationPage() {

  const [medications, setMedications] =
    useState<Medication[]>([])

  const [selected, setSelected] =
    useState('')

  const [form, setForm] =
    useState(initialLog)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  async function loadData() {

    try {

      setError('')

      const response = await api<{
        medications: Medication[]
      }>('/patient/medications')

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
    void loadData()
  }, [])

  async function submit(event: FormEvent) {

    event.preventDefault()

    if (
      saving ||
      !selected ||
      form.taken === ''
    ) return

    if (!window.confirm(
      'Save this medication intake record?'
    )) return

    setSaving(true)

    try {

      await api(
        `/patient/medications/${selected}/logs`,
        {
          method: 'POST',

          body: JSON.stringify({
            taken: form.taken === 'yes',
            responseNotes: form.responseNotes,
            sideEffects: form.sideEffects,
          }),
        }
      )

      toast.success('Treatment response recorded')

      setForm(initialLog)
      setSelected('')

      await loadData()

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to record response'
      )

    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            My medications
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View prescribed medications and record treatment responses.
          </p>

        </div>

        <button
          onClick={() => void loadData()}
          className="dashboard-button gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      <div className="rounded-[28px] bg-gradient-to-br from-[#080F26] to-[#3730A3] p-7 text-white">

        <Pill
          size={30}
          className="mb-5 text-indigo-300"
        />

        <h2 className="text-2xl font-bold">
          Your treatment journey
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-200">

          Keep track of prescribed medications and share
          your experiences with your treating doctor.

        </p>

      </div>

      {loading ? (

        <p>Loading medications...</p>

      ) : error ? (

        <p className="text-rose-600">{error}</p>

      ) : medications.length === 0 ? (

        <div className="dashboard-card p-10 text-center">

          <Pill
            size={40}
            className="mx-auto mb-4 text-indigo-400"
          />

          <h2 className="font-bold">
            No medications assigned
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your doctor's prescribed medications will appear here.
          </p>

        </div>

      ) : (

        <div className="grid items-start gap-5 xl:grid-cols-2">

          {medications.map(medication => (

            <MedicationCard
              key={medication.id}
              medication={medication}
              action={

                isMedicationCurrent(medication) && (

                  selected === medication.id ? (

                    <form
                      onSubmit={submit}
                      className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5"
                    >

                      <h3 className="font-bold text-indigo-900">
                        Record medication response
                      </h3>

                      <label className="dashboard-label">
                        Did you take this medication?
                      </label>

                      <select
                        required
                        value={form.taken}
                        onChange={e =>
                          setForm(previous => ({
                            ...previous,
                            taken: e.target.value,
                          }))
                        }
                        className="dashboard-input"
                      >
                        <option value="">Select response</option>
                        <option value="yes">Yes, taken</option>
                        <option value="no">Not taken</option>
                      </select>

                      <label className="dashboard-label">
                        How are you feeling?
                      </label>

                      <textarea
                        rows={3}
                        maxLength={2000}
                        value={form.responseNotes}
                        onChange={e =>
                          setForm(previous => ({
                            ...previous,
                            responseNotes: e.target.value,
                          }))
                        }
                        placeholder="Describe your symptoms or changes..."
                        className="dashboard-input"
                      />

                      <label className="dashboard-label">
                        Any side effects?
                      </label>

                      <textarea
                        rows={3}
                        maxLength={2000}
                        value={form.sideEffects}
                        onChange={e =>
                          setForm(previous => ({
                            ...previous,
                            sideEffects: e.target.value,
                          }))
                        }
                        placeholder="Describe any side effects experienced..."
                        className="dashboard-input"
                      />

                      <div className="flex flex-wrap gap-3">

                        <button
                          type="submit"
                          disabled={saving}
                          className="dashboard-button"
                        >
                          {saving ? 'Saving...' : 'Save response'}
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setSelected('')
                            setForm(initialLog)
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>

                      </div>

                    </form>

                  ) : (

                    <button
                      onClick={() => {
                        setSelected(medication.id)
                        setForm(initialLog)
                      }}
                      className="dashboard-button w-full gap-2"
                    >

                      <ClipboardPen size={18} />

                      Record medication response

                    </button>

                  )

                )

              }
            />

          ))}

        </div>

      )}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-xs leading-relaxed text-slate-600">

        Follow your doctor's medication instructions.
        Do not change dosage or discontinue medication based
        on sensor readings or automated evaluations.
        Recorded responses are not monitored as an emergency service.

      </div>

    </div>
  )
}