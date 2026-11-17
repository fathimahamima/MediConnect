import { Link } from 'react-router-dom'

import {
  Users,
  ArrowUpRight,
} from 'lucide-react'

import type { Patient } from '../../types/patient'

const statusColors = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  SUSPENDED: 'bg-red-50 text-red-700',
}

export default function PatientTable({
  patients,
}: {
  patients: Patient[]
}) {
  if (patients.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
          <Users size={30} />
        </div>

        <h3 className="mt-5 font-bold text-slate-800">
          No patients found
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          Registered patient records will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left">

        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr className="text-xs font-semibold text-slate-500">
            <th className="px-5 py-4">
              Patient
            </th>

            <th className="px-5 py-4">
              Patient ID
            </th>

            <th className="px-5 py-4">
              Blood group
            </th>

            <th className="px-5 py-4">
              Account status
            </th>

            <th className="px-5 py-4">
              Profile
            </th>
          </tr>
        </thead>

        <tbody>
          {patients.map(patient => (
            <tr
              key={patient.id}
              className="border-b border-slate-100 transition-colors last:border-0 hover:bg-indigo-50/30"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {patient.user.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map(name => name[0])
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {patient.user.fullName}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {patient.user.email || 'No email'}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4 text-xs font-semibold text-indigo-600">
                {patient.patientCode}
              </td>

              <td className="px-5 py-4 text-sm text-slate-600">
                {patient.bloodGroup || 'Not provided'}
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${statusColors[patient.user.status]}`}
                >
                  {patient.user.status === 'PENDING'
                    ? 'Awaiting activation'
                    : patient.user.status === 'ACTIVE'
                      ? 'Active'
                      : 'Suspended'}
                </span>
              </td>

              <td className="px-5 py-4">
                <Link
                  to={`/doctor/patients/${patient.id}`}
                  aria-label={`View ${patient.user.fullName}`}
                  className="inline-flex rounded-xl border border-slate-200 p-2.5 text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                  <ArrowUpRight size={19} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}