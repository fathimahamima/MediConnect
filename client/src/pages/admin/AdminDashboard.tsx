import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

import {
  ShieldCheck,
  Users,
  Clock3,
  CheckCircle2,
  LogOut,
  RefreshCw,
  LoaderCircle,
} from 'lucide-react'

import { toast } from 'sonner'
import Logo from '../../components/shared/Logo'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

interface Doctor {
  id: string
  specialization: string
  registrationNumber: string
  qualification: string
  approval: 'PENDING' | 'APPROVED' | 'REJECTED'
  user: {
    fullName: string
    email: string
    emailVerified: boolean
    status: string
  }
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState('')

  async function loadDoctors() {
    setLoading(true)
    setError('')

    try {
      const data = await api<{
        doctors: Doctor[]
      }>('/admin/doctors')

      setDoctors(data.doctors)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load doctors'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDoctors()
  }, [])

  async function approveDoctor(
    id: string,
    approval: 'APPROVED' | 'REJECTED',
  ) {
    if (
      !window.confirm(
        `Confirm doctor ${approval.toLowerCase()}?`
      )
    ) return

    setUpdating(id)

    try {
      await api(`/admin/doctors/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approval }),
      })

      toast.success('Doctor status updated')

      await loadDoctors()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to update approval'
      )
    } finally {
      setUpdating('')
    }
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login?role=admin')
    } catch {
      toast.error('Logout failed. Please try again.')
    }
  }

  const stats = [
    {
      title: 'Registered doctors',
      value: doctors.length,
      icon: Users,
    },
    {
      title: 'Pending approvals',
      value: doctors.filter(
        doctor => doctor.approval === 'PENDING'
      ).length,
      icon: Clock3,
    },
    {
      title: 'Approved doctors',
      value: doctors.filter(
        doctor => doctor.approval === 'APPROVED'
      ).length,
      icon: CheckCircle2,
    },
  ]

  return (
    <main className="min-h-screen bg-[#080F26] text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-6 py-5 md:px-12">
        <Logo light />

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-300 sm:block">
            {user?.fullName}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm hover:bg-white/10"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center gap-3 text-indigo-300">
          <ShieldCheck size={22} />
          <span className="text-xs font-semibold tracking-widest">
            ADMINISTRATION
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
          Administration overview
        </h1>

        <p className="mt-3 text-sm text-slate-400">
  Manage registered healthcare professionals
  and account approvals.
</p>

<div className="mt-6">
  <Link
    to="/admin/devices"
    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
  >
    Manage monitoring devices
  </Link>
</div>

<div className="mt-8 grid gap-5 md:grid-cols-3">
          {stats.map(stat => (
            <div
              key={stat.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <stat.icon
                size={27}
                className="text-indigo-300"
              />

              <p className="mt-5 text-sm text-slate-400">
                {stat.title}
              </p>

              <p className="mt-2 text-4xl font-bold">
                {loading || error ? '—' : stat.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Doctor registrations
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Showing up to 100 recent registrations.
              </p>
            </div>

            <button
              onClick={loadDoctors}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoaderCircle
                className="animate-spin text-indigo-300"
              />
            </div>
          ) : error ? (
            <p role="alert" className="py-10 text-red-300">
              {error}
            </p>
          ) : doctors.length === 0 ? (
            <div className="py-16 text-center">
              <Users
                size={42}
                className="mx-auto text-slate-500"
              />

              <h3 className="mt-4 font-semibold">
                No registered doctors
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                New registrations will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">Registration</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Approval</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.map(doctor => (
                    <tr
                      key={doctor.id}
                      className="border-b border-white/5"
                    >
                      <td className="p-4">
                        <p className="font-semibold">
                          {doctor.user.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {doctor.user.email}
                        </p>
                      </td>

                      <td className="p-4">
                        {doctor.specialization}
                      </td>

                      <td className="p-4">
                        {doctor.registrationNumber}
                      </td>

                      <td className="p-4">
                        {doctor.user.emailVerified
                          ? 'Verified'
                          : 'Pending'}
                      </td>

                      <td className="p-4 text-indigo-200">
                        {doctor.approval}
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            disabled={
                              updating !== '' ||
                              doctor.approval === 'APPROVED'
                            }
                            onClick={() =>
                              approveDoctor(
                                doctor.id,
                                'APPROVED',
                              )
                            }
                            className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs text-emerald-300 disabled:opacity-40"
                          >
                            Approve
                          </button>

                          <button
                            disabled={
                              updating !== '' ||
                              doctor.approval === 'REJECTED'
                            }
                            onClick={() =>
                              approveDoctor(
                                doctor.id,
                                'REJECTED',
                              )
                            }
                            className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}