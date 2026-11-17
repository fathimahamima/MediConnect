import type {
  LiveConnectionStatus,
} from '../../types/live-reading'

interface MonitoringStatusProps {
  status: LiveConnectionStatus
}

const statusConfig = {

  CONNECTING: {
    label: 'Connecting',
    style:
      'bg-indigo-50 text-indigo-700',
    dot: 'bg-indigo-500',
  },

  WAITING: {
    label: 'Awaiting data',
    style:
      'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },

  LIVE: {
    label: 'Live connection',
    style:
      'bg-emerald-50 text-emerald-700',
    dot: 'animate-pulse bg-emerald-500',
  },

  OFFLINE: {
    label: 'Disconnected',
    style:
      'bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
  },

  UNAVAILABLE: {
    label: 'Monitoring unavailable',
    style:
      'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
}

export default function MonitoringStatus({
  status,
}: MonitoringStatusProps) {

  const config = statusConfig[status]

  return (

    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${config.style}`}
    >

      <span
        className={`h-2.5 w-2.5 rounded-full ${config.dot}`}
      />

      {config.label}

    </div>

  )
}