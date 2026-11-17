import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'

import {
  useAuth,
  dashboardPaths,
} from '../../context/AuthContext'

import type { Role } from '../../context/AuthContext'

export default function ProtectedRoute({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080F26] text-white">
        <LoaderCircle
          size={35}
          className="animate-spin text-indigo-400"
        />
        <p className="text-sm text-slate-400">
          Loading your workspace...
        </p>
      </main>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?role=${role.toLowerCase()}`}
        replace
      />
    )
  }

  if (user.role !== role) {
    return (
      <Navigate
        to={dashboardPaths[user.role]}
        replace
      />
    )
  }

  return <>{children}</>
}