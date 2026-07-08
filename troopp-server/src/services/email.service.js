import nodemailer from 'nodemailer'
import logger from '../config/logger.js'

let transporter

/**
 * Configure Nodemailer SMTP Transporter.
 * Uses Ethereal test accounts in development or fallbacks if credentials are not defined.
 */
const getTransporter = async () => {
  if (transporter) {
    return transporter
  }

  const { GMAIL_USER, GMAIL_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  const user = GMAIL_USER || SMTP_USER
  const pass = GMAIL_PASSWORD || SMTP_PASS
  const host = SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(SMTP_PORT || '587', 10)

  // If credentials are provided
  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    })
    logger.info(`Nodemailer configured to use SMTP (${host}:${port}).`)
    return transporter
  }

  // Local development fallback: create an Ethereal virtual mail account
  try {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    })
    logger.info(`Nodemailer configured with Ethereal virtual mail. Access logs at: https://ethereal.email/ (User: ${testAccount.user})`)
    return transporter
  } catch (error) {
    logger.error('Failed to create Ethereal email transporter, falling back to console logger:', error)
    // Return a dummy transporter that just logs to console
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
 * Send an OTP signup verification email.
 * @param {string} to - Receiver email
 * @param {string} otp - 6-digit code
 */
export const sendOTPEmail = async (to, otp) => {
  try {
    const client = await getTransporter()
    const mailOptions = {
      from: `"Troopp Support" <${process.env.GMAIL_USER || 'no-reply@troopp.in'}>`,
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

    const info = await client.sendMail(mailOptions)
    logger.info(`Verification email sent successfully: ${info.messageId}`)
    return info
  } catch (error) {
    logger.error(`Error sending email to ${to}:`, error)
    throw error
  }
}

/**
 * Send password reset link email.
 * @param {string} to - Receiver email
 * @param {string} token - Reset hex string
 */
export const sendResetPasswordEmail = async (to, token) => {
  try {
    const client = await getTransporter()
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
    const mailOptions = {
      from: `"Troopp Support" <${process.env.GMAIL_USER || 'no-reply@troopp.in'}>`,
      to,
      subject: 'Troopp - Reset your Password',
      text: `Reset your Troopp password using this link: ${resetUrl}. Link expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E7E5E4; border-radius: 12px;">
          <h2 style="color: #F97316;">Password Reset Request</h2>
          <p style="font-size: 14px; color: #1C1917;">We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #F97316; color: #FFFFFF; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #78716C;">If you cannot click the button, copy and paste this link in your browser:</p>
          <p style="font-size: 12px; color: #1D4ED8; word-break: break-all;">${resetUrl}</p>
          <p style="font-size: 11px; color: #78716C; margin-top: 20px;">This link is valid for 15 minutes. If you did not request this change, please ignore this request.</p>
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
