import { useEffect, useState } from 'react'

import {
  FileText,
  Download,
  HeartPulse,
  Droplets,
  Thermometer,
  Activity,
} from 'lucide-react'

import { toast } from 'sonner'

import { api } from '../../lib/api'
import { doctorService } from '../../services/doctor.service'

import type { Patient } from '../../types/patient'
import type { HealthReport } from '../../types/report'

import HistoricalChart from
  '../../components/reports/HistoricalChart'

import { generateHealthPDF } from
  '../../utils/generateHealthPDF'

interface Props {
  role: 'DOCTOR' | 'PATIENT'
}

function dateInput(date: Date) {

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function HealthReportsPage({
  role,
}: Props) {

  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState('')

  const [from, setFrom] = useState(() => {

    const date = new Date()
    date.setDate(date.getDate() - 6)

    return dateInput(date)
  })

  const [to, setTo] = useState(
    () => dateInput(new Date())
  )

  const [report, setReport] =
    useState<HealthReport | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {

    if (role !== 'DOCTOR') return

    async function loadPatients() {

      try {

        const first =
          await doctorService.getPatients('', 1)

        const all = [...first.patients]

        for (
          let page = 2;
          page <= first.totalPages;
          page++
        ) {

          const result =
            await doctorService.getPatients('', page)

          all.push(...result.patients)
        }

        setPatients(all)

      } catch {
        toast.error('Unable to load patients')
      }
    }

    void loadPatients()

  }, [role])

  async function loadReport() {

    if (loading) return

    if (!from || !to) {
      toast.error('Select both dates')
      return
    }

    if (role === 'DOCTOR' && !patientId) {
      toast.error('Select a patient')
      return
    }

    setLoading(true)
    setReport(null)
    setError('')

    try {

      const start = new Date(`${from}T00:00:00`)
      const end = new Date(`${to}T00:00:00`)

      end.setDate(end.getDate() + 1)

      if (
        end <= start ||
        end.getTime() - start.getTime() >
          31 * 86400000
      ) {

        throw new Error(
          'Select a valid period of up to 31 days'
        )
      }

      const params = new URLSearchParams({

        from: start.toISOString(),

        to: end.toISOString(),
      })

      const endpoint =
        role === 'DOCTOR'
          ? `/doctor/reports/${patientId}`
          : '/patient/reports'

      const result = await api<HealthReport>(
        `${endpoint}?${params.toString()}`
      )

      setReport(result)

      toast.success('Health report generated')

    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to generate report'
      )

    } finally {
      setLoading(false)
    }
  }

  function download() {

    if (!report) return

    try {

      generateHealthPDF(report)

      toast.success('PDF report generated')

    } catch {
      toast.error('Unable to generate PDF')
    }
  }

  const stats = report ? [

    {
      title: 'Average heart rate',
      value: report.summary.heartRate.average,
      unit: 'BPM',
      count: report.summary.heartRate.count,
      icon: HeartPulse,
      color: 'text-rose-600',
    },

    {
      title: 'Average SpO₂',
      value: report.summary.spo2.average,
      unit: '%',
      count: report.summary.spo2.count,
      icon: Droplets,
      color: 'text-blue-600',
    },

    {
      title: 'Mean sensor temperature',
      value: report.summary.temperature.average,
      unit: '°C',
      count: report.summary.temperature.count,
      icon: Thermometer,
      color: 'text-amber-600',
    },

    {
      title: 'Stored measurements',
      value: report.summary.totalReadings,
      unit: 'records',
      count: null,
      icon: Activity,
      color: 'text-indigo-600',
    },

  ] : []

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          Health reports
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Historical measurements, treatment records
          and downloadable health reports.
        </p>

      </div>

      <div className="rounded-[28px] bg-gradient-to-br from-[#080F26] via-[#172554] to-[#4338CA] p-8 text-white">

        <FileText size={35} className="mb-5 text-indigo-300" />

        <h2 className="text-2xl font-bold">
          Health insights over time
        </h2>

        <p className="mt-3 max-w-xl text-sm text-indigo-200">
          Explore recorded vital trends and review
          patient monitoring history in one place.
        </p>

      </div>

      <div className="dashboard-card space-y-5 p-6">

        <h2 className="text-xl font-bold text-slate-900">
          Generate health report
        </h2>

        {role === 'DOCTOR' && (

          <div>

            <label className="dashboard-label">
              Select patient
            </label>

            <select
              disabled={loading}
              value={patientId}
              onChange={e => {
                setPatientId(e.target.value)
                setReport(null)
              }}
              className="dashboard-input mt-2"
            >

              <option value="">Choose patient</option>

              {patients.map(patient => (

                <option
                  key={patient.id}
                  value={patient.id}
                >

                  {patient.user.fullName}
                  {' — '}
                  {patient.patientCode}

                </option>

              ))}

            </select>

          </div>

        )}

        <div className="grid gap-4 md:grid-cols-2">

          <div>

            <label className="dashboard-label">
              From date
            </label>

            <input
              disabled={loading}
              type="date"
              value={from}
              onChange={e => {
                setFrom(e.target.value)
                setReport(null)
              }}
              className="dashboard-input mt-2"
            />

          </div>

          <div>

            <label className="dashboard-label">
              To date
            </label>

            <input
              disabled={loading}
              type="date"
              value={to}
              max={dateInput(new Date())}
              onChange={e => {
                setTo(e.target.value)
                setReport(null)
              }}
              className="dashboard-input mt-2"
            />

          </div>

        </div>

        <button
          disabled={loading}
          onClick={() => void loadReport()}
          className="dashboard-button gap-2"
        >

          <FileText size={18} />

          {loading ? 'Generating...' : 'Generate report'}

        </button>

      </div>

      {error && (

        <p className="rounded-xl bg-rose-50 p-4 text-rose-600">
          {error}
        </p>

      )}

      {report && (

        <>

          <div className="dashboard-card flex flex-wrap items-center justify-between gap-4 p-6">

            <div>

              <h2 className="text-xl font-bold">
                {report.patient.user.fullName}
              </h2>

              <p className="mt-1 text-xs text-slate-500">

                {report.patient.patientCode}
                {' · '}
                {from} to {to}

              </p>

            </div>

            <button
              onClick={download}
              className="dashboard-button gap-2"
            >

              <Download size={18} />
              Download PDF

            </button>

          </div>

          {report.truncated && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
              Report limited to 50,000 stored readings.
              Select a shorter period for complete results.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

            {stats.map(stat => (

              <div
                key={stat.title}
                className="dashboard-card p-5"
              >

                <stat.icon
                  size={25}
                  className={stat.color}
                />

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {stat.value ?? '—'}
                </p>

                <p className="text-xs text-slate-500">
                  {stat.unit}
                </p>

                <p className="mt-3 text-sm font-semibold">
                  {stat.title}
                </p>

                {stat.count !== null && (
                  <p className="mt-1 text-xs text-slate-400">
                    {stat.count} valid samples
                  </p>
                )}

              </div>

            ))}

          </div>

          <div className="grid gap-5 xl:grid-cols-2">

            <HistoricalChart
              title="Heart rate trend"
              unit="BPM"
              color="#E11D48"
              dataKey="heartRate"
              readings={report.readings}
            />

            <HistoricalChart
              title="Oxygen saturation trend"
              unit="%"
              color="#2563EB"
              dataKey="spo2"
              readings={report.readings}
            />

            <div className="xl:col-span-2">

              <HistoricalChart
                title="Sensor temperature trend"
                unit="°C"
                color="#D97706"
                dataKey="temperature"
                readings={report.readings}
              />

            </div>

          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div className="dashboard-card p-6">

              <h2 className="font-bold text-slate-900">
                Recorded health alerts
              </h2>

              <p className="mt-3 text-3xl font-bold text-amber-600">
                {report.alerts.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Up to 500 recent records in selected period
              </p>

            </div>

            <div className="dashboard-card p-6">

              <h2 className="font-bold text-slate-900">
                Medication response records
              </h2>

              <p className="mt-3 text-3xl font-bold text-indigo-600">
                {report.medicationLogs.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Up to 500 self-reported intake records
              </p>

            </div>

          </div>

          <p className="rounded-xl bg-indigo-50 p-5 text-xs leading-relaxed text-slate-600">
            Historical graphs display stored sensor snapshots,
            not continuous clinical monitoring.
            Lines between measurements do not establish
            what happened between samples.
            This report requires professional interpretation.
          </p>

        </>

      )}

    </div>
  )
}