import crypto from 'crypto'
import logger from '../config/logger.js'

// Key length for aes-256-cbc must be 32 bytes (256 bits)
// IV length for aes-256-cbc must be 16 bytes (128 bits)
const ALGORITHM = 'aes-256-cbc'

const getEncryptionKeys = () => {
  const envKey = process.env.ENCRYPTION_KEY
  let keyBuffer
  
  if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
    keyBuffer = Buffer.from(envKey, 'hex')
  } else {
    const fallbackKey = envKey || 'default_secret_encryption_key_32bytes_long!'
    keyBuffer = crypto.createHash('sha256').update(fallbackKey).digest()
  }

  const envIv = process.env.ENCRYPTION_IV
  let ivBuffer
  if (envIv && /^[0-9a-fA-F]{32}$/.test(envIv)) {
    ivBuffer = Buffer.from(envIv, 'hex')
  } else {
    const fallbackIv = envIv || 'default_iv_16bytes'
    ivBuffer = crypto.createHash('md5').update(fallbackIv).digest()
  }

  return { key: keyBuffer, iv: ivBuffer }
}

/**
 * Encrypt a text string using AES-256-CBC.
 * @param {string} text - Text to encrypt
 * @returns {string} encrypted hex string
 */
export const encrypt = (text) => {
  if (!text) {
    return null
  }
  try {
    const { key, iv } = getEncryptionKeys()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  } catch (error) {
    logger.error('Encryption failed:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt a hex string using AES-256-CBC.
 * @param {string} encryptedText - Hex string to decrypt
 * @returns {string} decrypted utf8 text
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) {
    return null
  }
  try {
    const { key, iv } = getEncryptionKeys()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    logger.error('Decryption failed:', error)
    return null // Return null on decryption errors to prevent crashes
  }
}
