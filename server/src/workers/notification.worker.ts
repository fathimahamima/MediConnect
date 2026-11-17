
import {
  processEmailNotifications,
} from '../services/alert-notification.service.js'

let running = false

let timer:
  ReturnType<typeof setInterval> | null = null

const POLL_INTERVAL = 5000

async function processNotifications() {

  if (running) return

  running = true

  try {

    await processEmailNotifications()

  } catch {

    console.error('Notification worker error')

  } finally {

    running = false
  }
}

export function startNotificationWorker() {

  if (timer) return

  timer = setInterval(() => {

    void processNotifications()

  }, POLL_INTERVAL)

  timer.unref()

  void processNotifications()

  console.log(
    'Notification worker started with retry support'
  )
}

export function stopNotificationWorker() {

  if (timer) {

    clearInterval(timer)

    timer = null
  }

  console.log('Notification worker stopped')
}
