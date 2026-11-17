import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import {
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'

import { toast } from 'sonner'
import AuthLayout from '../../components/auth/AuthLayout'

import {
  useAuth,
  dashboardPaths,
} from '../../context/AuthContext'

import type { Role } from '../../context/AuthContext'

const roles = [
  {
    value: 'DOCTOR' as const,
    label: 'Doctor',
    icon: Stethoscope,
  },
  {
    value: 'PATIENT' as const,
    label: 'Patient',
    icon: HeartPulse,
  },
  {
    value: 'ADMIN' as const,
    label: 'Admin',
    icon: ShieldCheck,
  },
]

export default function LoginPage() {
  const [params] = useSearchParams()
  const requestedRole =
    params.get('role')?.toUpperCase()

  const [role, setRole] = useState<Role>(
    requestedRole === 'PATIENT' ||
    requestedRole === 'ADMIN'
      ? requestedRole
      : 'DOCTOR',
  )

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { login, user, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const account = await login(
        identifier,
        password,
        role,
      )

      toast.success('Signed in successfully')

      navigate(dashboardPaths[account.role], {
        replace: true,
      })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to sign in'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && user) {
    return (
      <Navigate
        to={dashboardPaths[user.role]}
        replace
      />
    )
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
          <ShieldCheck size={26} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome back.
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Sign in to your connected care workspace.
        </p>
      </div>

      <div className="mb-7 grid grid-cols-3 gap-3">
        {roles.map(item => {
          const Icon = item.icon
          const selected = role === item.value

          return (
            <button
              key={item.value}
              type="button"
              disabled={submitting}
              aria-pressed={selected}
              onClick={() => {
                setRole(item.value)
                setIdentifier('')
                setPassword('')
                setError('')
              }}
              className={`flex flex-col items-center gap-3 rounded-2xl border p-4 text-xs font-semibold transition-all ${
                selected
                  ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-indigo-400/50'
              }`}
            >
              <Icon size={25} />
              {item.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <AlertCircle
            size={19}
            className="shrink-0"
          />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="identifier"
            className="auth-label"
          >
            {role === 'PATIENT'
              ? 'Patient ID'
              : 'Email address'}
          </label>

          <input
            id="identifier"
            type={role === 'PATIENT' ? 'text' : 'email'}
            className="auth-input"
            placeholder={
              role === 'PATIENT'
                ? 'Enter your patient ID'
                : 'Enter your email address'
            }
            autoComplete="username"
            required
            disabled={submitting}
            value={identifier}
            onChange={event =>
              setIdentifier(event.target.value)
            }
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="auth-label"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input pr-12"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={submitting}
              value={password}
              onChange={event =>
                setPassword(event.target.value)
              }
            />

            <button
              type="button"
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword
                ? <EyeOff size={19} />
                : <Eye size={19} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={submitting || loading}
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Signing in...
            </>
          ) : (
            <>
              Sign in as {
                roles.find(item => item.value === role)?.label
              }
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      {role === 'DOCTOR' && (
  <div className="mt-5 text-center">
    <Link
      to="/resend-verification"
      className="text-xs font-semibold text-indigo-300 hover:text-white"
    >
      Didn't receive your verification email?
    </Link>
  </div>
)}

      <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm leading-6 text-slate-400">
        {role === 'DOCTOR' && (
          <>
            New to MediConnect?{' '}
            <Link
              to="/register/doctor"
              className="font-semibold text-indigo-300 hover:text-white"
            >
              Create a doctor account
            </Link>
          </>
        )}

        {role === 'PATIENT' && (
          <p>
            Patient accounts are created by your doctor.
            Contact your care provider for account
            activation instructions.
          </p>
        )}

        {role === 'ADMIN' && (
          <p>
            Authorized administrators only.
          </p>
        )}
      </div>
    </AuthLayout>
  )
}