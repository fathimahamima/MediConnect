import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import { doctorService } from '../../services/doctor.service'
import PatientTable from '../../components/doctor/PatientTable'

import type {
  PatientListResponse,
} from '../../types/patient'

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [data, setData] =
    useState<PatientListResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const result =
          await doctorService.getPatients(
            search,
            page,
          )

        if (!cancelled) {
          setData(result)
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load patients'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search, page, refresh])

  return (
    <div className="space-y-7">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            My patients
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage patient accounts and health profiles.
          </p>
        </div>

        <Link
          to="/doctor/patients/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
        >
          <UserPlus size={19} />
          Add patient
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">

        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 p-5">

          <div className="relative min-w-[200px] flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              aria-label="Search patients"
              onChange={event => {
                setSearch(event.target.value)
                setPage(1)
              }}
              maxLength={100}
              placeholder="Search by name, patient ID or email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            onClick={() => setRefresh(value => value + 1)}
            aria-label="Refresh patients"
            className="rounded-xl border border-slate-200 p-3.5 text-slate-500 hover:bg-indigo-50"
          >
            <RefreshCw size={18} />
          </button>

          <span className="text-sm text-slate-500">
            {loading || error
              ? '—'
              : data?.total ?? 0} patients
          </span>

        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle
              size={30}
              className="animate-spin text-indigo-500"
            />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-center justify-center gap-3 p-10 text-sm text-red-600"
          >
            <AlertCircle size={20} />
            {error}
          </div>
        ) : (
          <PatientTable
            patients={data?.patients || []}
          />
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-5">
          <p className="text-xs text-slate-500">
            Page {page} of {
              Math.max(data?.totalPages || 0, 1)
            }
          </p>

          <div className="flex gap-2">
            <button
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage(value => value - 1)
              }
              className="rounded-lg border border-slate-200 p-2.5 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              aria-label="Next page"
              disabled={
                loading ||
                Boolean(error) ||
                page >= (data?.totalPages || 1)
              }
              onClick={() =>
                setPage(value => value + 1)
              }
              className="rounded-lg border border-slate-200 p-2.5 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}