import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { patientService } from '../../services/patient.service'

import type { RecoveryPlan } from '../../types/recovery'

import RecoveryPlanCard from '../../components/recovery/RecoveryPlanCard'

import { useLiveVitals } from '../../hooks/useLiveVitals'

export default function PatientRecoveryPage() {

  const [plans, setPlans] = useState<RecoveryPlan[]>([])
  const [patientId, setPatientId] = useState<string>()
  const [enabled, setEnabled] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { reading, status } = useLiveVitals(
    patientId,
    enabled
  )

  async function loadData() {
    try {
      setError('')

      const data = await patientService.getOverview()

      setPatientId(data.patient.id)

      setEnabled(
        Boolean(data.patient.monitoringConsentAt)
      )

      setPlans(data.recoveryPlans)

    } catch {
      setError('Unable to load recovery information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    void loadData()

    const timer = window.setInterval(
      () => void loadData(),
      60000
    )

    return () => window.clearInterval(timer)

  }, [])

  const current = status === 'LIVE' ? reading : null

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            My recovery
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Follow your doctor's personalized recovery targets.
          </p>
        </div>

        <button
          className="dashboard-button gap-2"
          onClick={() => void loadData()}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      {loading ? (
        <p>Loading recovery information...</p>

      ) : error ? (
        <p className="text-rose-600">{error}</p>

      ) : plans.length === 0 ? (

        <div className="dashboard-card p-10 text-center">
          <h2 className="font-bold">No recovery plan assigned</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your doctor's recovery plan will appear here.
          </p>
        </div>

      ) : (

        plans.map(plan => {

          const now = Date.now()

          const applicable =
            new Date(plan.startDate).getTime() <= now &&
            (
              !plan.endDate ||
              new Date(plan.endDate).getTime() >= now
            )

          const comparisons = [
            {
              name: 'Heart rate',
              value: current?.heartRate ?? null,
              min: plan.heartRateMin,
              max: plan.heartRateMax,
              unit: 'BPM',
            },
            {
              name: 'SpO₂',
              value: current?.spo2 ?? null,
              min: plan.spo2Min,
              max: plan.spo2Max,
              unit: '%',
            },
            {
              name: 'Sensor temperature',
              value: current?.temperature ?? null,
              min: plan.temperatureMin,
              max: plan.temperatureMax,
              unit: '°C',
            },
          ]

          return (
            <div key={plan.id} className="space-y-5">

              <RecoveryPlanCard plan={plan} />

              {applicable && (

                <div className="dashboard-card p-6">

                  <h2 className="text-xl font-bold text-slate-900">
                    Expected vs actual
                  </h2>

                  <div className="mt-5 overflow-x-auto">

                    <table className="w-full min-w-[500px] text-left text-sm">

                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="p-3">Parameter</th>
                          <th className="p-3">Target range</th>
                          <th className="p-3">Actual</th>
                          <th className="p-3">Comparison</th>
                        </tr>
                      </thead>

                      <tbody>

                        {comparisons.map(item => {

                          const available =
                            item.value !== null &&
                            item.min !== null &&
                            item.max !== null

                          const within =
                            available &&
                            item.value! >= item.min! &&
                            item.value! <= item.max!

                          return (
                            <tr
                              key={item.name}
                              className="border-b border-slate-100"
                            >

                              <td className="p-3 font-medium">
                                {item.name}
                              </td>

                              <td className="p-3">
                                {item.min} – {item.max} {item.unit}
                              </td>

                              <td className="p-3 font-semibold">
                                {item.value ?? '—'} {item.unit}
                              </td>

                              <td className="p-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  !available
                                    ? 'bg-slate-100 text-slate-500'
                                    : within
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {!available
                                    ? 'Unavailable'
                                    : within
                                      ? 'Within target'
                                      : 'Outside target'}
                                </span>
                              </td>

                            </tr>
                          )
                        })}

                      </tbody>
                    </table>

                  </div>

                  <p className="mt-5 text-xs leading-relaxed text-slate-500">
                    Target comparisons are based on experimental
                    sensor measurements. They do not establish
                    treatment effectiveness or replace medical advice.
                  </p>

                </div>
              )}

            </div>
          )
        })
      )}
    </div>
  )
}