import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Cpu,
  BellRing,
  BrainCircuit,
  Mic,
  FileText,
  Menu,
  X,
  Wifi,
  Users,
  Fingerprint,
} from 'lucide-react'

import Logo from '../components/shared/Logo'

const features = [
  {
    icon: Activity,
    title: 'Real-time monitoring',
    description:
      'Stay connected to patient vital signs through integrated IoT monitoring devices.',
  },
  {
    icon: HeartPulse,
    title: 'Recovery intelligence',
    description:
      'Track health trends against personalized, doctor-defined recovery targets.',
  },
  {
    icon: BellRing,
    title: 'Intelligent alerts',
    description:
      'Connect doctors and emergency contacts through configurable health notifications.',
  },
  {
    icon: BrainCircuit,
    title: 'AI-assisted insights',
    description:
      'Transform recorded health information into understandable, clinician-reviewed summaries.',
  },
  {
    icon: Mic,
    title: 'Voice assistance',
    description:
      'Navigate health information through accessible voice commands and spoken responses.',
  },
  {
    icon: FileText,
    title: 'Connected health records',
    description:
      'Access organized patient histories, monitoring trends and downloadable reports.',
  },
]

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Create a connection',
    description:
      'Doctors register patients and establish their personalized monitoring profiles.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Connect the device',
    description:
      'An assigned IoT device captures and transmits patient measurements.',
  },
  {
    number: '03',
    icon: HeartPulse,
    title: 'Monitor and respond',
    description:
      'Review health trends, recovery progress and alerts in one connected workspace.',
  },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const reducedMotion = useReducedMotion()

  const reveal = {
    initial: {
      opacity: 0,
      y: reducedMotion ? 0 : 25,
    },
    whileInView: {
      opacity: 1,
      y: 0,
    },
    viewport: { once: true },
    transition: {
      duration: reducedMotion ? 0 : 0.6,
    },
  }

  return (
    <div className="overflow-hidden bg-[#F4F7FF]">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/15 bg-[#080F26]/85 px-5 py-3 shadow-xl backdrop-blur-2xl">
          <Logo light />

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-300 lg:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
            <a href="#about" className="hover:text-white">
              About us
            </a>
          </div>

          <div className="hidden items-center gap-5 lg:flex">
            <Link
              to="/login"
              className="text-sm font-medium text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register/doctor"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-midnight hover:bg-blue-100"
            >
              Get started
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white lg:hidden"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {menuOpen && (
          <div className="mx-auto mt-2 flex max-w-7xl flex-col gap-5 rounded-2xl bg-midnight p-6 text-white lg:hidden">
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              About us
            </a>
            <Link to="/login">Sign in</Link>
            <Link to="/register/doctor">Create doctor account</Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[850px] items-center bg-midnight px-6 pb-24 pt-40 text-white md:min-h-screen md:px-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/images/healthcare-hero.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#080F26] via-[#080F26]/90 to-[#080F26]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080F26] via-transparent to-[#080F26]/30" />
        <div className="absolute left-0 top-1/4 h-80 w-80 rounded-full bg-indigo-600/20 blur-[120px]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{
              opacity: 0,
              y: reducedMotion ? 0 : 25,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.8 }}
          >
            <div className="glass-dark mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wide text-blue-200">
              <Activity size={16} />
              THE NEXT GENERATION OF CONNECTED CARE
            </div>

            <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.12] tracking-[-0.045em] md:text-6xl xl:text-7xl">
              Healthcare,
              <br />
              reimagined for
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                a connected world.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
              Bridging the gap between patients, doctors
              and intelligent technology. Experience a new
              approach to health monitoring, personalized
              recovery and connected care.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/register/doctor"
                className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-sm font-bold shadow-xl shadow-blue-600/25 hover:-translate-y-1 hover:shadow-blue-500/40"
              >
                Get started
                <ArrowRight size={19} />
              </Link>

              <a
                href="#features"
                className="glass-dark flex items-center gap-3 rounded-xl px-7 py-4 text-sm font-semibold hover:bg-white/15"
              >
                Explore platform
                <ArrowUpRight size={18} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-blue-300" />
                Privacy-focused
              </span>
              <span className="flex items-center gap-2">
                <Wifi size={17} className="text-blue-300" />
                IoT-enabled
              </span>
              <span className="flex items-center gap-2">
                <HeartPulse size={17} className="text-blue-300" />
                Patient-centered
              </span>
            </div>
          </motion.div>

          {/* Conceptual product visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 1.2,
            }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="glass-dark rounded-[30px] p-7 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200">
                  <HeartPulse size={27} />
                </div>
                <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-blue-200">
                  Platform concept
                </span>
              </div>

              <h2 className="mt-7 text-2xl font-bold">
                Connected health
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Your care ecosystem, intelligently connected.
              </p>

              <svg
                viewBox="0 0 320 100"
                className="mt-5 w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="pulseGradient">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#C4B5FD" />
                  </linearGradient>
                </defs>
                {[20, 50, 80].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="320"
                    y2={y}
                    stroke="white"
                    strokeOpacity=".08"
                  />
                ))}
                <motion.path
                  d="M0 52 H45 L57 43 L72 60 L85 15 L101 88 L115 52 H157 L169 42 L180 59 L195 25 L208 76 L220 52 H320"
                  fill="none"
                  stroke="url(#pulseGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: reducedMotion ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 2 }}
                />
              </svg>

              <p className="mb-5 text-[10px] text-slate-400">
                Decorative waveform — not patient data
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <Activity className="mb-3 text-blue-300" size={22} />
                  <p className="text-sm font-semibold">
                    Vital signs
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    IoT monitoring
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <BrainCircuit className="mb-3 text-violet-300" size={22} />
                  <p className="text-sm font-semibold">
                    Health insights
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    AI assistance
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-dark animate-float absolute -right-5 -top-6 hidden items-center gap-3 rounded-2xl p-4 sm:flex">
              <Cpu className="text-blue-300" />
              <div>
                <p className="text-xs font-semibold">
                  Smart technology
                </p>
                <p className="text-[10px] text-slate-300">
                  Connected devices
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Features */}
      <section
        id="features"
        className="relative scroll-mt-28 px-6 py-28 md:px-12"
      >
        <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-indigo-200/40 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand">
              Designed for better care
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-midnight md:text-5xl">
              Health technology.
              <br />
              With a human focus.
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              One integrated platform designed to simplify
              monitoring, connect care teams and make
              health information more accessible.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon

              return (
                <motion.article
                  key={feature.title}
                  {...reveal}
                  transition={{
                    duration: reducedMotion ? 0 : 0.5,
                    delay: reducedMotion ? 0 : index * 0.06,
                  }}
                  className="glass group rounded-[26px] p-8 transition-shadow hover:shadow-xl"
                >
                  <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-brand transition-colors group-hover:bg-indigo-200">
                    <Icon size={26} strokeWidth={1.8} />
                  </div>

                  <h3 className="text-xl font-bold text-midnight">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative scroll-mt-28 overflow-hidden bg-midnight px-6 py-28 text-white md:px-12"
      >
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/25 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <motion.div {...reveal} className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">
              How it works
            </span>

            <h2 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
              From device to doctor.
              <br />
              Seamlessly connected.
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon

              return (
                <motion.div
                  key={step.number}
                  {...reveal}
                  className="glass-dark rounded-[26px] p-8"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={30} className="text-blue-300" />
                    <span className="font-heading text-5xl font-extrabold text-white/15">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-9 text-xl font-bold">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* User Portals */}
      <section
        id="about"
        className="scroll-mt-28 px-6 py-28 md:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div {...reveal} className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand">
              Your connected workspace
            </span>

            <h2 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
              Built around you.
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <motion.div
              {...reveal}
              className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#111C42] to-[#243D87] p-9 text-white md:p-12"
            >
              <Stethoscope size={40} className="text-blue-300" />

              <h3 className="mt-8 text-3xl font-bold">
                For doctors
              </h3>

              <p className="mt-4 max-w-md leading-7 text-blue-100">
                Manage patients, review monitoring data,
                track recovery and stay informed through
                a dedicated clinical workspace.
              </p>

              <Link
                to="/register/doctor"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-sm font-bold text-midnight hover:bg-blue-100"
              >
                Create doctor account
                <ArrowUpRight size={18} />
              </Link>
            </motion.div>

            <motion.div
              {...reveal}
              className="glass rounded-[30px] p-9 md:p-12"
            >
              <HeartPulse size={40} className="text-brand" />

              <h3 className="mt-8 text-3xl font-bold text-midnight">
                For patients
              </h3>

              <p className="mt-4 max-w-md leading-7 text-slate-600">
                Stay informed about your health readings,
                recovery journey, medical instructions
                and personal health reports.
              </p>

              <Link
                to="/login?role=patient"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-brand px-6 py-4 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Access patient portal
                <ArrowUpRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security and Safety */}
      <section className="px-6 pb-24 md:px-12">
        <div className="glass mx-auto flex max-w-7xl flex-col items-start gap-6 rounded-[28px] p-8 md:flex-row md:items-center md:p-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-brand">
            <Fingerprint size={32} />
          </div>

          <div>
            <h3 className="text-xl font-bold text-midnight">
              Privacy and responsible care
            </h3>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
              MediConnect is a healthcare monitoring
              prototype designed around authorized
              access and responsible data handling.
              It is not a certified medical device or
              a substitute for professional medical advice
              or emergency services.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-midnight px-6 pb-8 pt-16 text-white md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-3">
            <div>
              <Logo light />
              <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">
                Connecting people, technology and
                healthcare for a more informed
                approach to patient care.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 text-sm text-slate-400">
              <h3 className="font-bold text-white">
                Platform
              </h3>
              <a href="#features" className="hover:text-white">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white">
                How it works
              </a>
              <a href="#about" className="hover:text-white">
                About MediConnect
              </a>
            </div>

            <div className="flex flex-col items-start gap-4 text-sm text-slate-400">
              <h3 className="font-bold text-white">
                Access
              </h3>
              <Link to="/register/doctor" className="hover:text-white">
                Doctor registration
              </Link>
              <Link to="/login?role=patient" className="hover:text-white">
                Patient portal
              </Link>
              <Link to="/login?role=admin" className="hover:text-white">
                Administrator access
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-4 pt-8 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} MediConnect.
              All rights reserved.
            </p>
            <p>Designed for connected care.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}