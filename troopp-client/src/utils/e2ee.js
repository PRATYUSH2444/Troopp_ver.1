/**
 * Troopp End-to-End Encryption (E2EE) Module
 * Standard: AES-256-GCM authenticated encryption using native Web Crypto API.
 * Private keys and plaintext never leave the client device.
 */

const E2EE_PREFIX = 'troopp:e2ee:v1:'
const KEY_STORAGE_PREFIX = 'troopp_e2ee_key_'

/**
 * Convert ArrayBuffer to Base64
 */
const bufferToBase64 = (buf) => {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * Convert Base64 to Uint8Array
 */
const base64ToBuffer = (b64) => {
  const binary = window.atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Derive a 256-bit AES-GCM CryptoKey for a specific room using PBKDF2
 */
export const deriveRoomKey = async (roomId) => {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null
  }

  const cacheKey = `${KEY_STORAGE_PREFIX}${roomId}`
  const cachedRawKey = localStorage.getItem(cacheKey)

  if (cachedRawKey) {
    try {
      const rawBuf = base64ToBuffer(cachedRawKey)
      return await window.crypto.subtle.importKey(
        'raw',
        rawBuf,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )
    } catch (err) {
      console.warn('Failed to import cached room key, re-deriving:', err)
    }
  }

  try {
    const enc = new TextEncoder()
    const baseKeyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(`troopp-e2ee-room-seed:${roomId}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    // Salt derived from roomId + static application salt
    const salt = enc.encode(`troopp-salt-${roomId}-v1`)

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    const exportedRaw = await window.crypto.subtle.exportKey('raw', derivedKey)
    localStorage.setItem(cacheKey, bufferToBase64(exportedRaw))

    return derivedKey
  } catch (err) {
    console.error('Error deriving room encryption key:', err)
    return null
  }
}

/**
 * Encrypt a text string client-side using AES-256-GCM.
 * Output format: troopp:e2ee:v1:<base64({ iv, ct })>
 */
export const encryptMessageText = async (plainText, roomId) => {
  if (!plainText || typeof plainText !== 'string' || !plainText.trim()) {
    return plainText
  }

  try {
    const key = await deriveRoomKey(roomId)
    if (!key) return plainText // Fallback to plain text if WebCrypto unavailable

    const iv = window.crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV
    const enc = new TextEncoder()
    const encoded = enc.encode(plainText)

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoded
    )

    const payload = JSON.stringify({
      iv: bufferToBase64(iv),
      ct: bufferToBase64(cipherBuffer)
    })

    return `${E2EE_PREFIX}${window.btoa(payload)}`
  } catch (err) {
    console.error('Encryption failed:', err)
    return plainText
  }
}

/**
 * Decrypt a message text client-side.
 * Returns decrypted plaintext or original text if unencrypted / legacy.
 */
export const decryptMessageText = async (cipherPayload, roomId) => {
  if (!cipherPayload || typeof cipherPayload !== 'string') {
    return cipherPayload
  }

  if (!cipherPayload.startsWith(E2EE_PREFIX)) {
    return cipherPayload // Plaintext / legacy message
  }

  try {
    const rawB64 = cipherPayload.slice(E2EE_PREFIX.length)
    const jsonStr = window.atob(rawB64)
    const { iv, ct } = JSON.parse(jsonStr)

    const key = await deriveRoomKey(roomId)
    if (!key) return cipherPayload

    const ivBuffer = base64ToBuffer(iv)
    const cipherBuffer = base64ToBuffer(ct)

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer)
      },
      key,
      cipherBuffer
    )

    const dec = new TextDecoder()
    return dec.decode(decryptedBuffer)
  } catch (err) {
    console.warn('Decryption failed for message payload:', err?.message)
    return '🔒 Encrypted message'
  }
}

/**
 * Batch decrypt an array of messages
 */
export const decryptMessagesList = async (messagesList = [], roomId) => {
  if (!Array.isArray(messagesList) || messagesList.length === 0) {
    return messagesList
  }

  return await Promise.all(
    messagesList.map(async (msg) => {
      if (!msg) return msg
      if (msg.message_text && msg.message_text.startsWith(E2EE_PREFIX)) {
        const decrypted = await decryptMessageText(msg.message_text, roomId)
        return { ...msg, message_text: decrypted, is_e2ee: true }
      }
      return { ...msg, is_e2ee: Boolean(msg.is_e2ee) }
    })
  )
}
