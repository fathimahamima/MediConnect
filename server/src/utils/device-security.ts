import {
  randomBytes,
  createHash,
  timingSafeEqual,
} from 'node:crypto'

export function generateDeviceCode() {
  return `MC-DEV-${randomBytes(4)
    .toString('hex')
    .toUpperCase()}`
}

export function generateDeviceApiKey() {
  return randomBytes(32).toString('hex')
}

export function hashDeviceApiKey(
  apiKey: string
) {
  return createHash('sha256')
    .update(apiKey)
    .digest('hex')
}

export function verifyDeviceApiKey(
  apiKey: string,
  storedHash: string
) {
  const supplied = Buffer.from(
    hashDeviceApiKey(apiKey),
    'hex'
  )

  const expected = Buffer.from(
    storedHash,
    'hex'
  )

  if (supplied.length !== expected.length) {
    return false
  }

  return timingSafeEqual(
    supplied,
    expected
  )
}