import { Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Logo({
  light = false,
}: {
  light?: boolean
}) {
  return (
    <Link
      to="/"
      aria-label="MediConnect home"
      className="inline-flex items-center gap-3"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
        <Activity
          size={25}
          strokeWidth={2.5}
          className="text-white"
        />
      </div>

      <span
        className={`font-heading text-xl font-extrabold tracking-tight ${
          light ? 'text-white' : 'text-midnight'
        }`}
      >
        Medi<span className={
          light ? 'text-blue-300' : 'text-brand'
        }>Connect</span>
      </span>
    </Link>
  )
}