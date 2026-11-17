import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  requireTLS: Number(process.env.SMTP_PORT) !== 465,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function verifyEmailConnection() {
  await transporter.verify()

  console.log(
    'MediConnect email service connected'
  )
}

export async function sendEmail(
  options: EmailOptions
) {
  const result = await transporter.sendMail({
    from: {
      name:
        process.env.EMAIL_FROM_NAME ||
        'MediConnect',

      address:
        process.env.EMAIL_FROM_ADDRESS || '',
    },

    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  if (!result.accepted.length) {
    throw new Error('Email recipient not accepted')
  }

  return {
    messageId: result.messageId,
    accepted: result.accepted,
  }
}