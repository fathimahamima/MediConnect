import {
  Pill,
  Clock3,
  CalendarDays,
  ClipboardList,
} from 'lucide-react'

import type { ReactNode } from 'react'
import type { Medication } from '../../types/medication'

interface Props {
  medication: Medication
  action?: ReactNode
}

export function isMedicationCurrent(
  medication: Medication
) {
  const now = Date.now()

  return (
    medication.isActive &&
    new Date(medication.startDate).getTime() <= now &&
    (
      !medication.endDate ||
      new Date(medication.endDate).getTime() >= now
    )
  )
}

export default function MedicationCard({
  medication,
  action,
}: Props) {

  const current = isMedicationCurrent(medication)

  const status = !medication.isActive
    ? 'Inactive'
    : current
      ? 'Active'
      : new Date(medication.startDate).getTime() > Date.now()
        ? 'Scheduled'
        : 'Ended'

  const taken = medication.logs.filter(
    log => log.taken
  ).length

  const notTaken = medication.logs.filter(
    log => !log.taken
  ).length

  return (
    <div className="dashboard-card overflow-hidden">

      <div className="bg-gradient-to-br from-[#080F26] to-[#3730A3] p-6 text-white">

        <div className="flex items-center justify-between gap-3">

          <div className="rounded-2xl bg-white/10 p-3">
            <Pill size={25} />
          </div>

          <span className="rounded-full bg-white/15 px-4 py-2 text-xs">
            {status}
          </span>

        </div>

        <h2 className="mt-4 text-2xl font-bold">
          {medication.medicineName}
        </h2>

        <p className="mt-2 text-sm text-indigo-200">
          {medication.dosage}
        </p>

        {medication.patient && (
          <p className="mt-2 text-xs text-indigo-200">
            {medication.patient.user.fullName}
            {' · '}
            {medication.patient.patientCode}
          </p>
        )}

      </div>

      <div className="space-y-5 p-6">

        <div className="grid gap-3 sm:grid-cols-2">

          <div className="rounded-2xl bg-indigo-50 p-4">

            <Clock3 className="mb-3 text-indigo-600" size={20} />

            <p className="text-xs text-slate-500">
              Frequency
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {medication.frequency}
            </p>

          </div>

          <div className="rounded-2xl bg-slate-50 p-4">

            <CalendarDays className="mb-3 text-indigo-600" size={20} />

            <p className="text-xs text-slate-500">
              Treatment period
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">

              {new Date(
                medication.startDate
              ).toLocaleDateString()}

              {' — '}

              {medication.endDate
                ? new Date(
                    medication.endDate
                  ).toLocaleDateString()
                : 'Ongoing'}

            </p>

          </div>

        </div>

        <div>

          <h3 className="text-sm font-bold text-slate-800">
            Doctor's instructions
          </h3>

          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {medication.instructions || 'No additional instructions'}
          </p>

        </div>

        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-2xl font-bold text-emerald-700">
              {taken}
            </p>
            <p className="text-xs text-emerald-600">
              Taken records
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-2xl font-bold text-amber-700">
              {notTaken}
            </p>
            <p className="text-xs text-amber-600">
              Not taken records
            </p>
          </div>

        </div>

        {action}

        <div className="border-t border-slate-100 pt-5">

          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <ClipboardList size={19} />
            Recent treatment responses
          </h3>

          {medication.logs.length === 0 ? (

            <p className="mt-3 text-sm text-slate-500">
              No medication responses recorded yet.
            </p>

          ) : (

            <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto">

              {medication.logs.map(log => (

                <div
                  key={log.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >

                  <div className="flex flex-wrap items-center justify-between gap-2">

                    <span className={`text-xs font-semibold ${
                      log.taken
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}>
                      {log.taken ? 'Taken' : 'Not taken'}
                    </span>

                    <span className="text-xs text-slate-500">
                      {new Date(
                        log.createdAt
                      ).toLocaleString()}
                    </span>

                  </div>

                  {log.responseNotes && (
                    <p className="mt-3 text-sm text-slate-600">
                      Response: {log.responseNotes}
                    </p>
                  )}

                  {log.sideEffects && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      Reported side effects: {log.sideEffects}
                    </p>
                  )}

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  )
}