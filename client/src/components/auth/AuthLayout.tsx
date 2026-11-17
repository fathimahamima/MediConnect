import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

import {
  ArrowLeft,
  HeartPulse,
  ShieldCheck,
  Activity,
} from 'lucide-react'

import Logo from '../shared/Logo'

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080F26] text-white">

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#252454_0%,transparent_55%)]" />

      <div className="relative grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">

        {/* Healthcare branding panel */}
        <aside className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between">

          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('/images/healthcare-hero.jpg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-[#080F26]/80 via-[#080F26]/55 to-[#080F26]" />

          <div className="relative z-10 p-12">
            <Logo light />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 p-12 xl:p-16"
          >
            <div className="mb-7 inline-flex rounded-full border border-blue-300/20 bg-blue-500/10 px-4 py-2 text-xs tracking-widest text-blue-200">
              CONNECTED CARE. REIMAGINED.
            </div>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight xl:text-6xl">
              Better care begins with
              <span className="block bg-gradient-to-r from-blue-300 to-violet-400 bg-clip-text text-transparent">
                a connection.
              </span>
            </h1>

            <p className="mt-6 max-w-md leading-8 text-slate-300">
              Connecting patients, healthcare professionals
              and intelligent monitoring technology through
              one thoughtfully designed platform.
            </p>

            <div className="mt-10 space-y-3">
              {[
                {
                  icon: HeartPulse,
                  title: 'Connected health monitoring',
                },
                {
                  icon: Activity,
                  title: 'Personalized recovery tracking',
                },
                {
                  icon: ShieldCheck,
                  title: 'Authorized access to health records',
                },
              ].map(item => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                >
                  <item.icon
                    size={23}
                    className="text-blue-300"
                  />
                  <span className="text-sm">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative z-10 p-12 text-xs text-slate-400">
            © {new Date().getFullYear()} MediConnect.
            Designed for connected care.
          </div>
        </aside>

        {/* Authentication panel */}
        <section className="relative flex min-h-screen flex-col px-6 py-8 sm:px-12">

          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to home
            </Link>

            <div className="lg:hidden">
              <Logo light />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white/[0.045] p-7 shadow-2xl backdrop-blur-2xl sm:p-10"
            >
              {children}
            </motion.div>
          </div>

          <p className="text-center text-xs leading-6 text-slate-400">
            MediConnect is a healthcare monitoring prototype.
            Not a substitute for professional medical care
            or emergency services.
          </p>
        </section>
      </div>
    </main>
  )
}