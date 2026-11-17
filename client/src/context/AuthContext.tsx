import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import type { ReactNode } from 'react'
import { api } from '../lib/api'

export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT'

export interface User {
  id: string
  fullName: string
  email: string | null
  role: Role
  status: string
  emailVerified?: boolean
}

interface AuthResponse {
  success: boolean
  user: User
  message?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean

  login: (
    identifier: string,
    password: string,
    role: Role,
  ) => Promise<User>

  logout: () => Promise<void>
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined)

export const dashboardPaths: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  DOCTOR: '/doctor/dashboard',
  PATIENT: '/patient/dashboard',
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<AuthResponse>('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(
    identifier: string,
    password: string,
    role: Role,
  ) {
    
    const data = await api<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          role,
        }),
      },
    )

    setUser(data.user)

    return data.user
  }

  async function logout() {
    await api('/auth/logout', {
      method: 'POST',
    })

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}