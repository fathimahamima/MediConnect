interface EmailInput {
  to: string
  subject: string
  html: string
  text: string
}

function getEmailConfig() {

  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.EMAIL_FROM_ADDRESS

  const senderName =
    process.env.EMAIL_FROM_NAME || 'MediConnect'

  if (!apiKey || !senderEmail) {
    throw new Error('Email configuration is incomplete')
  }

  return {
    apiKey,
    senderEmail,
    senderName,
  }
}

export async function verifyEmailConnection() {

  const { apiKey } = getEmailConfig()

  const response = await fetch(
    'https://api.brevo.com/v3/account',
    {
      method: 'GET',

      headers: {
        'api-key': apiKey,
        accept: 'application/json',
      },

      signal: AbortSignal.timeout(15000),
    }
  )

  if (!response.ok) {
    throw new Error(
      `Brevo verification failed: ${response.status}`
    )
  }

  return true
}

export async function sendEmail(input: EmailInput) {

  const {
    apiKey,
    senderEmail,
    senderName,
  } = getEmailConfig()

  const response = await fetch(
    'https://api.brevo.com/v3/smtp/email',
    {
      method: 'POST',

      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },

      body: JSON.stringify({

        sender: {
          name: senderName,
          email: senderEmail,
        },

        to: [
          {
            email: input.to,
          },
        ],

        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
      }),

      signal: AbortSignal.timeout(20000),
    }
  )

  if (!response.ok) {
    throw new Error(
      `Brevo email request failed: ${response.status}`
    )
  }

  const result = await response.json() as {
    messageId?: string
  }

  if (!result.messageId) {
    throw new Error('Brevo message ID missing')
  }

  return {
    messageId: result.messageId,
    accepted: [input.to],
  }
}