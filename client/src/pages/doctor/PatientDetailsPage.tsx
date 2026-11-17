import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  HeartPulse,
  CalendarDays,
  Droplets,
  ShieldCheck,
  Cpu,
  Send,
  LoaderCircle,
  Activity,
  AlertCircle,
} from 'lucide-react'

import { doctorService } from '../../services/doctor.service'

import type {
  PatientDetails,
} from '../../types/patient'

function Detail({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-700">
        {value || 'Not provided'}
      </p>
    </div>
  )
}

export default function PatientDetailsPage() {
  const { id } = useParams()

  const [patient, setPatient] =
    useState<PatientDetails | null>(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadPatient() {
      setLoading(true)
      setError('')

      try {
        if (!id) {
          throw new Error('Patient ID missing')
        }

        const result =
          await doctorService.getPatient(id)

        if (!cancelled) {
          setPatient(result.patient)
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load patient'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPatient()

    return () => {
      cancelled = true
    }
  }, [id, refresh])

  async function resendInvitation() {
    if (!patient || sending) return

    setSending(true)

    try {
      const result =
        await doctorService.resendInvitation(
          patient.id
        )

      toast.success(result.message)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to resend invitation'
      )
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoaderCircle
          size={34}
          className="animate-spin text-indigo-600"
        />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="dashboard-card p-10 text-center">

        <AlertCircle
          size={36}
          className="mx-auto text-red-500"
        />

        <h2 className="mt-4 text-xl font-bold">
          Patient unavailable
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          {error || 'Patient not found'}
        </p>

        <Link
          to="/doctor/patients"
          className="dashboard-button mt-6"
        >
          Back to patients
        </Link>

      </div>
    )
  }

  const status = patient.user.status

  return (
    <div className="space-y-7">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back to patients
        </Link>

        <button
          onClick={() => setRefresh(value => value + 1)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        >
          Refresh profile
        </button>

      </div>

      <section className="relative overflow-hidden rounded-[28px] bg-[#172554] p-7 text-white md:p-10">

        <div
          className="absolute inset-0 bg-cover bg-right opacity-20"
          style={{
            backgroundImage:
              "url('/images/healthcare-hero.jpg')",
          }}
        />

        <div className="relative flex flex-wrap items-center gap-6">

          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-3xl font-bold backdrop-blur-xl">
            {patient.user.fullName
              .split(' ')
              .slice(0, 2)
              .map(name => name[0])
              .join('')
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">

            <p className="text-xs font-semibold tracking-widest text-indigo-300">
              PATIENT PROFILE
            </p>

            <h1 className="mt-3 text-3xl font-extrabold">
              {patient.user.fullName}
            </h1>

            <p className="mt-3 text-sm text-indigo-200">
              {patient.patientCode}
            </p>

            <div className="mt-5">
              <span className={`rounded-full px-4 py-2 text-xs font-semibold ${
                status === 'ACTIVE'
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : status === 'PENDING'
                    ? 'bg-amber-400/15 text-amber-200'
                    : 'bg-red-400/15 text-red-200'
              }`}>
                {status === 'ACTIVE'
                  ? 'Active account'
                  : status === 'PENDING'
                    ? 'Awaiting activation'
                    : 'Suspended account'}
              </span>
            </div>

          </div>

          {status === 'PENDING' && (
            <button
              onClick={resendInvitation}
              disabled={sending}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-indigo-700 disabled:opacity-50"
            >

              {sending ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Send size={18} />
              )}

              Resend invitation
            </button>
          )}

        </div>

      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {[
          {
            label: 'Blood group',
            value: patient.bloodGroup || 'Not provided',
            icon: Droplets,
          },
          {
            label: 'Date of birth',
            value: patient.dateOfBirth
              ? patient.dateOfBirth.slice(0, 10)
              : 'Not provided',
            icon: CalendarDays,
          },
          {
            label: 'Gender',
            value: patient.gender || 'Not provided',
            icon: UserRound,
          },
          {
            label: 'Monitoring consent',
            value: patient.monitoringConsentAt
              ? 'Recorded'
              : 'Not recorded',
            icon: ShieldCheck,
          },
        ].map(item => (
          <div
            key={item.label}
            className="dashboard-card p-5"
          >
            <item.icon
              size={24}
              className="mb-4 text-indigo-500"
            />

            <Detail
              label={item.label}
              value={item.value}
            />
          </div>
        ))}

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <section className="dashboard-card p-6">

          <h2 className="mb-6 flex items-center gap-3 text-lg font-bold">
            <UserRound className="text-indigo-500" />
            Personal information
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">

            <Detail
              label="Full name"
              value={patient.user.fullName}
            />

            <Detail
              label="Patient ID"
              value={patient.patientCode}
            />

            <Detail
              label="Email address"
              value={patient.user.email}
            />

            <Detail
              label="Phone number"
              value={patient.user.phone}
            />

            <Detail
              label="Email verification"
              value={
                patient.user.emailVerified
                  ? 'Verified'
                  : 'Not verified'
              }
            />

            <Detail
              label="Registered on"
              value={new Date(
                patient.createdAt
              ).toLocaleDateString('en-IN')}
            />

          </div>

        </section>

        <section className="dashboard-card p-6">

          <h2 className="mb-6 flex items-center gap-3 text-lg font-bold">
            <HeartPulse className="text-indigo-500" />
            Medical information
          </h2>

          <div className="rounded-xl bg-slate-50 p-5">

            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
              {patient.medicalNotes ||
                'No medical notes recorded.'}
            </p>

          </div>

        </section>

        <section className="dashboard-card p-6">

          <h2 className="mb-6 flex items-center gap-3 text-lg font-bold">
            <Phone className="text-indigo-500" />
            Emergency contacts
          </h2>

          {patient.emergencyContacts.length === 0 ? (
            <p className="text-sm text-slate-400">
              No emergency contacts registered.
            </p>
          ) : (
            <div className="space-y-4">

              {patient.emergencyContacts.map(contact => (
                <div
                  key={contact.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                >

                  <p className="font-bold text-slate-800">
                    {contact.fullName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {contact.relationship}
                    {contact.isPrimary
                      ? ' · Primary contact'
                      : ''}
                  </p>

                  <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={16} />
                    {contact.phone || 'Not provided'}
                  </p>

                  <p className="mt-3 flex items-center gap-2 break-all text-sm text-slate-600">
                    <Mail size={16} />
                    {contact.email || 'Not provided'}
                  </p>

                  <p className={`mt-4 text-xs font-semibold ${
                    contact.consentAt
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}>
                    {contact.consentAt
                      ? 'Notification consent recorded'
                      : 'Notification consent not recorded'}
                  </p>

                </div>
              ))}

            </div>
          )}

        </section>

        <section className="dashboard-card p-6">

          <h2 className="mb-6 flex items-center gap-3 text-lg font-bold">
            <Cpu className="text-indigo-500" />
            Monitoring device
          </h2>

          {patient.assignments.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center">

              <Cpu
                size={38}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-bold text-slate-700">
                No device assigned
              </h3>

              <p className="mt-2 text-xs leading-6 text-slate-400">
                Assign a registered ESP32 device
                to enable patient monitoring.
              </p>

              <Link
                to="/doctor/devices"
                className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white"
              >
                Manage devices
              </Link>

            </div>
          ) : (
            patient.assignments.map(assignment => (
              <div
                key={assignment.id}
                className="space-y-4 rounded-xl bg-slate-50 p-5"
              >

                <Detail
                  label="Device name"
                  value={assignment.device.deviceName}
                />

                <Detail
                  label="Device ID"
                  value={assignment.device.deviceCode}
                />

                <Detail
                  label="Device registration status"
                  value={assignment.device.status}
                />

                <Detail
                  label="Last communication"
                  value={
                    assignment.device.lastSeenAt
                      ? new Date(
                          assignment.device.lastSeenAt
                        ).toLocaleString('en-IN')
                      : 'No communication received'
                  }
                />

              </div>
            ))
          )}

        </section>

      </div>

      <section className="dashboard-card p-6">

        <h2 className="flex items-center gap-3 text-lg font-bold">
          <Activity className="text-indigo-500" />
          Health monitoring
        </h2>

        <div className="grid gap-4 py-6 md:grid-cols-3">

          {[
            {
              name: 'Heart rate',
              unit: 'BPM',
              icon: HeartPulse,
              color: 'text-rose-500',
            },
            {
              name: 'Oxygen saturation',
              unit: '%',
              icon: Droplets,
              color: 'text-blue-500',
            },
            {
              name: 'Body temperature',
              unit: '°C',
              icon: Activity,
              color: 'text-amber-500',
            },
          ].map(vital => (
            <div
              key={vital.name}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
            >

              <vital.icon
                className={vital.color}
                size={24}
              />

              <p className="mt-4 text-sm text-slate-500">
                {vital.name}
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-700">
                —
                <span className="ml-2 text-xs text-slate-400">
                  {vital.unit}
                </span>
              </p>

              <p className="mt-3 text-xs text-slate-400">
                Monitoring not connected
              </p>

            </div>
          ))}

        </div>

        <Link
          to="/doctor/monitoring"
          className="text-sm font-semibold text-indigo-600"
        >
          Open monitoring workspace →
        </Link>

      </section>

    </div>
  )
}