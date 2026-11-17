import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import {
  Mail,
  Send,
  LoaderCircle,
} from 'lucide-react'

import AuthLayout from '../../components/auth/AuthLayout'
import { api } from '../../lib/api'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const result = await api<{
        success: boolean
        message: string
      }>('/auth/resend-verification', {
        method: 'POST',

        body: JSON.stringify({
          email,
        }),
      })

      setMessage(result.message)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to request verification email.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>

      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
        <Mail size={28} />
      </div>

      <h1 className="text-3xl font-extrabold">
        Verify your account.
      </h1>

      <p className="mt-4 text-sm leading-7 text-slate-400">
        Enter your registered doctor email address
        to request a new verification link.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-5"
      >
        <div>
          <label
            htmlFor="resend-email"
            className="auth-label"
          >
            Registered email address
          </label>

          <input
            id="resend-email"
            type="email"
            className="auth-input"
            placeholder="Enter your email"
            value={email}
            required
            disabled={loading}
            onChange={event =>
              setEmail(event.target.value)
            }
          />
        </div>

        {message && (
          <div
            role="status"
            className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm leading-6 text-indigo-200"
          >
            {message}
            <p className="mt-2">
              Check your inbox and spam folder.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Requesting email...
            </>
          ) : (
            <>
              Send verification email
              <Send size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-7 text-center">
        <Link
          to="/login?role=doctor"
          className="text-sm font-semibold text-indigo-300 hover:text-white"
        >
          Back to sign in
        </Link>
      </div>

    </AuthLayout>
  )
}