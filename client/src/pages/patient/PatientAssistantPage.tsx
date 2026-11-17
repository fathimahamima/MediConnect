import { useEffect, useState } from 'react'

import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  HeartPulse,
  Droplets,
  Thermometer,
  Pill,
  Bell,
} from 'lucide-react'

import { patientService } from '../../services/patient.service'

import type {
  PatientPortalOverview,
} from '../../types/patient-portal'

import { useLiveVitals } from '../../hooks/useLiveVitals'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

import {
  speakText,
  stopSpeaking,
} from '../../utils/speech'

interface Message {
  role: 'USER' | 'ASSISTANT'
  content: string
}

export default function PatientAssistantPage() {

  const [overview, setOverview] =
    useState<PatientPortalOverview | null>(null)

  const [command, setCommand] = useState('')

  const [voiceEnabled, setVoiceEnabled] =
    useState(false)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ASSISTANT',
      content:
        'Hello! I am your MediConnect assistant. ' +
        'Ask me about your measurements, medications, ' +
        'health alerts or treating doctor.',
    },
  ])

  const { reading, status } = useLiveVitals(
    overview?.patient.id,
    Boolean(
      overview?.patient.monitoringConsentAt &&
      overview?.patient.assignments.length
    )
  )

  useEffect(() => {

    async function load() {
      try {

        const data = await patientService.getOverview()

        setOverview(data)

      } catch {

        setOverview(null)
      }
    }

    void load()

    const timer = window.setInterval(
      () => void load(),
      15000
    )

    return () => {
      window.clearInterval(timer)
      stopSpeaking()
    }

  }, [])

  function handleCommand(text: string) {

    if (!text.trim()) return

    const query = text.toLowerCase().trim()

    let answer = ''

    const fresh =
      status === 'LIVE' &&
      reading &&
      Date.now() -
        new Date(reading.recordedAt).getTime() <= 15000

    if (
      query.includes('emergency') ||
      query.includes('sos') ||
      query.includes('chest pain') ||
      query.includes('cannot breathe')
    ) {

      answer =
        'If you need emergency assistance, call 112 directly. ' +
        'You can also open Notifications to record an SOS request. ' +
        'I cannot dispatch emergency services.'

    } else if (
      query.includes('heart') ||
      query.includes('pulse')
    ) {

      answer =
        fresh &&
        reading.signalQuality === 'GOOD' &&
        reading.heartRate !== null

          ? `Your latest measured heart rate is ${
              reading.heartRate
            } beats per minute.`

          : 'A valid live heart rate reading is not available. ' +
            'Please check your device and sensor contact.'

    } else if (
      query.includes('oxygen') ||
      query.includes('spo2') ||
      query.includes('saturation')
    ) {

      answer =
        fresh &&
        reading.signalQuality === 'GOOD' &&
        reading.spo2 !== null

          ? `Your latest measured oxygen saturation is ${
              reading.spo2
            } percent.`

          : 'A valid live oxygen saturation reading is unavailable.'

    } else if (
      query.includes('temperature')
    ) {

      answer =
        fresh && reading.temperature !== null

          ? `Your latest sensor temperature is ${
              reading.temperature.toFixed(1)
            } degrees Celsius. This is not a validated core body temperature.`

          : 'A live temperature measurement is unavailable.'

    } else if (
      query.includes('medicine') ||
      query.includes('medication')
    ) {

      const medications = overview?.medications.filter(
        item =>
          new Date(item.startDate).getTime() <= Date.now() &&
          (!item.endDate ||
            new Date(item.endDate).getTime() >= Date.now())
      )

      answer = !overview

        ? 'Medication information is currently unavailable.'

        : medications?.length

          ? medications.map(item =>
              `${item.medicineName}. Prescribed dosage: ` +
              `${item.dosage}. Frequency: ${item.frequency}.`
            ).join(' ')

          : 'No current medications were found in your retrieved records.'

    } else if (
      query.includes('alert') ||
      query.includes('notification')
    ) {

      answer = overview

        ? `Your last retrieved record contains ${
            overview.openAlerts
          } open health alerts. Check Notifications for details.`

        : 'Alert information is currently unavailable.'

    } else if (
      query.includes('doctor')
    ) {

      answer = overview

        ? `Your treating doctor is ${
            overview.patient.doctor.user.fullName
          }. Specialization: ${
            overview.patient.doctor.specialization
          }.`

        : 'Doctor information is unavailable.'

    } else if (
      query.includes('recovery') ||
      query.includes('health status')
    ) {

      answer =
        'Please open the Recovery section to compare your ' +
        'recorded measurements with your doctor-defined targets. ' +
        'I cannot determine whether you have recovered.'

    } else {

      answer =
        'You can ask me about heart rate, oxygen saturation, ' +
        'temperature, medications, alerts or your doctor. ' +
        'I cannot provide diagnoses or change your treatment.'
    }

    setMessages(previous => [
      ...previous,
      { role: 'USER', content: text },
      { role: 'ASSISTANT', content: answer },
    ].slice(-40) as Message[])

    setCommand('')

    if (voiceEnabled) {
      speakText(answer)
    }
  }

  const speech = useSpeechRecognition(handleCommand)

  const suggestions = [
    {
      icon: HeartPulse,
      text: 'What is my heart rate?',
    },
    {
      icon: Droplets,
      text: 'What is my oxygen level?',
    },
    {
      icon: Thermometer,
      text: 'What is my temperature?',
    },
    {
      icon: Pill,
      text: 'What are my medications?',
    },
    {
      icon: Bell,
      text: 'Do I have any alerts?',
    },
  ]

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          Health assistant
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Voice-enabled access to your health information.
        </p>

      </div>

      <div className="rounded-[28px] bg-gradient-to-br from-[#080F26] via-[#172554] to-[#4338CA] p-10 text-center text-white">

        <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-indigo-300/30 bg-indigo-400/20">

          {speech.listening && (
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
          )}

          <Sparkles size={45} className="text-indigo-200" />

        </div>

        <h2 className="mt-6 text-2xl font-bold">
          Your MediConnect assistant
        </h2>

        <p className="mt-3 text-sm text-indigo-200">
          {speech.listening
            ? 'Listening to your command...'
            : 'How can I help you today?'}
        </p>

        <div className="mt-6 flex justify-center gap-3">

          <button
            disabled={!speech.supported}
            onClick={
              speech.listening
                ? speech.stopListening
                : speech.startListening
            }
            className="rounded-full bg-indigo-500 p-5 disabled:opacity-40"
            aria-label="Toggle microphone"
          >

            {speech.listening
              ? <MicOff size={25} />
              : <Mic size={25} />}

          </button>

          <button
            onClick={() => {

              if (voiceEnabled) stopSpeaking()

              setVoiceEnabled(!voiceEnabled)
            }}
            className="rounded-full border border-white/20 bg-white/10 p-5"
            aria-label="Toggle spoken responses"
          >

            {voiceEnabled
              ? <Volume2 size={25} />
              : <VolumeX size={25} />}

          </button>

        </div>

        <p className="mt-4 text-xs text-indigo-200">
          Spoken responses: {voiceEnabled ? 'On' : 'Off'}
        </p>

        {!speech.supported && (

          <p className="mt-4 text-xs text-amber-200">
            Voice recognition is unavailable in this browser.
            You can type your commands instead.
          </p>

        )}

        {speech.error && (

          <p className="mt-4 text-xs text-rose-200">
            {speech.error}
          </p>

        )}

      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

        {suggestions.map(item => (

          <button
            key={item.text}
            onClick={() => handleCommand(item.text)}
            className="dashboard-card flex items-center gap-3 p-4 text-left text-sm text-slate-700"
          >

            <item.icon size={21} className="text-indigo-600" />

            {item.text}

          </button>

        ))}

      </div>

      <div className="dashboard-card p-5">

        <div className="max-h-[420px] space-y-4 overflow-y-auto p-2">

          {messages.map((message, index) => (

            <div
              key={index}
              className={`flex ${
                message.role === 'USER'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >

              <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                message.role === 'USER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}>

                {message.content}

              </div>

            </div>

          ))}

        </div>

        <form
          onSubmit={event => {

            event.preventDefault()

            handleCommand(command)
          }}
          className="mt-5 flex gap-3"
        >

          <input
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder="Ask about your health measurements..."
            className="dashboard-input"
          />

          <button
            type="submit"
            disabled={!command.trim()}
            className="dashboard-button"
            aria-label="Send message"
          >

            <Send size={20} />

          </button>

        </form>

      </div>

      <p className="rounded-xl bg-indigo-50 p-4 text-xs leading-relaxed text-slate-600">

        This assistant retrieves recorded information using
        predefined commands. It does not diagnose conditions.
        Browser speech recognition may process audio externally.
        Avoid speaking confidential information.

      </p>

    </div>
  )
}