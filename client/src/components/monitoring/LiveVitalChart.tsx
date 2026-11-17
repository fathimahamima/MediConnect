import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import {
  Activity,
  type LucideIcon,
} from 'lucide-react'

import { useId } from 'react'

import type {
  LiveReading,
} from '../../types/live-reading'

interface LiveVitalChartProps {

  title: string
  description: string

  unit: string

  color: string

  icon: LucideIcon

  dataKey:
    | 'heartRate'
    | 'spo2'
    | 'temperature'

  history: LiveReading[]
}

export default function LiveVitalChart({

  title,
  description,
  unit,
  color,
  icon: Icon,
  dataKey,
  history,

}: LiveVitalChartProps) {

  const gradientId =
    useId().replace(/:/g, '')

  const chartData = history.map(
    reading => ({

      time: new Date(
        reading.recordedAt
      ).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),

      value: reading[dataKey],
    })
  )

  const hasMeasurements =
    chartData.some(
      item => item.value !== null
    )

  return (

    <div className="dashboard-card overflow-hidden p-5 sm:p-6">

      <div className="mb-6 flex items-start justify-between gap-4">

        <div className="flex items-start gap-3">

          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${color}12`,
              color,
            }}
          >

            <Icon size={22} />

          </div>

          <div>

            <h3 className="font-bold text-slate-900">
              {title}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>

          </div>

        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {unit}
        </span>

      </div>

      {!hasMeasurements ? (

        <div className="flex h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">

          <Activity
            size={30}
            className="mb-3 text-slate-300"
          />

          <p className="text-sm font-semibold text-slate-600">
            Awaiting valid measurements
          </p>

          <p className="mt-2 px-4 text-center text-xs text-slate-400">
            Actual sensor readings will appear here.
          </p>

        </div>

      ) : (

        <div className="h-[240px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -15,
                bottom: 5,
              }}
            >

              <defs>

                <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor={color}
                    stopOpacity={0.25}
                  />

                  <stop
                    offset="100%"
                    stopColor={color}
                    stopOpacity={0}
                  />

                </linearGradient>

              </defs>

              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                minTickGap={40}
                tick={{
                  fontSize: 10,
                  fill: '#94A3B8',
                }}
              />

              <YAxis
                domain={
                  dataKey === 'spo2'
                    ? [0, 100]
                    : ['auto', 'auto']
                }
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: '#94A3B8',
                }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
                formatter={value => [
                  `${value} ${unit}`,
                  title,
                ]}
              />

              <Area
                type="linear"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                connectNulls={false}
                isAnimationActive={false}
                dot={{
                  r: 2,
                  fill: color,
                }}
                activeDot={{
                  r: 5,
                }}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

        <span className="text-xs text-slate-400">
          Current monitoring session
        </span>

        <span className="text-xs font-medium text-slate-500">
          {history.length} samples
        </span>

      </div>

    </div>
  )
}