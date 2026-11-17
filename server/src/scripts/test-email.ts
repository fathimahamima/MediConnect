import 'dotenv/config'

import {
  verifyEmailConnection,
  sendEmail,
} from '../services/email.service.js'

import {
  emailTemplate,
} from '../services/email.templates.js'

async function testEmail() {
  const recipient = process.env.TEST_EMAIL

  if (!recipient) {
    throw new Error(
      'TEST_EMAIL is missing from .env'
    )
  }

  await verifyEmailConnection()

  const result = await sendEmail({
    to: recipient,

    subject: 'MediConnect | Email service activated',

    text:
      'Your MediConnect email integration is working.',

    html: emailTemplate({
      category: 'SYSTEM CONFIGURATION',

      title: 'Connected successfully!',

      message:
        'Your MediConnect email service is now operational. This message was sent directly from your application backend.',

      notice:
        'This is a test notification. No patient information is included.',
    }),
  })

  console.log('================================')
  console.log('MEDICONNECT EMAIL SERVICE')
  console.log('Email accepted by SMTP server')
  console.log('Message ID:', result.messageId)
  console.log('================================')
}

testEmail().catch(error => {
  console.error(
    'Email test failed:',
    error instanceof Error
      ? error.message
      : 'Unknown error'
  )

  process.exitCode = 1
})