import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'

import {
  ArrowLeft,
  ArrowRight,
  UserRound,
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  UserPlus,
  LoaderCircle,
  CheckCircle2,
  Copy,
  Mail,
  AlertCircle,
} from 'lucide-react'

import { doctorService } from '../../services/doctor.service'
import PageHeader from '../../components/doctor/PageHeader'

import type {
  CreatePatientInput,
  Patient,
} from '../../types/patient'

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  medicalNotes: '',
  contactName: '',
  relationship: '',
  contactPhone: '',
  contactEmail: '',
  contactConsent: false,
  registrationConsent: false,
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="dashboard-label">
        {label}
      </span>

      {children}
    </label>
  )
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="dashboard-card overflow-hidden">

      <div className="flex items-center gap-4 border-b border-slate-100 p-6">

        <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-slate-800">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

      </div>

      <div className="p-6">
        {children}
      </div>

    </section>
  )
}

export default function AddPatientPage() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [createdPatient, setCreatedPatient] =
    useState<Patient | null>(null)

  const [invitationSent, setInvitationSent] =
    useState(false)

  function update<K extends keyof typeof initialForm>(
    field: K,
    value: typeof initialForm[K],
  ) {
    setForm(previous => ({
      ...previous,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (loading) return

    setError('')

    if (!form.registrationConsent) {
      setError('Patient registration consent is required.')
      return
    }

    setLoading(true)

    const payload: CreatePatientInput = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,

      dateOfBirth:
        form.dateOfBirth || undefined,

      gender:
        form.gender || undefined,

      bloodGroup:
        form.bloodGroup || undefined,

      medicalNotes:
        form.medicalNotes || undefined,

      emergencyContact: {
        fullName: form.contactName,
        relationship: form.relationship,
        phone: form.contactPhone,

        email:
          form.contactEmail || undefined,

        consentConfirmed:
          form.contactConsent,
      },

      registrationConsent:
        form.registrationConsent,
    }

    try {
      const result =
        await doctorService.createPatient(payload)

      setCreatedPatient(result.patient)

      setInvitationSent(
        result.invitationSent
      )

      toast.success('Patient registered successfully')

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to register patient'
      )
    } finally {
      setLoading(false)
    }
  }

  async function copyPatientId() {
    if (!createdPatient) return

    try {
      await navigator.clipboard.writeText(
        createdPatient.patientCode
      )

      toast.success('Patient ID copied')
    } catch {
      toast.error('Unable to copy patient ID')
    }
  }

  if (createdPatient) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-2xl rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-xl md:p-12"
      >

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 size={48} />
        </div>

        <h1 className="mt-7 text-3xl font-extrabold">
          Patient registered!
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          {createdPatient.user.fullName} has been
          successfully added to your patient records.
        </p>

        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">

          <p className="text-xs font-semibold tracking-widest text-indigo-500">
            UNIQUE PATIENT ID
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">

            <span className="text-2xl font-extrabold text-indigo-800 md:text-3xl">
              {createdPatient.patientCode}
            </span>

            <button
              onClick={copyPatientId}
              aria-label="Copy patient ID"
              className="rounded-lg bg-white p-3 text-indigo-600"
            >
              <Copy size={19} />
            </button>

          </div>
        </div>

        <div className={`mt-6 flex items-start gap-3 rounded-2xl p-5 text-left ${
          invitationSent
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-amber-50 text-amber-800'
        }`}>

          <Mail size={23} className="shrink-0" />

          <div>
            <p className="text-sm font-bold">
              {invitationSent
                ? 'Invitation submitted'
                : 'Invitation request unsuccessful'}
            </p>

            <p className="mt-2 text-xs leading-6">
              {invitationSent
                ? `The invitation was accepted by the email service for ${createdPatient.user.email}. The patient must activate their account before signing in.`
                : 'The patient account was created. You can resend the invitation from their profile.'}
            </p>
          </div>

        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">

          <Link
            to={`/doctor/patients/${createdPatient.id}`}
            className="dashboard-button"
          >
            View patient profile
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/doctor/patients"
            className="rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600"
          >
            Back to patients
          </Link>

        </div>

        <button
          onClick={() => {
            setCreatedPatient(null)
            setForm(initialForm)
            setInvitationSent(false)
            setError('')
          }}
          className="mt-6 text-sm font-semibold text-indigo-600"
        >
          Register another patient
        </button>

      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">

      <Link
        to="/doctor/patients"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to patients
      </Link>

      <PageHeader
        title="Register new patient"
        description="Create a connected healthcare account for your patient."
      />

      <div className="mb-7 overflow-hidden rounded-3xl bg-[#172554]">

        <div className="relative bg-gradient-to-r from-[#080F26] to-indigo-900 p-7 md:p-9">

          <UserPlus
            size={110}
            className="absolute -right-3 -bottom-5 text-white/10"
          />

          <h2 className="relative text-2xl font-extrabold text-white">
            Start their connected care journey.
          </h2>

          <p className="relative mt-3 max-w-xl text-sm leading-7 text-indigo-200">
            MediConnect automatically generates a
            unique patient ID and sends an activation
            invitation to the patient's registered email.
          </p>

        </div>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        <fieldset
          disabled={loading}
          className="min-w-0 space-y-6"
        >

          <FormSection
            title="Personal information"
            description="Basic identification and contact details."
            icon={<UserRound size={24} />}
          >

            <div className="grid gap-5 md:grid-cols-2">

              <Field label="Full name *">
                <input
                  className="dashboard-input"
                  required
                  minLength={3}
                  maxLength={100}
                  value={form.fullName}
                  onChange={e =>
                    update('fullName', e.target.value)
                  }
                  placeholder="Enter patient full name"
                />
              </Field>

              <Field label="Email address *">
                <input
                  type="email"
                  className="dashboard-input"
                  required
                  value={form.email}
                  onChange={e =>
                    update('email', e.target.value)
                  }
                  placeholder="patient@example.com"
                />
              </Field>

              <Field label="Phone number *">
                <input
                  type="tel"
                  className="dashboard-input"
                  required
                  value={form.phone}
                  onChange={e =>
                    update('phone', e.target.value)
                  }
                  placeholder="+91XXXXXXXXXX"
                />
              </Field>

              <Field label="Date of birth">
                <input
                  type="date"
                  className="dashboard-input"
                  value={form.dateOfBirth}
                  max={new Date().toLocaleDateString('en-CA')}
                  onChange={e =>
                    update('dateOfBirth', e.target.value)
                  }
                />
              </Field>

              <Field label="Gender">
                <select
                  className="dashboard-input"
                  value={form.gender}
                  onChange={e =>
                    update('gender', e.target.value)
                  }
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>

              <Field label="Blood group">
                <select
                  className="dashboard-input"
                  value={form.bloodGroup}
                  onChange={e =>
                    update('bloodGroup', e.target.value)
                  }
                >
                  <option value="">Select blood group</option>

                  {[
                    'A+', 'A-', 'B+', 'B-',
                    'AB+', 'AB-', 'O+', 'O-',
                    'Unknown',
                  ].map(group => (
                    <option key={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </Field>

            </div>

          </FormSection>

          <FormSection
            title="Medical information"
            description="Initial clinical observations and relevant notes."
            icon={<HeartPulse size={24} />}
          >

            <Field label="Medical notes">
              <textarea
                className="dashboard-input min-h-[130px] resize-y"
                maxLength={2000}
                value={form.medicalNotes}
                onChange={e =>
                  update('medicalNotes', e.target.value)
                }
                placeholder="Enter relevant medical history or initial observations..."
              />
            </Field>

            <p className="mt-2 text-right text-xs text-slate-400">
              {form.medicalNotes.length}/2000
            </p>

          </FormSection>

          <FormSection
            title="Emergency contact"
            description="A trusted contact for future emergency notifications."
            icon={<PhoneCall size={24} />}
          >

            <div className="grid gap-5 md:grid-cols-2">

              <Field label="Contact full name *">
                <input
                  className="dashboard-input"
                  required
                  minLength={3}
                  maxLength={100}
                  value={form.contactName}
                  onChange={e =>
                    update('contactName', e.target.value)
                  }
                  placeholder="Emergency contact name"
                />
              </Field>

              <Field label="Relationship *">
                <input
                  className="dashboard-input"
                  required
                  minLength={2}
                  maxLength={50}
                  value={form.relationship}
                  onChange={e =>
                    update('relationship', e.target.value)
                  }
                  placeholder="Parent, spouse, sibling..."
                />
              </Field>

              <Field label="Contact phone *">
                <input
                  type="tel"
                  className="dashboard-input"
                  required
                  value={form.contactPhone}
                  onChange={e =>
                    update('contactPhone', e.target.value)
                  }
                  placeholder="+91XXXXXXXXXX"
                />
              </Field>

              <Field label="Contact email">
                <input
                  type="email"
                  className="dashboard-input"
                  value={form.contactEmail}
                  onChange={e =>
                    update('contactEmail', e.target.value)
                  }
                  placeholder="contact@example.com"
                />
              </Field>

            </div>

            <label className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">

              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-indigo-600"
                checked={form.contactConsent}
                onChange={e =>
                  update('contactConsent', e.target.checked)
                }
              />

              <span className="text-sm leading-6 text-slate-600">
                The emergency contact has agreed to
                receive notifications from MediConnect.
              </span>

            </label>

          </FormSection>

          <FormSection
            title="Consent and permissions"
            description="Confirm authorization before creating the account."
            icon={<ShieldCheck size={24} />}
          >

            <label className="flex items-start gap-3">

              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 accent-indigo-600"
                checked={form.registrationConsent}
                onChange={e =>
                  update(
                    'registrationConsent',
                    e.target.checked
                  )
                }
              />

              <span className="text-sm leading-7 text-slate-600">
                I confirm that the patient, or their
                authorized representative, has agreed
                to the creation of this MediConnect
                account.
              </span>

            </label>

            <p className="mt-4 rounded-xl bg-indigo-50 p-4 text-xs leading-6 text-indigo-700">
              Health monitoring consent will be
              collected separately before device
              monitoring is enabled.
            </p>

          </FormSection>

        </fieldset>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={21} />
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pb-6">

          <Link
            to="/doctor/patients"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-600"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="dashboard-button"
            disabled={loading}
          >

            {loading ? (
              <>
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
                Registering patient...
              </>
            ) : (
              <>
                <UserPlus size={19} />
                Register patient & send invitation
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  )
}