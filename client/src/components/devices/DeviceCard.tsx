import {
  Cpu,
  Radio,
  Clock3,
  Fingerprint,
} from 'lucide-react'

import type { ReactNode } from 'react'
import type { Device } from '../../types/device'

interface Props {
  device: Device
  action?: ReactNode
  patientName?: string
}

export default function DeviceCard({
  device,
  action,
  patientName,
}: Props) {

  const online =
    device.status === 'ACTIVE' &&
    Boolean(device.lastSeenAt) &&
    Date.now() -
      new Date(device.lastSeenAt!).getTime() < 30000

  return (
    <div className="dashboard-card overflow-hidden">

      <div className="bg-gradient-to-br from-[#080F26] to-[#3730A3] p-6 text-white">

        <div className="flex items-center justify-between">

          <div className="rounded-2xl bg-white/10 p-4">
            <Cpu size={30} />
          </div>

          <span className="rounded-full bg-white/15 px-3 py-2 text-xs">
            {device.status}
          </span>

        </div>

        <h2 className="mt-5 text-xl font-bold">
          {device.deviceName}
        </h2>

        <p className="mt-2 flex items-center gap-2 text-sm text-indigo-200">

          <Fingerprint size={16} />

          {device.deviceCode}

        </p>

      </div>

      <div className="space-y-5 p-6">

        <div className="flex items-center justify-between">

          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Radio size={18} />
            Device connection
          </span>

          <span className={`flex items-center gap-2 text-xs font-semibold ${
            online
              ? 'text-emerald-600'
              : 'text-slate-500'
          }`}>

            <span className={`h-2.5 w-2.5 rounded-full ${
              online ? 'bg-emerald-500' : 'bg-slate-400'
            }`} />

            {online ? 'Recently connected' : 'Not connected'}

          </span>

        </div>

        <div className="rounded-xl bg-slate-50 p-4">

          <p className="text-xs text-slate-500">
            Assigned patient
          </p>

          <p className="mt-1 font-semibold text-slate-800">

            {patientName ||
              device.assignments?.[0]?.patient.patientCode ||
              'Unassigned'}

          </p>

        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">

          <Clock3 size={16} />

          Last seen:

          {device.lastSeenAt
            ? new Date(device.lastSeenAt).toLocaleString()
            : 'Not available'}

        </div>

        {device.firmwareVersion && (
          <p className="text-xs text-slate-500">
            Firmware: {device.firmwareVersion}
          </p>
        )}

        {action}

      </div>

    </div>
  )
}