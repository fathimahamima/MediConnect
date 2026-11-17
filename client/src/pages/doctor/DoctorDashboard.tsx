import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

import {
  Users,
  UserCheck,
  Clock3,
  Cpu,
  BellRing,
  UserPlus,
  ArrowRight,
  Activity,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  CalendarDays,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { doctorService } from '../../services/doctor.service'

import StatCard from '../../components/doctor/StatCard'
import PatientTable from '../../components/doctor/PatientTable'

import type {
  DoctorOverview,
} from '../../types/patient'

export default function DoctorDashboard() {
  const { user } = useAuth()

  const [data, setData] =
    useState<DoctorOverview | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadOverview() {
    setLoading(true)
    setError('')

    try {
      const result =
        await doctorService.getOverview()

      setData(result)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load dashboard'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
  }, [])

  const today = new Date().toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )

  const stats = [
    {
      title: 'Total patients',
      value: data?.stats.totalPatients,
      description: 'Patients under your care',
      icon: Users,
      color: 'indigo' as const,
    },
    {
      title: 'Active accounts',
      value: data?.stats.activePatients,
      description: 'Activated patient accounts',
      icon: UserCheck,
      color: 'emerald' as const,
    },
    {
      title: 'Pending activation',
      value: data?.stats.pendingPatients,
      description: 'Awaiting account activation',
      icon: Clock3,
      color: 'amber' as const,
    },
    {
      title: 'Assigned devices',
      value: data?.stats.assignedDevices,
      description: 'Active-status assigned devices',
      icon: Cpu,
      color: 'blue' as const,
    },
    {
      title: 'Open alerts',
      value: data?.stats.openAlerts,
      description: 'Alerts awaiting attention',
      icon: BellRing,
      color: 'rose' as const,
    },
  ]

  return (
    <div className="space-y-7">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Dashboard overview
          </h1>

          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <CalendarDays size={16} />
            {today}
          </p>
        </div>

        <button
          onClick={loadOverview}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Premium welcome banner */}

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[26px] bg-[#172554] shadow-xl shadow-indigo-950/10"
      >
        <div
          className="absolute inset-0 bg-cover bg-right"
          style={{
            backgroundImage:
              "url('/images/healthcare-hero.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#101B3B] via-[#172554]/95 to-[#172554]/50" />

        <div className="relative z-10 p-7 md:p-10">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-[10px] font-semibold tracking-widest text-indigo-200">
            <Activity size={14} />
            CONNECTED CARE WORKSPACE
          </div>

          <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-4xl">
            Welcome, {user?.fullName}.
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-7 text-indigo-100/80">
            Monitor, manage and support your patients
            from one intelligent connected healthcare
            workspace.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/doctor/patients/new"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-indigo-700 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <UserPlus size={19} />
              Register patient
            </Link>

            <Link
              to="/doctor/patients"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/10"
            >
              View patients
              <ArrowRight size={17} />
            </Link>
          </div>

        </div>
      </motion.section>

      {/* Error state */}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle
            size={21}
            className="shrink-0"
          />
          {error}
        </div>
      )}

      {/* Live database statistics */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={
              loading || error
                ? '—'
                : stat.value ?? '—'
            }
            description={stat.description}
            icon={stat.icon}
            color={stat.color}
            index={index}
          />
        ))}
      </section>

      {/* Recent patient records */}

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-bold">
              Recent patients
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Your most recently registered patients
            </p>
          </div>

          <Link
            to="/doctor/patients"
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoaderCircle
              size={30}
              className="animate-spin text-indigo-500"
            />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-slate-400">
            Patient records are currently unavailable.
          </p>
        ) : (
          <PatientTable
            patients={data?.recentPatients || []}
          />
        )}
      </motion.section>

      {/* Quick access cards */}

      <section>
        <h2 className="mb-4 text-lg font-bold">
          Quick access
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Live monitoring',
              description:
                'View connected patient vital signs.',
              icon: Activity,
              path: '/doctor/monitoring',
            },
            {
              title: 'Manage devices',
              description:
                'Manage patient monitoring assignments.',
              icon: Cpu,
              path: '/doctor/devices',
            },
            {
              title: 'Review alerts',
              description:
                'Review patient health notifications.',
              icon: BellRing,
              path: '/doctor/alerts',
            },
          ].map(item => (
            <Link
              key={item.title}
              to={item.path}
              className="group rounded-2xl border border-slate-200/70 bg-white p-6 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <item.icon size={23} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600"
                />
              </div>

              <h3 className="mt-5 font-bold text-slate-800">
                {item.title}
              </h3>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}