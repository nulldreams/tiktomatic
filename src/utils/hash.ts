import crypto from 'crypto'
import crc from 'crc'

export const hmac = (key, string, encoding) => {
  return crypto.createHmac('sha256', key).update(string, 'utf8').digest(encoding)
}

export const hash = (string, encoding) => {
  return crypto.createHash('sha256').update(string, 'utf8').digest(encoding)
}

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const crcCalc = (content) => {
  return crc.crc32(content).toString(16).padStart(8, '0')
}

export const getCreationId = () => {
  const length = 21
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let creationid = ''
  for (let i = 0; i < length; i++) {
    creationid += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return creationid
}
