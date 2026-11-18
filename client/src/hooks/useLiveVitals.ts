import {
  useEffect,
  useState,
} from 'react'

import { io } from 'socket.io-client'

import { API_URL } from '../lib/api'

import type {
  LiveReading,
  LiveConnectionStatus,
} from '../types/live-reading'

export function useLiveVitals(
  patientId: string | undefined,
  enabled = true
) {

  const [reading, setReading] =
    useState<LiveReading | null>(null)

  const [history, setHistory] =
    useState<LiveReading[]>([])

  const [status, setStatus] =
    useState<LiveConnectionStatus>(
      'CONNECTING'
    )

  useEffect(() => {

    setReading(null)
    setHistory([])

    if (!patientId || !enabled) {

      setStatus('UNAVAILABLE')

      return
    }

    setStatus('CONNECTING')

    let lastReceived = 0

    const socketURL = API_URL.startsWith('http')
  ? API_URL.replace(/\/api\/?$/, '')
  : window.location.origin

const socket = io(socketURL, {
  withCredentials: true,

  autoConnect: false,

  transports: ['polling', 'websocket'],

  reconnection: true,

  reconnectionAttempts: Infinity,

  reconnectionDelay: 1000,

  reconnectionDelayMax: 5000,

  timeout: 20000,
})

    const subscribe = () => {

      socket.emit(
        'patient:subscribe',
        patientId,

        (response: {
          success: boolean
        }) => {

          if (response.success) {

            setStatus(previous =>
              previous === 'LIVE'
                ? previous
                : 'WAITING'
            )

          } else {

            setStatus('UNAVAILABLE')
            setReading(null)
          }
        }
      )
    }

    socket.on('connect', () => {

      lastReceived = 0

      setStatus('WAITING')

      subscribe()
    })

    socket.on(
      'vitals:update',
      (data: LiveReading) => {

        if (data.patientId !== patientId) {
          return
        }

        const age =
          Date.now() -
          new Date(data.recordedAt).getTime()

        if (age > 15000) return

        lastReceived = Date.now()

        setReading(data)

        setStatus('LIVE')

        setHistory(previous => {

          const sameAssignment =
            previous.filter(item =>
              item.assignmentId ===
                data.assignmentId
            )

          if (
            sameAssignment[
              sameAssignment.length - 1
            ]?.recordedAt === data.recordedAt
          ) {
            return sameAssignment
          }

          return [
            ...sameAssignment,
            data,
          ].slice(-60)
        })
      }
    )

    socket.on('disconnect', () => {

      lastReceived = 0

      setStatus('OFFLINE')
      setReading(null)
    })

    socket.on('connect_error', (error) => {

  console.error(
    'MediConnect socket connection failed:',
    error.message
  )

  setStatus('OFFLINE')
  setReading(null)
})
    const timer = window.setInterval(() => {

      if (
        lastReceived &&
        Date.now() - lastReceived > 15000
      ) {

        setStatus('OFFLINE')
        setReading(null)

        lastReceived = 0

        if (socket.connected) {
          subscribe()
        }
      }
    }, 1000)

    const subscriptionTimer =
      window.setInterval(() => {

        if (socket.connected) {
          subscribe()
        }
      }, 15000)

    socket.connect()

    return () => {

      window.clearInterval(timer)

      window.clearInterval(
        subscriptionTimer
      )

      socket.emit('patient:unsubscribe')

      socket.removeAllListeners()

      socket.disconnect()
    }

  }, [patientId, enabled])

  return {
    reading,
    history,
    status,
  }
}