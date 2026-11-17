import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock3,
} from 'lucide-react'

import type { ReactNode } from 'react'
import type { HealthAlert } from '../../types/alert'

interface Props {
  alert: HealthAlert
  action?: ReactNode
}

const severityStyles = {
  INFO: 'bg-blue-50 text-blue-700',
  WARNING: 'bg-amber-50 text-amber-700',
  CRITICAL: 'bg-rose-50 text-rose-700',
  EMERGENCY: 'bg-red-100 text-red-700',
}

export default function AlertCard({
  alert,
  action,
}: Props) {

  const Icon =
    alert.status === 'RESOLVED'
      ? CheckCircle2
      : alert.severity === 'EMERGENCY'
        ? ShieldAlert
        : AlertTriangle

  return (
    <div className="dashboard-card space-y-4 p-5 sm:p-6">

      <div className="flex flex-wrap items-start gap-4">

        <div className={`rounded-2xl p-3 ${
          severityStyles[alert.severity]
        }`}>
          <Icon size={25} />
        </div>

        <div className="min-w-0 flex-1">

          <h3 className="font-bold text-slate-900">
            {alert.title}
          </h3>

          {alert.patient && (
            <p className="mt-1 text-xs text-slate-500">
              {alert.patient.user.fullName}
              {' · '}
              {alert.patient.patientCode}
            </p>
          )}

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {alert.message}
          </p>

        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          severityStyles[alert.severity]
        }`}>
          {alert.severity}
        </span>

      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">

        <span className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 size={14} />
          {new Date(alert.createdAt).toLocaleString()}
        </span>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          alert.status === 'RESOLVED'
            ? 'bg-emerald-50 text-emerald-700'
            : alert.status === 'ACKNOWLEDGED'
              ? 'bg-indigo-50 text-indigo-700'
              : 'bg-amber-50 text-amber-700'
        }`}>
          {alert.status}
        </span>

      </div>

      {alert.resolutionNotes && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          Doctor's resolution notes:
          <p className="mt-1">
            {alert.resolutionNotes}
          </p>
        </div>
      )}

      {action}

    </div>
  )
}