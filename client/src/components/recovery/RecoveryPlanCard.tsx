import {
  HeartPulse,
  Droplets,
  Thermometer,
  Target,
} from 'lucide-react'

import type { RecoveryPlan } from '../../types/recovery'

interface Props {
  plan: RecoveryPlan
  onDeactivate?: () => void
}

export default function RecoveryPlanCard({
  plan,
  onDeactivate,
}: Props) {

  const expired =
    plan.endDate &&
    new Date(plan.endDate).getTime() < Date.now()

  const scheduled =
    new Date(plan.startDate).getTime() > Date.now()

  const status =
    plan.isActive === false ? 'Inactive'
      : expired ? 'Ended'
      : scheduled ? 'Scheduled'
      : plan.status === 'ON_TRACK' ? 'Within latest targets'
      : plan.status === 'NEEDS_REVIEW' ? 'Needs review'
      : 'Awaiting evaluation'

  const targets = [
    {
      title: 'Heart rate',
      min: plan.heartRateMin,
      max: plan.heartRateMax,
      unit: 'BPM',
      icon: HeartPulse,
      style: 'bg-rose-50 text-rose-600',
    },
    {
      title: 'SpO₂',
      min: plan.spo2Min,
      max: plan.spo2Max,
      unit: '%',
      icon: Droplets,
      style: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Sensor temperature',
      min: plan.temperatureMin,
      max: plan.temperatureMax,
      unit: '°C',
      icon: Thermometer,
      style: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="dashboard-card overflow-hidden">

      <div className="bg-gradient-to-br from-[#080F26] to-[#3730A3] p-6 text-white">

        <Target className="mb-4 text-indigo-300" />

        <div className="flex flex-wrap items-center justify-between gap-3">

          <h2 className="text-xl font-bold">
            {plan.title}
          </h2>

          <span className="rounded-full bg-white/15 px-3 py-2 text-xs">
            {status}
          </span>

        </div>

        {plan.patient && (
          <p className="mt-2 text-sm text-indigo-200">
            {plan.patient.user.fullName}
            {' · '}
            {plan.patient.patientCode}
          </p>
        )}

        <p className="mt-3 text-sm text-indigo-200">
          {plan.description}
        </p>

      </div>

      <div className="space-y-5 p-6">

        <div className="grid gap-3 md:grid-cols-3">

          {targets.map(item => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className={`mb-3 inline-flex rounded-xl p-2 ${item.style}`}>
                <item.icon size={20} />
              </div>

              <p className="text-xs text-slate-500">
                {item.title}
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {item.min ?? '—'}
                {' – '}
                {item.max ?? '—'}
              </p>

              <p className="text-xs text-slate-500">
                {item.unit}
              </p>

            </div>
          ))}

        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Expected outcome
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {plan.expectedOutcome || 'Not specified'}
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Starts: {new Date(plan.startDate).toLocaleDateString()}
          {' · '}
          Ends: {plan.endDate
            ? new Date(plan.endDate).toLocaleDateString()
            : 'Ongoing'}
        </p>

        {onDeactivate && plan.isActive && (
          <button
            onClick={onDeactivate}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            Deactivate plan
          </button>
        )}

      </div>
    </div>
  )
}