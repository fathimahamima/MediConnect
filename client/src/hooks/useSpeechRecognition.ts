import { useEffect, useRef, useState } from 'react'

interface RecognitionResult {
  results: ArrayLike<ArrayLike<{
    transcript: string
  }>>
}

interface BrowserRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean

  onresult: ((event: RecognitionResult) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null

  start(): void
  stop(): void
  abort(): void
}

type RecognitionConstructor = new () => BrowserRecognition

export function useSpeechRecognition(
  onCommand: (command: string) => void
) {

  const browser = window as unknown as {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }

  const Recognition =
    browser.SpeechRecognition ||
    browser.webkitSpeechRecognition

  const recognition = useRef<BrowserRecognition | null>(null)

  const callback = useRef(onCommand)

  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    callback.current = onCommand
  }, [onCommand])

  useEffect(() => {

    return () => {

      if (recognition.current) {

        recognition.current.onresult = null
        recognition.current.onerror = null
        recognition.current.onend = null

        recognition.current.abort()
      }
    }

  }, [])

  function startListening() {

    if (!Recognition || listening) return

    setError('')

    const instance = new Recognition()

    instance.lang = 'en-IN'
    instance.continuous = false
    instance.interimResults = false

    instance.onresult = event => {

      const transcript =
        event.results[0][0].transcript

      callback.current(transcript)
    }

    instance.onerror = event => {

      setListening(false)

      setError(
        `Speech recognition error: ${event.error}`
      )
    }

    instance.onend = () => {
      setListening(false)
    }

    recognition.current = instance

    try {

      instance.start()
      setListening(true)

    } catch {

      setListening(false)
      setError('Unable to start microphone')
    }
  }

  function stopListening() {

    recognition.current?.stop()
    setListening(false)
  }

  return {
    supported: Boolean(Recognition),
    listening,
    error,
    startListening,
    stopListening,
  }
}