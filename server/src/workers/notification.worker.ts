import {
  processEmailNotifications,
} from '../services/alert-notification.service.js'

let running = false

let timer: ReturnType<typeof setInterval> | null = null

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

  void processNotifications()

  timer = setInterval(() => {

    void processNotifications()

  }, 5000)

  timer.unref()

  console.log('Notification worker started')
}

export function stopNotificationWorker() {

  if (timer) {

    clearInterval(timer)

    timer = null
  }
}