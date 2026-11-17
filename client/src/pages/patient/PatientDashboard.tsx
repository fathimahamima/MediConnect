import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'

import {
  HeartPulse,
  Droplets,
  Thermometer,
  Stethoscope,
  ShieldCheck,
  Cpu,
  Pill,
  Activity,
  BellRing,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

import VitalCard from '../../components/patient/VitalCard'
import { patientService } from '../../services/patient.service'
import {
  useLiveVitals,
} from '../../hooks/useLiveVitals'

import type {
  PatientPortalOverview,
} from '../../types/patient-portal'

export default function PatientDashboard() {
  const [data, setData] =
    useState<PatientPortalOverview | null>(null)

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const {
  reading: liveReading,
  status: liveStatus,
} = useLiveVitals(
  data?.patient.id,
  Boolean(data?.patient.monitoringConsentAt)
)

  async function loadOverview() {
    setLoading(true)
    setError('')

    try {
      const result =
        await patientService.getOverview()

      setData(result)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load patient dashboard'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
  }, [])

  async function updateConsent(consent: boolean) {
    if (updating) return

    const confirmed = window.confirm(
      consent
        ? 'Allow MediConnect to collect sensor-based health measurements and share them with your assigned doctor? This is an educational monitoring prototype.'
        : 'Withdraw monitoring permission? Your active monitoring device assignment will end. Existing health records may be retained.'
    )

    if (!confirmed) return

    setUpdating(true)

    try {
      const result =
        await patientService.updateMonitoringConsent(
          consent
        )

      toast.success(result.message)

      await loadOverview()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to update consent'
      )
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoaderCircle
          size={36}
          className="animate-spin text-indigo-600"
        />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="dashboard-card p-10 text-center">

        <AlertCircle
          size={36}
          className="mx-auto text-red-500"
        />

        <h2 className="mt-5 text-xl font-bold">
          Health workspace unavailable
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          {error || 'Patient information unavailable'}
        </p>

        <button
          onClick={loadOverview}
          className="dashboard-button mt-6"
        >
          Try again
        </button>

      </div>
    )
  }

  const {
  patient,
  medications,
  recoveryPlans,
  openAlerts,
  recentAlerts,
} = data

  const assignment = patient.assignments[0]

  const consent =
    Boolean(patient.monitoringConsentAt)

  
  return (
    <div className="space-y-7">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h1 className="text-3xl font-extrabold">
            My health overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your personal connected healthcare workspace.
          </p>
        </div>

        <button
          onClick={loadOverview}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      {/* Welcome banner */}

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-[#172554] shadow-xl"
      >

        <div
          className="absolute inset-0 bg-cover bg-right"
          style={{
            backgroundImage:
              "url('/images/healthcare-hero.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#080F26] via-[#172554]/95 to-[#172554]/55" />

        <div className="relative p-8 text-white md:p-11">

          <p className="text-xs font-semibold tracking-widest text-indigo-300">
            YOUR PERSONAL HEALTHSPACE
          </p>

          <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
            Welcome, {patient.user.fullName}.
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-7 text-indigo-100">
            Stay connected with your healthcare
            provider and follow your personal
            health journey.
          </p>

          <div className="mt-6 inline-flex rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold backdrop-blur-md">
            Patient ID: {patient.patientCode}
          </div>

        </div>

      </motion.section>

      {/* Vital sign cards */}

      <section>

        <div className="mb-4 flex items-center justify-between gap-3">

          <h2 className="text-lg font-bold">
            Health measurements
          </h2>

          <Link
            to="/patient/monitoring"
            className="text-sm font-semibold text-indigo-600"
          >
            View monitoring
          </Link>

        </div>

        <div className="grid gap-5 md:grid-cols-3">

          <div className="mb-4 flex items-center justify-between gap-3">

  <div>
    <h2 className="text-xl font-bold text-slate-900">
      Live vital signs
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Real-time sensor measurements
    </p>
  </div>

  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">

    <span
      className={`h-2.5 w-2.5 rounded-full ${
        liveStatus === 'LIVE'
          ? 'animate-pulse bg-emerald-500'
          : liveStatus === 'OFFLINE'
            ? 'bg-rose-500'
            : 'bg-amber-500'
      }`}
    />

    <span className="text-xs font-semibold text-slate-700">

      {liveStatus === 'LIVE'
        ? 'Live'
        : liveStatus === 'OFFLINE'
          ? 'Disconnected'
          : liveStatus === 'UNAVAILABLE'
            ? 'Monitoring unavailable'
            : 'Waiting for data'}

    </span>

  </div>

</div>
          <VitalCard
            title="Heart rate"
            value={
  liveStatus === 'LIVE'
    ? liveReading?.heartRate ?? null
    : null
}
            unit="BPM"
            icon={HeartPulse}
            color="rose"
            status={
  liveStatus === 'LIVE'
    ? 'Live measurement'
    : 'Awaiting live data'
}
          />

          <VitalCard
            title="Oxygen saturation"
            value={
  liveStatus === 'LIVE'
    ? liveReading?.spo2 ?? null
    : null
}
            unit="%"
            icon={Droplets}
            color="blue"
            status={
  liveStatus === 'LIVE'
    ? 'Live measurement'
    : 'Awaiting live data'
}
            index={1}
          />

          <VitalCard
  title="Temperature"
  value={
  liveStatus === 'LIVE'
    ? liveReading?.temperature ?? null
    : null
}
            unit="°C"
            icon={Thermometer}
            color="amber"
            status={
  liveStatus === 'LIVE'
    ? 'Live measurement'
    : 'Awaiting live data'
}
            index={2}
          />

        </div>

      </section>

      {/* Doctor and device */}

      <div className="grid gap-6 xl:grid-cols-2">

        <section className="dashboard-card p-6">

          <h2 className="text-lg font-bold">
            Your healthcare provider
          </h2>

          <div className="mt-6 flex items-center gap-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Stethoscope size={32} />
            </div>

            <div>

              <h3 className="text-lg font-bold">
                {patient.doctor.user.fullName}
              </h3>

              <p className="mt-1 text-sm text-indigo-600">
                {patient.doctor.specialization}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {patient.doctor.qualification}
              </p>

              {patient.doctor.hospital && (
                <p className="mt-1 text-xs text-slate-500">
                  {patient.doctor.hospital}
                </p>
              )}

            </div>

          </div>

        </section>

        <section className="dashboard-card p-6">

          <h2 className="flex items-center gap-3 text-lg font-bold">
            <Cpu className="text-indigo-500" />
            Monitoring device
          </h2>

          {assignment ? (
            <div className="mt-5 space-y-3 text-sm text-slate-600">

              <p>
                Device: {assignment.device.deviceName}
              </p>

              <p>
                ID: {assignment.device.deviceCode}
              </p>

              <p>
                Registration status:
                {' '}{assignment.device.status}
              </p>

              <p>
                Last communication:
                {' '}
                {assignment.device.lastSeenAt
                  ? new Date(
                      assignment.device.lastSeenAt
                    ).toLocaleString('en-IN')
                  : 'Not received'}
              </p>

            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 p-5">

              <p className="font-semibold text-slate-700">
                No device assigned
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Your healthcare provider will assign
                a monitoring device when available.
              </p>

            </div>
          )}

        </section>

      </div>

      {/* Medication and recovery */}

      <div className="grid gap-6 xl:grid-cols-2">

        <section className="dashboard-card p-6">

          <h2 className="flex items-center gap-3 text-lg font-bold">
            <Pill className="text-indigo-500" />
            My medication
          </h2>

          {medications.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No medications have been prescribed
              in MediConnect.
            </div>
          ) : (
            <div className="mt-5 space-y-3">

              {medications.map(medication => (
                <div
                  key={medication.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >

                  <p className="font-bold">
                    {medication.medicineName}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {medication.dosage}
                    {' · '}
                    {medication.frequency}
                  </p>

                </div>
              ))}

            </div>
          )}

          <Link
            to="/patient/medication"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
          >
            View medication
            <ArrowRight size={16} />
          </Link>

        </section>

        <section className="dashboard-card p-6">

          <h2 className="flex items-center gap-3 text-lg font-bold">
            <Activity className="text-indigo-500" />
            My recovery
          </h2>

          {recoveryPlans.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Your doctor has not created a
              recovery plan yet.
            </div>
          ) : (
            <div className="mt-5 space-y-3">

              {recoveryPlans.map(plan => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >

                  <p className="font-bold">
                    {plan.title}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {plan.expectedOutcome ||
                      'Recovery outcome not specified'}
                  </p>

                </div>
              ))}

            </div>
          )}

          <Link
            to="/patient/recovery"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
          >
            View recovery plan
            <ArrowRight size={16} />
          </Link>

        </section>

      </div>

      {/* Recent alerts */}

      <section className="dashboard-card p-6">

        <h2 className="flex items-center gap-3 text-lg font-bold">
          <BellRing className="text-indigo-500" />
          Recent notifications
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          {openAlerts} open alerts
        </p>

        {recentAlerts.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            No alerts have been recorded.
            This does not confirm that your health
            measurements are normal.
          </p>
        ) : (
          <div className="mt-5 space-y-3">

            {recentAlerts.map(alert => (
              <div
                key={alert.id}
                className="rounded-xl border border-slate-100 p-4"
              >

                <p className="font-semibold">
                  {alert.title}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {alert.message}
                </p>

                <p className="mt-3 text-xs text-indigo-600">
                  {alert.severity} · {alert.status}
                </p>

              </div>
            ))}

          </div>
        )}

      </section>

      {/* Monitoring consent */}

      <section className="dashboard-card p-6">

        <div className="flex flex-wrap items-start gap-4">

          <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
            <ShieldCheck size={28} />
          </div>

          <div className="min-w-[180px] flex-1">

            <h2 className="text-lg font-bold">
              Health monitoring permissions
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Allow MediConnect to collect health
              measurements using an assigned device
              and share those measurements with
              your registered doctor.
            </p>

            <p className={`mt-4 text-sm font-semibold ${
              consent
                ? 'text-emerald-600'
                : 'text-amber-600'
            }`}>
              {consent
                ? 'Monitoring consent recorded'
                : 'Monitoring permission not granted'}
            </p>

            {patient.monitoringConsentAt && (
              <p className="mt-2 text-xs text-slate-400">
                Recorded on {
                  new Date(
                    patient.monitoringConsentAt
                  ).toLocaleString('en-IN')
                }
              </p>
            )}

            <button
              disabled={updating}
              onClick={() => updateConsent(!consent)}
              className={`mt-5 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50 ${
                consent
                  ? 'border border-red-200 bg-red-50 text-red-700'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {updating
                ? 'Updating...'
                : consent
                  ? 'Withdraw permission'
                  : 'Allow health monitoring'}
            </button>

          </div>

        </div>

      </section>

    </div>
  )
}