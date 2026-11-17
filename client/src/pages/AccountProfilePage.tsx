
import { useEffect, useState } from 'react'
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  CalendarDays,
  RefreshCw,
  BadgeCheck,
  LockKeyhole,
} from 'lucide-react'
import { motion } from 'motion/react'
import { api } from '../lib/api'

interface Profile {
  fullName: string
  email: string | null
  phone: string | null
  role: string
  status: string
  emailVerified: boolean
  createdAt: string

  doctor?: {
    specialization: string
    registrationNumber: string
    qualification: string
    hospital: string | null
    approval: string
  } | null

  patient?: {
    patientCode: string
    dateOfBirth: string | null
    gender: string | null
    bloodGroup: string | null
    monitoringConsentAt: string | null
    doctor: {
      specialization: string
      user: {
        fullName: string
      }
    }
  } | null
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString('en-IN')
    : 'Not provided'
}

function Info({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value || 'Not provided'}
      </p>
    </div>
  )
}

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProfile() {
    setLoading(true)
    setError('')

    try {
      const data = await api<{
        success: boolean
        profile: Profile
      }>('/profile')

      setProfile(data.profile)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load profile'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading your account...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="dashboard-card p-8">
        <p className="text-red-600">
          {error || 'Profile unavailable'}
        </p>

        <button
          onClick={loadProfile}
          className="dashboard-button mt-4"
        >
          Try again
        </button>
      </div>
    )
  }

  const initials = profile.fullName
    .split(' ')
    .slice(0, 2)
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Account
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your MediConnect profile and account information.
          </p>
        </div>

        <button
          onClick={loadProfile}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#080F26] via-[#172554] to-[#4361EE] p-8 text-white">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />

        <div className="relative flex flex-wrap items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl font-bold">
            {initials}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {profile.fullName}
              </h2>

              {profile.emailVerified && (
                <BadgeCheck
                  size={22}
                  className="text-blue-300"
                />
              )}
            </div>

            <p className="mt-2 text-indigo-200">
              {profile.role} ACCOUNT
            </p>

            <span className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs">
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
          <UserRound size={20} className="text-indigo-600" />
          Personal information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Full name" value={profile.fullName} />
          <Info label="Account role" value={profile.role} />
          <Info label="Email address" value={profile.email} />
          <Info label="Phone number" value={profile.phone} />
        </div>
      </div>

      {profile.doctor && (
        <div className="dashboard-card p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
            <Stethoscope size={20} className="text-indigo-600" />
            Professional information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Info
              label="Specialization"
              value={profile.doctor.specialization}
            />

            <Info
              label="Registration number"
              value={profile.doctor.registrationNumber}
            />

            <Info
              label="Qualification"
              value={profile.doctor.qualification}
            />

            <Info
              label="Hospital or clinic"
              value={profile.doctor.hospital}
            />

            <Info
              label="Approval status"
              value={profile.doctor.approval}
            />
          </div>
        </div>
      )}

      {profile.patient && (
        <div className="dashboard-card p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
            <HeartPulse size={20} className="text-indigo-600" />
            Patient information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Info
              label="Patient ID"
              value={profile.patient.patientCode}
            />

            <Info
              label="Date of birth"
              value={formatDate(profile.patient.dateOfBirth)}
            />

            <Info
              label="Gender"
              value={profile.patient.gender}
            />

            <Info
              label="Blood group"
              value={profile.patient.bloodGroup}
            />

            <Info
              label="Assigned doctor"
              value={profile.patient.doctor.user.fullName}
            />

            <Info
              label="Doctor specialization"
              value={profile.patient.doctor.specialization}
            />

            <Info
              label="Monitoring consent"
              value={
                profile.patient.monitoringConsentAt
                  ? 'Granted'
                  : 'Not granted'
              }
            />
          </div>
        </div>
      )}

      <div className="dashboard-card p-6">
        <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck size={20} className="text-indigo-600" />
          Account and security
        </h2>

        <div className="space-y-4">
          {[
            {
              icon: Mail,
              title: 'Email verification',
              value: profile.emailVerified
                ? 'Verified'
                : 'Not verified',
            },
            {
              icon: Phone,
              title: 'Registered phone',
              value: profile.phone || 'Not provided',
            },
            {
              icon: CalendarDays,
              title: 'Member since',
              value: formatDate(profile.createdAt),
            },
            {
              icon: LockKeyhole,
              title: 'Account status',
              value: profile.status,
            },
          ].map(item => (
            <div
              key={item.title}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className="text-indigo-500" />

                <span className="text-sm font-medium text-slate-700">
                  {item.title}
                </span>
              </div>

              <span className="text-sm font-semibold text-slate-800">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        MediConnect · Connected Care, Reimagined
      </p>
    </motion.div>
  )
}
