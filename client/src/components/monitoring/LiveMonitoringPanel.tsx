import {
  HeartPulse,
  Droplets,
  Thermometer,
  Cpu,
  ShieldCheck,
  Clock3,
  Radio,
  Info,
} from 'lucide-react'

import { motion } from 'motion/react'

import {
  useLiveVitals,
} from '../../hooks/useLiveVitals'

import VitalCard
  from '../patient/VitalCard'

import LiveVitalChart
  from './LiveVitalChart'

import MonitoringStatus
  from './MonitoringStatus'

interface LiveMonitoringPanelProps {

  patientId: string

  patientName: string

  deviceName?: string

  deviceCode?: string

  monitoringEnabled: boolean
}

export default function LiveMonitoringPanel({

  patientId,

  patientName,

  deviceName,

  deviceCode,

  monitoringEnabled,

}: LiveMonitoringPanelProps) {

  const {
    reading,
    history,
    status,
  } = useLiveVitals(
    patientId,
    monitoringEnabled
  )

  const currentReading =
    status === 'LIVE'
      ? reading
      : null

  const quality =
    currentReading?.signalQuality

  const qualityLabel =

    quality === 'GOOD'
      ? 'Optical readings available'

      : quality === 'NO_CONTACT'
        ? 'Finger not detected'

        : quality === 'POOR'
          ? 'Optical signal unstable'

          : quality === 'SENSOR_ERROR'
            ? 'Sensor error'

            : 'Awaiting measurements'

  const lastUpdated =
    currentReading?.recordedAt

      ? new Date(
          currentReading.recordedAt
        ).toLocaleTimeString('en-IN')

      : 'Not available'

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 12,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        duration: 0.3,
      }}

      className="space-y-6"

    >

      {/* MONITORING HERO */}

      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#080F26] via-[#172554] to-[#3730A3] p-7 text-white sm:p-9">

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">

              <Radio size={15} />

              Real-time monitoring

            </div>

            <MonitoringStatus
              status={status}
            />

          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">

            Health monitoring

          </h2>

          <p className="mt-3 text-sm text-indigo-200">

            Monitoring session for {patientName}

          </p>

          <div className="mt-7 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-white/10 p-3">

                <Cpu size={20} />

              </div>

              <div>

                <p className="text-xs text-indigo-200">
                  Assigned device
                </p>

                <p className="mt-1 text-sm font-semibold">

                  {deviceName ||
                    'No device assigned'}

                </p>

                {deviceCode && (

                  <p className="mt-1 text-xs text-indigo-300">
                    {deviceCode}
                  </p>

                )}

              </div>

            </div>

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-white/10 p-3">

                <Clock3 size={20} />

              </div>

              <div>

                <p className="text-xs text-indigo-200">
                  Latest live measurement
                </p>

                <p className="mt-1 text-sm font-semibold">

                  {lastUpdated}

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* DISCONNECTED / CONSENT STATUS */}

      {!monitoringEnabled && (

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">

          <Info
            size={20}
            className="shrink-0 text-amber-600"
          />

          <div>

            <p className="font-semibold text-amber-900">
              Monitoring is not enabled
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Active patient consent and a device assignment are required.
            </p>

          </div>

        </div>

      )}

      {/* LIVE VITAL CARDS */}

      <div className="grid gap-5 md:grid-cols-3">

        <VitalCard

          title="Heart rate"

          value={
            currentReading?.heartRate ?? null
          }

          unit="BPM"

          icon={HeartPulse}

          color="rose"

          status={
            currentReading?.heartRate != null
              ? 'Live measurement'
              : 'Reading unavailable'
          }

          index={0}

        />

        <VitalCard

          title="Oxygen saturation"

          value={
            currentReading?.spo2 ?? null
          }

          unit="%"

          icon={Droplets}

          color="blue"

          status={
            currentReading?.spo2 != null
              ? 'Live measurement'
              : 'Reading unavailable'
          }

          index={1}

        />

        <VitalCard

          title="Sensor temperature"

          value={
            currentReading?.temperature ?? null
          }

          unit="°C"

          icon={Thermometer}

          color="amber"

          status={
            currentReading?.temperature != null
              ? 'Live measurement'
              : 'Reading unavailable'
          }

          index={2}

        />

      </div>

      {/* SIGNAL QUALITY */}

      <div className="dashboard-card flex flex-wrap items-center justify-between gap-4 p-5">

        <div className="flex items-center gap-4">

          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">

            <ShieldCheck size={23} />

          </div>

          <div>

            <p className="text-sm font-bold text-slate-900">
              Sensor signal quality
            </p>

            <p className="mt-1 text-xs text-slate-500">

              {qualityLabel}

            </p>

          </div>

        </div>

        <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">

          {quality?.replaceAll('_', ' ') ||
            'UNAVAILABLE'}

        </span>

      </div>

      {/* REAL-TIME CHARTS */}

      <div>

        <h3 className="text-xl font-bold text-slate-900">
          Live health trends
        </h3>

        <p className="mt-1 text-sm text-slate-500">

          Recent measurements from the current monitoring session.

        </p>

      </div>

      {status !== 'LIVE' &&
        history.length > 0 && (

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">

          Live connection unavailable.
          Charts show previously received session readings.

        </div>

      )}

      <div className="grid gap-5 xl:grid-cols-2">

        <LiveVitalChart

          title="Heart rate trend"

          description="Recent pulse measurements"

          unit="BPM"

          icon={HeartPulse}

          color="#E11D48"

          dataKey="heartRate"

          history={history}

        />

        <LiveVitalChart

          title="Oxygen saturation trend"

          description="Recent optical SpO2 estimates"

          unit="%"

          icon={Droplets}

          color="#4361EE"

          dataKey="spo2"

          history={history}

        />

        <div className="xl:col-span-2">

          <LiveVitalChart

            title="Temperature trend"

            description="Recent DS18B20 sensor measurements"

            unit="°C"

            icon={Thermometer}

            color="#D97706"

            dataKey="temperature"

            history={history}

          />

        </div>

      </div>

      {/* SAFETY NOTICE */}

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">

        <Info
          size={19}
          className="shrink-0 text-indigo-600"
        />

        <p className="text-xs leading-relaxed text-slate-600">

          MediConnect is an experimental monitoring
          prototype. Sensor measurements are not
          clinically validated and must not replace
          professional medical assessment.

        </p>

      </div>

    </motion.div>

  )
}