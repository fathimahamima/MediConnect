import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue'
  index?: number
}

const colors = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  blue: 'bg-blue-50 text-blue-600',
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.07,
      }}
      className="rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_4px_25px_rgba(30,41,59,0.04)] transition-shadow hover:shadow-lg"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}
      >
        <Icon size={24} />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </h3>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </motion.div>
  )
}