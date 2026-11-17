import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import {
  ShieldCheck,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Copy,
} from 'lucide-react'

import { toast } from 'sonner'

import AuthLayout from '../../components/auth/AuthLayout'
import { api } from '../../lib/api'

interface Invitation {
  fullName: string
  patientCode: string
}

export default function ActivatePatientPage() {
  const [token] = useState(() => {
    const params = new URLSearchParams(
      window.location.hash.slice(1)
    )

    return params.get('token')
  })

  const [patient, setPatient] =
    useState<Invitation | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function validateInvitation() {
      try {
        if (!token) {
          throw new Error(
            'Activation link is missing or invalid.'
          )
        }

        const result = await api<{
          success: boolean
          patient: Invitation
        }>('/auth/patient-invitation', {
          method: 'POST',

          body: JSON.stringify({
            token,
          }),
        })

        if (!cancelled) {
          setPatient(result.patient)
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to validate invitation'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void validateInvitation()

    return () => {
      cancelled = true
    }
  }, [token])

  const requirements = [
    {
      label: 'At least 8 characters',
      valid: password.length >= 8,
    },
    {
      label: 'One uppercase letter',
      valid: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter',
      valid: /[a-z]/.test(password),
    },
    {
      label: 'One number',
      valid: /[0-9]/.test(password),
    },
    {
      label: 'One special character',
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ]

  const strength = requirements.filter(
    item => item.valid
  ).length

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!token || !patient || submitting) return

    setError('')

    if (strength !== 5) {
      setError('Please meet all password requirements.')
      return
    }

    if (
      new TextEncoder().encode(password).length > 72
    ) {
      setError('Password exceeds the allowed length.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      await api<{
        success: boolean
        patientCode: string
      }>('/auth/activate-patient', {
        method: 'POST',

        body: JSON.stringify({
          token,
          password,
        }),
      })

      window.history.replaceState(
        null,
        '',
        window.location.pathname
      )

      setPassword('')
      setConfirmPassword('')
      setSuccess(true)

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to activate account'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function copyPatientId() {
    if (!patient) return

    try {
      await navigator.clipboard.writeText(
        patient.patientCode
      )

      toast.success('Patient ID copied')
    } catch {
      toast.error('Unable to copy patient ID')
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="py-14 text-center">

          <LoaderCircle
            size={42}
            className="mx-auto animate-spin text-indigo-300"
          />

          <h1 className="mt-6 text-xl font-bold">
            Validating invitation...
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Please wait.
          </p>

        </div>
      </AuthLayout>
    )
  }

  if (success && patient) {
    return (
      <AuthLayout>
        <div className="text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 size={43} />
          </div>

          <h1 className="mt-7 text-3xl font-extrabold">
            Account activated!
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            Welcome to MediConnect, {patient.fullName}.
            Your account is now ready.
          </p>

          <div className="my-7 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-5">

            <p className="text-xs tracking-widest text-indigo-300">
              YOUR PATIENT ID
            </p>

            <div className="mt-3 flex items-center justify-center gap-3">

              <span className="text-2xl font-bold">
                {patient.patientCode}
              </span>

              <button
                onClick={copyPatientId}
                aria-label="Copy patient ID"
                className="text-indigo-300"
              >
                <Copy size={19} />
              </button>

            </div>

          </div>

          <p className="mb-6 text-xs leading-6 text-slate-400">
            Use your patient ID and the password you
            just created to securely access your account.
          </p>

          <Link
            to="/login?role=patient"
            className="auth-button"
          >
            Continue to patient login
            <ArrowRight size={19} />
          </Link>

        </div>
      </AuthLayout>
    )
  }

  if (!patient) {
    return (
      <AuthLayout>
        <div className="text-center">

          <AlertCircle
            size={46}
            className="mx-auto text-red-300"
          />

          <h1 className="mt-6 text-2xl font-bold">
            Invitation unavailable
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            {error}
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            Contact your healthcare provider to
            request another invitation.
          </p>

          <Link
            to="/login?role=patient"
            className="auth-button mt-7"
          >
            Back to patient login
          </Link>

        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>

      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
        <ShieldCheck size={29} />
      </div>

      <h1 className="text-3xl font-extrabold">
        Activate your account.
      </h1>

      <p className="mt-4 text-sm leading-7 text-slate-400">
        Welcome, {patient.fullName}. Create a secure
        password to access your personal healthcare
        workspace.
      </p>

      <div className="mt-6 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">

        <p className="text-xs text-indigo-300">
          Your patient ID
        </p>

        <p className="mt-2 text-lg font-bold">
          {patient.patientCode}
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >

        <div>

          <label
            htmlFor="patient-password"
            className="auth-label"
          >
            Create password
          </label>

          <div className="relative">

            <input
              id="patient-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input pr-12"
              placeholder="Create a secure password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              disabled={submitting}
              value={password}
              onChange={e =>
                setPassword(e.target.value)
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
                setShowPassword(value => !value)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword
                ? <EyeOff size={19} />
                : <Eye size={19} />}
            </button>

          </div>

          <div className="mt-4 flex gap-1.5">

            {requirements.map((item, index) => (
              <div
                key={item.label}
                className={`h-1.5 flex-1 rounded-full ${
                  index < strength
                    ? strength === 5
                      ? 'bg-emerald-400'
                      : 'bg-indigo-400'
                    : 'bg-white/10'
                }`}
              />
            ))}

          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">

            {requirements.map(item => (
              <p
                key={item.label}
                className={`flex items-center gap-2 text-xs ${
                  item.valid
                    ? 'text-emerald-300'
                    : 'text-slate-400'
                }`}
              >

                <CheckCircle2 size={14} />

                {item.label}

              </p>
            ))}

          </div>

        </div>

        <div>

          <label
            htmlFor="confirm-patient-password"
            className="auth-label"
          >
            Confirm password
          </label>

          <input
            id="confirm-patient-password"
            type="password"
            className="auth-input"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirmPassword}
            disabled={submitting}
            required
            maxLength={72}
            onChange={e =>
              setConfirmPassword(e.target.value)
            }
          />

        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-300"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="auth-button"
          disabled={submitting}
        >

          {submitting ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Activating account...
            </>
          ) : (
            <>
              Activate my account
              <ArrowRight size={18} />
            </>
          )}

        </button>

      </form>

      <p className="mt-6 text-center text-xs leading-6 text-slate-500">
        Never share your password or activation link
        with anyone.
      </p>

    </AuthLayout>
  )
}