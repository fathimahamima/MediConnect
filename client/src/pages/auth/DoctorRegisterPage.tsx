import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import {
  Stethoscope,
  Eye,
  EyeOff,
  LoaderCircle,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserRound,
  LockKeyhole,
} from 'lucide-react'

import AuthLayout from '../../components/auth/AuthLayout'
import { api } from '../../lib/api'

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  specialization: '',
  registrationNumber: '',
  qualification: '',
  hospital: '',
  password: '',
  confirmPassword: '',
}

type FormKey = keyof typeof initialForm

interface RegistrationResponse {
  success: boolean
  message: string
  verificationEmailSent: boolean
}

export default function DoctorRegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  const passwordChecks = [
    {
      label: 'At least 8 characters',
      valid: form.password.length >= 8,
    },
    {
      label: 'Uppercase letter',
      valid: /[A-Z]/.test(form.password),
    },
    {
      label: 'Lowercase letter',
      valid: /[a-z]/.test(form.password),
    },
    {
      label: 'Number',
      valid: /[0-9]/.test(form.password),
    },
    {
      label: 'Special character',
      valid: /[^A-Za-z0-9]/.test(form.password),
    },
  ]

  const strength = passwordChecks.filter(
    item => item.valid
  ).length

  function update(key: FormKey, value: string) {
    setForm(previous => ({
      ...previous,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (strength !== 5) {
      setError('Please meet all password requirements.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      const {
        confirmPassword: _confirmPassword,
        ...data
      } = form

      const result = await api<RegistrationResponse>(
        '/auth/register/doctor',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      )

      setEmailSent(result.verificationEmailSent)
      setSuccess(true)
      setForm(initialForm)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Registration could not be completed'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function field(
    name: FormKey,
    label: string,
    placeholder: string,
    type = 'text',
    required = true,
  ) {
    return (
      <div>
        <label
          htmlFor={name}
          className="auth-label"
        >
          {label}
        </label>

        <input
          id={name}
          type={type}
          placeholder={placeholder}
          className="auth-input"
          value={form[name]}
          required={required}
          disabled={submitting}
          onChange={event =>
            update(name, event.target.value)
          }
        />
      </div>
    )
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 size={42} />
          </div>

          <h1 className="mt-7 text-3xl font-extrabold">
            Registration successful!
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            Your doctor account has been created.
            Complete email verification and administrator
            approval before signing in.
          </p>

          <div className="my-7 rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-sm leading-7 text-slate-300">
            Account created successfully.<br />
            Email verification: Pending<br />
            Administrator approval: Pending
          </div>

          <Link
            to="/login?role=doctor"
            className="auth-button"
          >
            <div className="mb-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm leading-6 text-indigo-200">
  {emailSent
    ? 'Your verification email has been sent to the email service. Please check your inbox and spam folder.'
    : 'Your account was created, but the verification email could not be sent.'}

  <Link
    to="/resend-verification"
    className="mt-3 block font-semibold underline"
  >
    Request another verification email
  </Link>
</div>
            Return to sign in
            <ArrowRight size={18} />
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
          <Stethoscope size={26} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">
          Join connected care.
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Create your MediConnect doctor account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <AlertCircle size={19} className="shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-7"
      >
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-indigo-200">
            <UserRound size={18} />
            Personal information
          </h2>

          {field(
            'fullName',
            'Full name',
            'Enter your full name',
          )}

          {field(
            'email',
            'Email address',
            'doctor@example.com',
            'email',
          )}

          {field(
            'phone',
            'Phone number with country code',
            '+91XXXXXXXXXX',
            'tel',
          )}
        </section>

        <section className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-indigo-200">
            <Stethoscope size={18} />
            Professional details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              'specialization',
              'Specialization',
              'e.g. General Medicine',
            )}

            {field(
              'qualification',
              'Qualification',
              'e.g. MBBS, MD',
            )}
          </div>

          {field(
            'registrationNumber',
            'Medical registration number',
            'Enter registration number',
          )}

          {field(
            'hospital',
            'Hospital / Clinic (optional)',
            'Enter hospital or clinic name',
            'text',
            false,
          )}
        </section>

        <section className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-indigo-200">
            <LockKeyhole size={18} />
            Account security
          </h2>

          <div>
            <label
              htmlFor="new-password"
              className="auth-label"
            >
              Create password
            </label>

            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={event =>
                  update('password', event.target.value)
                }
                className="auth-input pr-12"
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                maxLength={72}
                disabled={submitting}
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword
                  ? <EyeOff size={19} />
                  : <Eye size={19} />}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-colors ${
                    index < strength
                      ? strength <= 2
                        ? 'bg-red-400'
                        : strength <= 4
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {passwordChecks.map(item => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 text-xs ${
                    item.valid
                      ? 'text-emerald-300'
                      : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {field(
            'confirmPassword',
            'Confirm password',
            'Re-enter your password',
            showPassword ? 'text' : 'password',
          )}
        </section>

        <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-xs leading-6 text-indigo-200">
          Doctor accounts require email verification
          and administrator approval before clinical
          features become accessible.
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
              Creating account...
            </>
          ) : (
            <>
              Create doctor account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        Already registered?{' '}
        <Link
          to="/login?role=doctor"
          className="font-semibold text-indigo-300 hover:text-white"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}