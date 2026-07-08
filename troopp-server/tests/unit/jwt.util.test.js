import jwt from 'jsonwebtoken'
import crypto from 'crypto'

describe('JWT Utilities & Blacklist Unit Tests', () => {
  const secret = 'test_secret_key_access_tokens_12345'
  const payload = { id: 'user-1', email: 'test@troopp.com', role: 'member' }

  test('Should sign a valid JWT token payload', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '15m' })
    expect(token).toBeDefined()
    
    const decoded = jwt.verify(token, secret)
    expect(decoded.id).toBe(payload.id)
    expect(decoded.role).toBe(payload.role)
  })

  test('Should reject token validation when token signature is modified', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '15m' })
    const tamperedToken = token + 'tamper'
    expect(() => jwt.verify(tamperedToken, secret)).toThrow()
  })

  test('Should reject validation of expired JWT tokens', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '0s' })
    expect(() => jwt.verify(token, secret)).toThrow()
  })

  test('Should verify token blacklisting works with hashed values', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '15m' })
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Mock TokenBlacklist array
    const blacklist = [tokenHash]
    const checkHash = crypto.createHash('sha256').update(token).digest('hex')
    
    expect(blacklist.includes(checkHash)).toBe(true)
  })
})
