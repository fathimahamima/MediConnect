import { useState } from 'react'

import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import {
  LayoutDashboard,
  Users,
  Activity,
  HeartPulse,
  Pill,
  BellRing,
  FileText,
  Cpu,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react'

import { toast } from 'sonner'
import Logo from '../components/shared/Logo'
import { useAuth } from '../context/AuthContext'

const navigation = [
  {
    label: 'Overview',
    path: '/doctor/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My patients',
    path: '/doctor/patients',
    icon: Users,
  },
  {
    label: 'Live monitoring',
    path: '/doctor/monitoring',
    icon: Activity,
  },
  {
    label: 'Recovery tracking',
    path: '/doctor/recovery',
    icon: HeartPulse,
  },
  {
    label: 'Medication',
    path: '/doctor/medication',
    icon: Pill,
  },
  {
    label: 'Alerts',
    path: '/doctor/alerts',
    icon: BellRing,
  },
  {
  label: 'Reports',
  path: '/doctor/reports',
  icon: FileText,
},
{
  label: 'AI Summaries',
  path: '/doctor/summaries',
  icon: Sparkles,
},
{
  label: 'Devices',
  path: '/doctor/devices',
  icon: Cpu,
},
  {
    label: 'Settings',
    path: '/doctor/settings',
    icon: Settings,
  },
]

export default function DoctorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const currentPage = navigation.find(
    item =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + '/')
  )?.label || 'Doctor workspace'

  async function handleLogout() {
    try {
      await logout()
      navigate('/login?role=doctor', {
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
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#080F26]/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#080F26] text-white transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-7">
          <Logo light />

          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-5 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-500">
            DOCTOR WORKSPACE
          </p>

          <nav className="space-y-1.5">
            {navigation.map(item => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-100'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={19} />
                      <span className="flex-1">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight
                          size={15}
                          className="text-indigo-300"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="mx-4 mb-5 rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-4">
          <ShieldCheck
            size={23}
            className="mb-3 text-indigo-300"
          />

          <p className="text-sm font-semibold text-indigo-100">
            Authorized workspace
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Access is restricted to your assigned
            patient records.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
            <Stethoscope size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.fullName}
            </p>

            <p className="text-xs text-slate-400">
              Healthcare professional
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="text-slate-400 transition-colors hover:text-red-300"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      <div className="lg:ml-[270px]">

        <header className="sticky top-0 z-30 flex min-h-[82px] items-center gap-4 border-b border-slate-200/70 bg-white/85 px-5 backdrop-blur-xl md:px-8">

          <button
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 lg:hidden"
          >
            <Menu size={25} />
          </button>

          <div>
            <p className="text-xs font-medium text-slate-400">
              Doctor portal
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {currentPage}
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button
              aria-label="View alerts"
              onClick={() => navigate('/doctor/alerts')}
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
              <BellRing size={20} />
            </button>

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {user?.fullName
                .split(' ')
                .slice(0, 2)
                .map(name => name[0])
                .join('')
                .toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1700px] p-5 md:p-8">
          <Outlet />
        </main>

        <footer className="px-8 pb-6 text-center text-xs text-slate-400">
          MediConnect · Healthcare monitoring prototype
        </footer>
      </div>
    </div>
  )
}