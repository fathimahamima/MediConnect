import { useState } from 'react'

import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom'

import {
  LayoutDashboard,
  Activity,
  HeartPulse,
  Pill,
  BellRing,
  FileText,
  Mic,
  UserRound,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Siren,
  Sparkles,
} from 'lucide-react'

import { toast } from 'sonner'

import Logo from '../components/shared/Logo'
import { useAuth } from '../context/AuthContext'

const navigation = [
  {
    label: 'Overview',
    path: '/patient/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Health monitoring',
    path: '/patient/monitoring',
    icon: Activity,
  },
  {
    label: 'My recovery',
    path: '/patient/recovery',
    icon: HeartPulse,
  },
  {
    label: 'My medication',
    path: '/patient/medication',
    icon: Pill,
  },
  {
    label: 'Notifications',
    path: '/patient/notifications',
    icon: BellRing,
  },
  {
  label: 'Health reports',
  path: '/patient/reports',
  icon: FileText,
},
{
  label: 'Health Summaries',
  path: '/patient/summaries',
  icon: Sparkles,
},
{
  label: 'Voice assistant',
  path: '/patient/assistant',
  icon: Mic,
},
  {
    label: 'My profile',
    path: '/patient/profile',
    icon: UserRound,
  },
]

export default function PatientLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()

      navigate('/login?role=patient', {
        replace: true,
      })
    } catch {
      toast.error('Unable to log out')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FF] text-slate-900">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#080F26] text-white transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        } lg:translate-x-0`}
      >

        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <Logo light />

          <button
            className="lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-7">

          <p className="mb-5 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-500">
            PERSONAL HEALTHSPACE
          </p>

          <nav className="space-y-2">

            {navigation.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-100'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}

          </nav>

          <div className="mt-7 rounded-2xl border border-red-400/15 bg-red-500/10 p-4">

            <Siren
              className="mb-3 text-red-300"
              size={24}
            />

            <p className="text-sm font-bold text-red-200">
              Emergency assistance
            </p>

            <p className="mt-2 mb-4 text-xs leading-6 text-slate-400">
  Open notifications to access emergency
  assistance. For urgent medical help,
  contact emergency services.
</p>

<Link
  to="/patient/notifications"
  onClick={() => setSidebarOpen(false)}
  className="flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
>
  Emergency SOS
</Link>

<a
  href="tel:112"
  className="mt-3 block text-center text-xs font-semibold text-red-300"
>
  Call 112 (India)
</a>

          </div>
        </div>

        <div className="border-t border-white/10 p-5">

          <div className="mb-5 flex items-center gap-2 text-xs text-indigo-300">
            <ShieldCheck size={17} />
            Personal health workspace
          </div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
              <UserRound size={21} />
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-semibold">
                {user?.fullName}
              </p>

              <p className="text-xs text-slate-400">
                Patient account
              </p>

            </div>

            <button
              aria-label="Logout"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-300"
            >
              <LogOut size={19} />
            </button>

          </div>
        </div>

      </aside>

      <div className="lg:ml-[260px]">

        <header className="sticky top-0 z-30 flex min-h-[80px] items-center gap-4 border-b border-slate-200 bg-white/85 px-5 backdrop-blur-xl md:px-8">

          <button
            aria-label="Open menu"
            className="text-slate-600 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={25} />
          </button>

          <div>
            <p className="text-xs text-slate-400">
              MediConnect
            </p>

            <h2 className="mt-1 font-bold text-slate-800">
              My health workspace
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-3">

            <button
              aria-label="Notifications"
              onClick={() =>
                navigate('/patient/notifications')
              }
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500"
            >
              <BellRing size={20} />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <UserRound size={20} />
            </div>

          </div>

        </header>

        <main className="mx-auto max-w-[1600px] p-5 md:p-8">
          <Outlet />
        </main>

        <footer className="px-6 pb-6 text-center text-xs leading-6 text-slate-400">
          MediConnect is a healthcare monitoring prototype.
          It does not replace professional medical care.
        </footer>

      </div>
    </div>
  )
}