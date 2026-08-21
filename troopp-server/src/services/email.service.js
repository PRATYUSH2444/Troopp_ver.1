import nodemailer from 'nodemailer'
import logger from '../config/logger.js'

let transporter

/**
 * Configure Nodemailer SMTP Transporter.
 * Uses strict timeouts to avoid hanging requests.
 */
const getTransporter = async () => {
  if (transporter) {
    return transporter
  }

  const { GMAIL_USER, GMAIL_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NODE_ENV } = process.env
  const user = (GMAIL_USER || SMTP_USER || '').trim()
  const rawPass = (GMAIL_PASSWORD || SMTP_PASS || '').trim()
  const pass = rawPass.replace(/\s+/g, '') // Google App Passwords contain spaces (e.g. "abcd efgh ijkl mnop")
  const host = (SMTP_HOST || 'smtp.gmail.com').trim()
  const port = parseInt(SMTP_PORT || '465', 10)

  // If credentials are provided
  if (user && pass) {
    const isGmail = host.includes('gmail') || user.endsWith('@gmail.com')
    if (isGmail) {
      // Use direct SSL (port 465) for Google Mail on cloud instances
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user,
          pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      })
      logger.info(`Nodemailer configured with Gmail SSL (smtp.gmail.com:465) for: ${user}`)
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      })
      logger.info(`Nodemailer configured with custom SMTP (${host}:${port}) for: ${user}`)
    }
    return transporter
  }

  // In production without credentials, return null so sendOTPEmail can throw an explicit error
  if (NODE_ENV === 'production') {
    logger.warn('[EMAIL CONFIG MISSING]: Neither SMTP_USER/SMTP_PASS nor RESEND_API_KEY is configured on Render.')
    return null
  }

  // Local development fallback: create an Ethereal virtual mail account with timeout protection
  try {
    const testAccountPromise = nodemailer.createTestAccount()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Ethereal account creation timeout')), 3000))
    const testAccount = await Promise.race([testAccountPromise, timeoutPromise])

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000
    })
    logger.info(`Nodemailer configured with Ethereal virtual mail. Access logs at: https://ethereal.email/ (User: ${testAccount.user})`)
    return transporter
  } catch (error) {
    logger.warn('Ethereal setup bypassed, falling back to console logger:', error.message)
    transporter = {
      sendMail: async (mailOptions) => {
        logger.info(`[SMTP DUMMY LOG]: Sending Email to: ${mailOptions.to}. Subject: ${mailOptions.subject}. Content: ${mailOptions.text}`)
        return { messageId: 'dummy-id' }
      }
    }
    return transporter
  }
}

/**
 * Send an OTP signup verification email with strict timeout protection and zero silent failure.
 * @param {string} to - Receiver email
 * @param {string} otp - 6-digit code
 */
export const sendOTPEmail = async (to, otp) => {
  if (to.endsWith('@troopp.com') || to.endsWith('@troopp.in') || process.env.NODE_ENV === 'test') {
    logger.info(`[SMTP BYPASS FOR TEST]: Skipping real SMTP for ${to}. OTP Code: ${otp}`)
    return { messageId: 'mock-test-id' }
  }

  // 1. Check if Resend HTTPS API is available (works 100% on all cloud hosting providers over port 443)
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Troopp <onboarding@resend.dev>',
          to: [to],
          subject: 'Troopp - Verify your Email Address',
          text: `Your Troopp verification code is: ${otp}. This code is valid for 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E5E4; border-radius: 12px;">
              <h2 style="color: #F97316; font-family: 'Plus Jakarta Sans', sans-serif;">Verify your Troopp Account</h2>
              <p style="font-size: 15px; color: #1C1917;">Your friends are busy. Your weekend isn't.</p>
              <p style="font-size: 14px; color: #78716C; margin-top: 20px;">Use the following 6-digit code to complete your email verification:</p>
              <div style="background-color: #FAFAF8; border: 1px dashed #E7E5E4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #F97316;">${otp}</span>
              </div>
              <p style="font-size: 12px; color: #78716C;">This code is valid for 10 minutes. If you did not request this verification, please disregard this email.</p>
            </div>
          `
        })
      })
      const resData = await response.json()
      if (!response.ok) {
        throw new Error(resData.message || resData.error || 'Resend API dispatch error')
      }
      logger.info(`Verification email sent via Resend API to ${to}: ${resData.id}`)
      return { messageId: resData.id }
    } catch (err) {
      logger.error(`Resend API dispatch error: ${err.message}`)
      throw new Error(`Email provider error: ${err.message}`)
    }
  }

  // 2. Fall back to SMTP (Gmail / Custom SMTP)
  const client = await getTransporter()
  if (!client) {
    throw new Error('SMTP_USER and SMTP_PASS are not configured in Render environment variables. Please add them in the Render dashboard.')
  }

  const sender = process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"Troopp" <${process.env.SMTP_USER}>` : '"Troopp" <no-reply@troopp.in>')
  const mailOptions = {
    from: sender,
    to,
    subject: 'Troopp - Verify your Email Address',
    text: `Your Troopp verification code is: ${otp}. This code is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E5E4; border-radius: 12px;">
        <h2 style="color: #F97316; font-family: 'Plus Jakarta Sans', sans-serif;">Verify your Troopp Account</h2>
        <p style="font-size: 15px; color: #1C1917;">Your friends are busy. Your weekend isn't.</p>
        <p style="font-size: 14px; color: #78716C; margin-top: 20px;">Use the following 6-digit code to complete your email verification:</p>
        <div style="background-color: #FAFAF8; border: 1px dashed #E7E5E4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #F97316;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #78716C;">This code is valid for 10 minutes. If you did not request this verification, please disregard this email.</p>
      </div>
    `
  }

  try {
    const sendPromise = client.sendMail(mailOptions)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP server response timed out after 10s')), 10000))
    const info = await Promise.race([sendPromise, timeoutPromise])

    logger.info(`Verification email sent successfully to ${to}: ${info.messageId}`)
    return info
  } catch (error) {
    logger.error(`[EMAIL SEND FAILED] Could not send OTP email to ${to}: ${error.message}. OTP: ${otp}`)
    throw new Error(`Email delivery failed: ${error.message}`)
  }
}

/**
 * Send password reset link email.
 * @param {string} to - Receiver email
 * @param {string} token - Reset hex string
 */
export const sendResetPasswordEmail = async (to, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
    if (to.endsWith('@troopp.com') || to.endsWith('@troopp.in') || process.env.NODE_ENV === 'test') {
      logger.info(`[SMTP BYPASS FOR TEST]: Skipping real SMTP for ${to}. Reset link: ${resetUrl}`)
      return { messageId: 'mock-test-id' }
    }
    const client = await getTransporter()
    const sender = process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"Troopp" <${process.env.SMTP_USER}>` : '"Troopp" <no-reply@troopp.in>')
    const mailOptions = {
      from: sender,
      to,
      subject: 'Troopp - Reset your Password',
      text: `Reset your Troopp password using this link: ${resetUrl}. Link expires in 15 minutes.`,
      html: `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #10151a; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; color: #f3f1ea;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(155deg, #ff6a2c, #d9481a); font-weight: 700; font-size: 20px; color: white; text-align: center;">T</div>
          </div>
          <h2 style="color: #f3f1ea; font-size: 20px; font-weight: 700; text-align: center; margin-top: 0; margin-bottom: 16px;">Reset your password</h2>
          <p style="font-size: 14px; color: #9ba6ad; line-height: 1.6; text-align: center; margin-bottom: 30px;">We received a request to reset your password for your Troopp account. Click the button below to secure your account and set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%); color: #1a0e08; font-weight: 600; font-size: 14.5px; padding: 14px 32px; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 106, 44, 0.25);">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #6b757c; line-height: 1.6; text-align: center; margin-top: 30px; margin-bottom: 8px;">If you cannot click the button above, copy and paste this URL into your browser:</p>
          <p style="font-size: 12px; color: #ff6a2c; text-align: center; word-break: break-all; margin: 0 0 30px 0;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0 20px 0;" />
          <p style="font-size: 11px; color: #6b757c; text-align: center; margin: 0; line-height: 1.5;">This secure reset link is valid for 15 minutes. If you did not request a password change, you can safely ignore this email.</p>
        </div>
      `
    }

    const info = await client.sendMail(mailOptions)
    logger.info(`Reset password link sent to: ${to}`)
    return info
  } catch (error) {
    logger.error(`Error sending reset link to ${to}:`, error)
    throw error
  }
}
