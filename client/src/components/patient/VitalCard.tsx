import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

interface VitalCardProps {
  title: string
  value: number | null
  unit: string
  icon: LucideIcon
  color: 'rose' | 'blue' | 'amber'
  status: string
  index?: number
}

const colors = {
  rose: {
    background: 'bg-rose-50',
    text: 'text-rose-500',
  },
  blue: {
    background: 'bg-blue-50',
    text: 'text-blue-500',
  },
  amber: {
    background: 'bg-amber-50',
    text: 'text-amber-500',
  },
}

export default function VitalCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  status,
  index = 0,
}: VitalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
      }}
      className="dashboard-card p-6"
    >

      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
        colors[color].background
      } ${colors[color].text}`}>
        <Icon size={28} />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <div className="mt-3 flex items-baseline gap-2">

        <span className="text-4xl font-extrabold text-slate-800">
          {value !== null ? value : '—'}
        </span>

        <span className="text-sm text-slate-400">
          {unit}
        </span>

      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-3">

        <p className="text-xs leading-5 text-slate-500">
          {status}
        </p>

      </div>

    </motion.div>
  )
}