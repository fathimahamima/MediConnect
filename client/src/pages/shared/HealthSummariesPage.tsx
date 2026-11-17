import { useEffect, useState } from 'react'

import {
  Sparkles,
  FileCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import { toast } from 'sonner'

import { api } from '../../lib/api'
import { doctorService } from '../../services/doctor.service'

import type { Patient } from '../../types/patient'
import type { HealthSummary } from '../../types/summary'

interface Props {
  role: 'DOCTOR' | 'PATIENT'
}

export default function HealthSummariesPage({
  role,
}: Props) {

  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState('')
  const [days, setDays] = useState(7)

  const [summaries, setSummaries] =
    useState<HealthSummary[]>([])

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  const endpoint = role === 'DOCTOR'
    ? '/doctor/summaries'
    : '/patient/summaries'

  async function loadSummaries() {

    try {

      const result = await api<{
        summaries: HealthSummary[]
      }>(endpoint)

      setSummaries(result.summaries)
      setError('')

    } catch {

      setError('Unable to retrieve health summaries')

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    void loadSummaries()

    if (role !== 'DOCTOR') return

    async function loadPatients() {

      try {

        const first =
          await doctorService.getPatients('', 1)

        const all = [...first.patients]

        for (
          let page = 2;
          page <= first.totalPages;
          page++
        ) {

          const result =
            await doctorService.getPatients('', page)

          all.push(...result.patients)
        }

        setPatients(all)

      } catch {

        toast.error('Unable to retrieve patients')
      }
    }

    void loadPatients()

  }, [role])

  async function generate() {

    if (!patientId || busy) return

    if (!window.confirm(
      'Confirm this account contains fictional demonstration data only.'
    )) return

    setBusy(true)

    try {

      await api('/doctor/summaries/generate', {

        method: 'POST',

        body: JSON.stringify({
          patientId,
          days,
        }),
      })

      toast.success('AI summary generated for review')

      await loadSummaries()

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : 'AI generation failed'
      )

    } finally {

      setBusy(false)
    }
  }

  function startReview(summary: HealthSummary) {

    setEditingId(summary.id)
    setEditedContent(summary.content)
    setReviewNotes('')
  }

  async function review(
    decision: 'APPROVED' | 'REJECTED'
  ) {

    if (busy || !editingId) return

    if (
      editedContent.trim().length < 10 ||
      reviewNotes.trim().length < 3
    ) {

      toast.error('Complete the summary and review notes')

      return
    }

    if (
      decision === 'APPROVED' &&
      !window.confirm(
        'Confirm that you have verified the summary against the original records and approve it for patient viewing.'
      )
    ) return

    setBusy(true)

    try {

      await api(
        `/doctor/summaries/${editingId}/review`,
        {

          method: 'PATCH',

          body: JSON.stringify({
            decision,

            content: editedContent,

            reviewNotes,
          }),
        }
      )

      toast.success(
        decision === 'APPROVED'
          ? 'Summary approved for patient viewing'
          : 'Summary rejected'
      )

      setEditingId('')
      setEditedContent('')
      setReviewNotes('')

      await loadSummaries()

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to review summary'
      )

    } finally {

      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Intelligent health summaries
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            AI-assisted monitoring reports with doctor review.
          </p>

        </div>

        <button
          onClick={() => void loadSummaries()}
          className="dashboard-button gap-2"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      <div className="rounded-[28px] bg-gradient-to-br from-[#080F26] via-[#312E81] to-[#6366F1] p-8 text-white">

        <Sparkles
          size={38}
          className="mb-5 text-indigo-200"
        />

        <h2 className="text-2xl font-bold">
          From measurements to meaningful insights
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-indigo-100">

          Gemini generates descriptive summaries from
          experimental monitoring statistics. The treating
          doctor verifies each draft before publication.

        </p>

      </div>

      {role === 'DOCTOR' && (

        <div className="dashboard-card space-y-5 p-6">

          <h2 className="text-xl font-bold text-slate-900">
            Generate AI summary
          </h2>

          <div>

            <label className="dashboard-label">
              Select demo patient
            </label>

            <select
              disabled={busy}
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

          <div>

            <label className="dashboard-label">
              Reporting period
            </label>

            <select
              disabled={busy}
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="dashboard-input mt-2"
            >

              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>

            </select>

          </div>

          <p className="rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">

            AI generation is enabled only for authorized
            fictional demo accounts. Do not submit real
            patient information to this service.

          </p>

          <button
            disabled={busy || !patientId}
            onClick={() => void generate()}
            className="dashboard-button gap-2 disabled:opacity-50"
          >

            <Sparkles
              size={18}
              className={busy ? 'animate-pulse' : ''}
            />

            {busy
              ? 'Processing...'
              : 'Generate AI summary'}

          </button>

        </div>

      )}

      <h2 className="text-xl font-bold text-slate-900">

        {role === 'DOCTOR'
          ? 'Generated summaries'
          : 'Doctor-approved health summaries'}

      </h2>

      {loading ? (

        <p>Loading summaries...</p>

      ) : error ? (

        <p className="rounded-xl bg-rose-50 p-4 text-rose-700">
          {error}
        </p>

      ) : summaries.length === 0 ? (

        <div className="dashboard-card p-12 text-center">

          <FileCheck
            size={40}
            className="mx-auto mb-4 text-indigo-300"
          />

          <h3 className="font-bold">
            No summaries available
          </h3>

          <p className="mt-2 text-sm text-slate-500">

            {role === 'DOCTOR'
              ? 'Generate your first AI health summary.'
              : 'Approved summaries will appear here.'}

          </p>

        </div>

      ) : summaries.map(summary => (

        <div
          key={summary.id}
          className="dashboard-card space-y-5 p-6"
        >

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>

              <h3 className="font-bold text-slate-900">
                Health monitoring summary
              </h3>

              {summary.patient && (

                <p className="mt-1 text-sm text-slate-500">
                  {summary.patient.user.fullName}
                  {' · '}
                  {summary.patient.patientCode}
                </p>

              )}

            </div>

            <span className={`rounded-full px-3 py-2 text-xs font-semibold ${
              summary.status === 'APPROVED'

                ? 'bg-emerald-50 text-emerald-700'

                : summary.status === 'REJECTED'

                  ? 'bg-rose-50 text-rose-700'

                  : 'bg-amber-50 text-amber-700'
            }`}>

              {summary.status}

            </span>

          </div>

          <p className="text-xs text-slate-500">

            {new Date(
              summary.periodStart
            ).toLocaleDateString()}

            {' — '}

            {new Date(
              summary.periodEnd
            ).toLocaleDateString()}

          </p>

          {editingId === summary.id ? (

            <div className="space-y-4">

              <label className="dashboard-label">
                Verify and edit generated summary
              </label>

              <textarea
                disabled={busy}
                rows={14}
                maxLength={10000}
                value={editedContent}
                onChange={e =>
                  setEditedContent(e.target.value)
                }
                className="dashboard-input"
              />

              <label className="dashboard-label">
                Doctor review notes
              </label>

              <textarea
                disabled={busy}
                rows={3}
                maxLength={2000}
                value={reviewNotes}
                onChange={e =>
                  setReviewNotes(e.target.value)
                }
                className="dashboard-input"
              />

              <div className="flex flex-wrap gap-3">

                <button
                  disabled={busy}
                  onClick={() => void review('APPROVED')}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                >

                  Approve summary

                </button>

                <button
                  disabled={busy}
                  onClick={() => void review('REJECTED')}
                  className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white"
                >

                  Reject

                </button>

                <button
                  disabled={busy}
                  onClick={() => setEditingId('')}
                  className="rounded-xl bg-slate-100 px-5 py-3 text-sm text-slate-700"
                >

                  Cancel

                </button>

              </div>

            </div>

          ) : (

            <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">

              {summary.content}

            </div>

          )}

          {role === 'DOCTOR' &&
            summary.status === 'DRAFT' &&
            editingId !== summary.id && (

              <button
                disabled={busy}
                onClick={() => startReview(summary)}
                className="dashboard-button gap-2"
              >

                <ShieldCheck size={18} />

                Review AI draft

              </button>

            )}

          {summary.status === 'APPROVED' && (

            <p className="flex items-center gap-2 text-xs text-emerald-700">

              <ShieldCheck size={17} />

              Reviewed by treating doctor

            </p>

          )}

          {summary.reviewNotes && (

            <p className="text-xs text-slate-500">
              Review notes: {summary.reviewNotes}
            </p>

          )}

          <p className="text-xs text-slate-400">
            AI-assisted report · {summary.aiModel || 'Model unspecified'}
          </p>

        </div>

      ))}

      <p className="rounded-xl bg-indigo-50 p-4 text-xs leading-relaxed text-slate-600">

        AI-generated text may contain errors.
        These summaries do not establish a diagnosis,
        medical safety or treatment effectiveness.

      </p>

    </div>
  )
}