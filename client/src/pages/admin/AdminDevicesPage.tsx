import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import {
  Cpu,
  Plus,
  KeyRound,
  Copy,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { deviceService } from '../../services/device.service'
import type { Device } from '../../types/device'

import DeviceCard from '../../components/devices/DeviceCard'

export default function AdminDevicesPage() {

  const [devices, setDevices] = useState<Device[]>([])
  const [deviceName, setDeviceName] = useState('')
  const [firmwareVersion, setFirmwareVersion] = useState('1.0.0')

  const [credentials, setCredentials] = useState<{
    code: string
    key: string
  } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadDevices() {

    try {

      const data = await deviceService.getDevices()

      setDevices(data.devices)
      setError('')

    } catch {

      setError('Unable to retrieve devices')

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    void loadDevices()

    const timer = window.setInterval(
      () => void loadDevices(),
      10000
    )

    return () => window.clearInterval(timer)

  }, [])

  async function register(event: FormEvent) {

    event.preventDefault()

    if (busy) return

    setBusy(true)

    try {

      const result = await deviceService.registerDevice(
        deviceName,
        firmwareVersion
      )

      setCredentials({
        code: result.device.deviceCode,
        key: result.apiKey,
      })

      setDeviceName('')
      setShowForm(false)

      toast.success('Device registered successfully')

      await loadDevices()

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : 'Device registration failed'
      )

    } finally {
      setBusy(false)
    }
  }

  async function regenerate(device: Device) {

    if (busy) return

    if (!window.confirm(
      'Generate a new API key? The current firmware key will stop working.'
    )) return

    setBusy(true)

    try {

      const result =
        await deviceService.regenerateKey(device.id)

      setCredentials({
        code: device.deviceCode,
        key: result.apiKey,
      })

      toast.success('New API key generated')

      await loadDevices()

    } catch {
      toast.error('Unable to regenerate API key')
    } finally {
      setBusy(false)
    }
  }

  async function updateStatus(device: Device) {

    if (busy) return

    const action =
      device.status === 'DISABLED'
        ? 'enable'
        : 'disable'

    if (!window.confirm(
      action === 'disable'
        ? 'Disable this device and end its active assignment?'
        : 'Enable this device?'
    )) return

    setBusy(true)

    try {

      await deviceService.updateStatus(
        device.id,
        action
      )

      toast.success(
        `Device ${action === 'enable' ? 'enabled' : 'disabled'}`
      )

      await loadDevices()

    } catch {
      toast.error('Unable to update device')
    } finally {
      setBusy(false)
    }
  }

  async function copy(value: string) {

    try {

      await navigator.clipboard.writeText(value)

      toast.success('Copied to clipboard')

    } catch {

      toast.error('Unable to copy. Select and copy manually.')
    }
  }

  const stats = [
    {
      label: 'Total devices',
      value: devices.length,
    },
    {
      label: 'Active devices',
      value: devices.filter(
        d => d.status === 'ACTIVE'
      ).length,
    },
    {
      label: 'Registered',
      value: devices.filter(
        d => d.status === 'REGISTERED'
      ).length,
    },
    {
      label: 'Disabled',
      value: devices.filter(
        d => d.status === 'DISABLED'
      ).length,
    },
  ]

  return (
    <main className="min-h-screen bg-[#080F26] p-5 sm:p-10">

      <div className="mx-auto max-w-7xl space-y-6">

        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-indigo-300"
        >
          <ArrowLeft size={18} />
          Back to admin dashboard
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Device management
            </h1>

            <p className="mt-2 text-sm text-indigo-200">
              Manage the MediConnect hardware network.
            </p>

          </div>

          <button
            disabled={busy}
            onClick={() => setShowForm(!showForm)}
            className="dashboard-button gap-2"
          >
            <Plus size={18} />
            {showForm ? 'Close form' : 'Register device'}
          </button>

        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          {stats.map(stat => (

            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >

              <p className="text-3xl font-bold text-white">
                {stat.value}
              </p>

              <p className="mt-2 text-xs text-indigo-200">
                {stat.label}
              </p>

            </div>

          ))}

        </div>

        {showForm && (

          <form
            onSubmit={register}
            className="dashboard-card space-y-5 p-6"
          >

            <h2 className="text-xl font-bold text-slate-900">
              Register ESP32 device
            </h2>

            <div>

              <label className="dashboard-label">
                Device name
              </label>

              <input
                required
                minLength={3}
                maxLength={100}
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                placeholder="MediConnect Monitor"
                className="dashboard-input mt-2"
              />

            </div>

            <div>

              <label className="dashboard-label">
                Firmware version
              </label>

              <input
                value={firmwareVersion}
                onChange={e => setFirmwareVersion(e.target.value)}
                className="dashboard-input mt-2"
              />

            </div>

            <button
              disabled={busy}
              type="submit"
              className="dashboard-button"
            >
              {busy ? 'Registering...' : 'Register device'}
            </button>

          </form>

        )}

        {credentials && (

          <div className="dashboard-card space-y-4 p-6">

            <h2 className="flex items-center gap-2 text-xl font-bold text-indigo-900">
              <KeyRound size={22} />
              Device credentials
            </h2>

            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">

              Save these credentials securely in the ESP32
              secrets.h file. The API key will not be shown
              again after closing this panel.

            </p>

            {[
              {
                label: 'DEVICE_CODE',
                value: credentials.code,
              },
              {
                label: 'DEVICE_API_KEY',
                value: credentials.key,
              },
            ].map(item => (

              <div key={item.label}>

                <p className="dashboard-label">
                  {item.label}
                </p>

                <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-100 p-4">

                  <code className="min-w-0 flex-1 break-all text-sm text-slate-800">
                    {item.value}
                  </code>

                  <button
                    onClick={() => void copy(item.value)}
                    className="rounded-lg bg-white p-3 text-indigo-600"
                    aria-label={`Copy ${item.label}`}
                  >
                    <Copy size={18} />
                  </button>

                </div>

              </div>

            ))}

            <button
              onClick={() => setCredentials(null)}
              className="dashboard-button"
            >
              Saved securely — Close
            </button>

          </div>

        )}

        <div className="flex items-center justify-between">

          <h2 className="text-xl font-bold text-white">
            Registered devices
          </h2>

          <button
            onClick={() => void loadDevices()}
            className="flex items-center gap-2 text-sm text-indigo-300"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>

        {loading ? (

          <p className="text-indigo-200">
            Loading devices...
          </p>

        ) : error ? (

          <p className="rounded-xl bg-rose-50 p-4 text-rose-700">
            {error}
          </p>

        ) : devices.length === 0 ? (

          <div className="rounded-2xl border border-white/10 p-12 text-center text-indigo-200">

            <Cpu size={40} className="mx-auto mb-4" />

            No devices registered.

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {devices.map(device => (

              <DeviceCard
                key={device.id}
                device={device}
                action={

                  <div className="flex flex-wrap gap-2">

                    <button
                      disabled={busy}
                      onClick={() => void regenerate(device)}
                      className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600"
                    >
                      Regenerate key
                    </button>

                    <button
                      disabled={busy}
                      onClick={() => void updateStatus(device)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      {device.status === 'DISABLED'
                        ? 'Enable'
                        : 'Disable'}
                    </button>

                  </div>

                }
              />

            ))}

          </div>

        )}

      </div>

    </main>
  )
}