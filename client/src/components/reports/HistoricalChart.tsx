import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import { useId } from 'react'
import type { HealthReport } from '../../types/report'

interface Props {

  title: string
  unit: string
  color: string

  dataKey:
    | 'heartRate'
    | 'spo2'
    | 'temperature'

  readings: HealthReport['readings']
}

export default function HistoricalChart({
  title,
  unit,
  color,
  dataKey,
  readings,
}: Props) {

  const gradientId = useId()

  const data = readings.map(reading => ({

    timestamp: new Date(
      reading.recordedAt
    ).getTime(),

    value:
      dataKey !== 'temperature' &&
      reading.signalQuality !== 'GOOD'
        ? null
        : reading[dataKey],
  }))

  const hasData = data.some(
    item => item.value !== null
  )

  return (
    <div className="dashboard-card p-6">

      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        Historical measurements · {unit}
      </p>

      {!hasData ? (

        <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">
          No valid measurements in this period.
        </div>

      ) : (

        <div className="mt-5 h-[260px]">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={data}>

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
                    stopOpacity={0.02}
                  />

                </linearGradient>

              </defs>

              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={value =>
                  new Date(value).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                tick={{ fontSize: 10 }}
                minTickGap={55}
              />

              <YAxis
                tick={{ fontSize: 11 }}
                domain={
                  dataKey === 'spo2'
                    ? [0, 100]
                    : ['auto', 'auto']
                }
              />

              <Tooltip
                labelFormatter={value =>
                  new Date(Number(value)).toLocaleString()
                }
                formatter={value => [
                  `${value} ${unit}`,
                  title,
                ]}
              />

              <Area
                type="linear"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                connectNulls={false}
                isAnimationActive={false}
                dot={false}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      )}

    </div>
  )
}