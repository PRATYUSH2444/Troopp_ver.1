import { generateEmailOTP, verifyEmailOTP, sendPhoneOTP, verifyPhoneOTP } from '../../src/services/otp.service.js'

describe('OTP Verification Service Unit Tests', () => {
  const testEmail = 'test-otp@troopp.com'
  const testPhone = '+919876543210'

  test('Should generate a 6-digit numeric email OTP code', () => {
    const code = generateEmailOTP(testEmail)
    expect(code).toHaveLength(6)
    expect(/^\d+$/.test(code)).toBe(true)
  })

  test('Should verify a valid email OTP successfully', () => {
    const code = generateEmailOTP(testEmail)
    const result = verifyEmailOTP(testEmail, code)
    expect(result).toBe(true)
  })

  test('Should reject verification of an invalid email OTP code', () => {
    generateEmailOTP(testEmail)
    const result = verifyEmailOTP(testEmail, '999999')
    expect(result).toBe(false)
  })

  test('Should reject verification of a non-cached email OTP', () => {
    const result = verifyEmailOTP('uncached@troopp.com', '123456')
    expect(result).toBe(false)
  })

  test('Should verify sandbox phone OTP code successfully when Twilio is unconfigured', async () => {
    await sendPhoneOTP(testPhone)
    const result = await verifyPhoneOTP(testPhone, '123456')
    expect(result).toBe(true)
  })

  test('Should reject incorrect sandbox phone OTP code', async () => {
    await sendPhoneOTP(testPhone)
    const result = await verifyPhoneOTP(testPhone, '999999')
    expect(result).toBe(false)
  })
})
