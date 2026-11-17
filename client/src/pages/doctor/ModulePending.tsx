import {
  Construction,
  ArrowLeft,
} from 'lucide-react'

import { Link } from 'react-router-dom'

export default function ModulePending({
  title,
  description,
  backTo = '/doctor/dashboard',
}: {
  title: string
  description: string
  backTo?: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500">
          <Construction size={35} />
        </div>

        <h2 className="mt-6 text-xl font-bold">
          Module under development
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500">
          This feature will become available after its
          backend and interface have been connected.
          No simulated patient information is displayed.
        </p>

        <Link
          to={backTo}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft size={17} />
          Back to overview
        </Link>
      </div>
    </div>
  )
}