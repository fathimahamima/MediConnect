import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  MailCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ArrowRight,
} from 'lucide-react'

import AuthLayout from '../../components/auth/AuthLayout'
import { api } from '../../lib/api'

type Status =
  | 'ready'
  | 'verifying'
  | 'success'
  | 'error'

export default function VerifyEmailPage() {
  const [token] = useState(() => {
    const params = new URLSearchParams(
      window.location.hash.slice(1)
    )

    return params.get('token')
  })

  const [status, setStatus] = useState<Status>(
    token ? 'ready' : 'error'
  )

  const [message, setMessage] = useState(
    token
      ? 'Confirm your email address to continue.'
      : 'The verification link is missing or invalid.'
  )

  async function verifyEmail() {
    if (!token) return

    setStatus('verifying')

    try {
      const result = await api<{
        success: boolean
        message: string
        approval: string
      }>('/auth/verify-email', {
        method: 'POST',

        body: JSON.stringify({
          token,
        }),
      })

      window.history.replaceState(
        null,
        '',
        window.location.pathname
      )

      setStatus('success')
      setMessage(result.message)
    } catch (error) {
      setStatus('error')

      setMessage(
        error instanceof Error
          ? error.message
          : 'Email verification failed.'
      )
    }
  }

  return (
    <AuthLayout>
      <div className="text-center">

        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
          status === 'success'
            ? 'bg-emerald-500/15 text-emerald-300'
            : status === 'error'
              ? 'bg-red-500/15 text-red-300'
              : 'bg-indigo-500/15 text-indigo-300'
        }`}>

          {status === 'ready' && (
            <MailCheck size={42} />
          )}

          {status === 'verifying' && (
            <LoaderCircle
              size={42}
              className="animate-spin"
            />
          )}

          {status === 'success' && (
            <CheckCircle2 size={42} />
          )}

          {status === 'error' && (
            <AlertCircle size={42} />
          )}

        </div>

        <h1 className="mt-7 text-3xl font-extrabold">
          {status === 'ready' && 'Verify your email.'}
          {status === 'verifying' && 'Verifying email...'}
          {status === 'success' && 'Email verified!'}
          {status === 'error' && 'Verification unavailable'}
        </h1>

        <p
          aria-live="polite"
          className="mt-5 text-sm leading-7 text-slate-300"
        >
          {message}
        </p>

        <div className="mt-8 space-y-4">

          {status === 'ready' && (
            <button
              onClick={verifyEmail}
              className="auth-button"
            >
              Verify my email
              <ArrowRight size={18} />
            </button>
          )}

          {status === 'success' && (
            <Link
              to="/login?role=doctor"
              className="auth-button"
            >
              Continue to sign in
              <ArrowRight size={18} />
            </Link>
          )}

          {status === 'error' && (
            <Link
              to="/resend-verification"
              className="auth-button"
            >
              Request another verification email
            </Link>
          )}

        </div>
      </div>
    </AuthLayout>
  )
}