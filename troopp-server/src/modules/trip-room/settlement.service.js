import crypto from 'crypto'
import Razorpay from 'razorpay'
import { Settlement, User, Profile, sequelize } from '../../models/index.js'
import { computeTripLedger } from './ledger.service.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET

let razorpayClient = null
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  try {
    razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    })
  } catch (err) {
    console.warn('⚠️ Razorpay client initialization error:', err.message)
  }
}

/**
 * 1. Initiate Real Settlement (Razorpay Order + DB Pending Record)
 */
export const initiateSettlement = async (activityId, payerId, payeeId, amount, idempotencyKey, paymentMethod = 'upi') => {
  if (!idempotencyKey) {
    throw new AppError('Idempotency key is required to prevent duplicate settlement.', 400, 'MISSING_IDEMPOTENCY_KEY')
  }

  if (payerId === payeeId) {
    throw new AppError('You cannot settle debt with yourself.', 400, 'INVALID_PAYEE')
  }

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount < 0.5) {
    throw new AppError('Invalid settlement amount.', 400, 'INVALID_AMOUNT')
  }

  // Idempotency check: Return existing settlement if already generated
  const existing = await Settlement.findOne({ where: { idempotency_key: idempotencyKey } })
  if (existing) {
    return {
      settlement: existing,
      orderId: existing.provider_order_id,
      keyId: RAZORPAY_KEY_ID || 'rzp_test_mock',
      amount: existing.amount,
      isExisting: true
    }
  }

  // Dynamic Ledger Recomputation at initiation time
  const currentLedger = await computeTripLedger(activityId)
  const payerBalance = currentLedger.memberBalances.find((m) => m.userId === payerId)
  const payeeBalance = currentLedger.memberBalances.find((m) => m.userId === payeeId)

  if (!payerBalance || payerBalance.net >= -0.1) {
    throw new AppError('You currently have no outstanding debt to settle in this trip.', 400, 'NO_DEBT_TO_SETTLE')
  }

  if (!payeeBalance || payeeBalance.net <= 0.1) {
    throw new AppError('Selected payee is not currently a creditor in this trip ledger.', 400, 'INVALID_CREDITOR')
  }

  // Verify amount does not exceed payer's total debt or payee's total credit (allow delta of ₹0.50)
  const maxAllowable = Math.min(Math.abs(payerBalance.net), payeeBalance.net)
  if (numAmount > maxAllowable + 0.5) {
    throw new AppError(
      `Settlement amount ₹${numAmount} exceeds maximum current payable liability ₹${maxAllowable}.`,
      400,
      'AMOUNT_EXCEEDS_NET_DEBT'
    )
  }

  // Production Security Guard
  const isProd = process.env.NODE_ENV === 'production'
  if (isProd && (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)) {
    throw new AppError('Payment gateway credentials missing in production configuration.', 500, 'GATEWAY_CONFIG_ERROR')
  }

  let providerOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  // Create real Razorpay order if credentials exist
  if (razorpayClient) {
    try {
      const order = await razorpayClient.orders.create({
        amount: Math.round(numAmount * 100), // in paise
        currency: 'INR',
        receipt: `troopp_set_${Date.now()}`,
        notes: {
          activityId,
          payerId,
          payeeId,
          idempotencyKey
        }
      })
      providerOrderId = order.id
    } catch (orderErr) {
      console.error('Razorpay order creation failed:', orderErr)
      throw new AppError('Failed to initialize payment gateway order.', 502, 'GATEWAY_ERROR')
    }
  }

  // Insert Pending Settlement in PostgreSQL
  const settlement = await Settlement.create({
    activity_id: activityId,
    payer_id: payerId,
    payee_id: payeeId,
    amount: numAmount,
    status: 'pending',
    payment_method: paymentMethod,
    provider: 'razorpay',
    provider_order_id: providerOrderId,
    idempotency_key: idempotencyKey
  })

  return {
    settlement,
    orderId: providerOrderId,
    keyId: RAZORPAY_KEY_ID || 'rzp_test_mock',
    amount: numAmount,
    currency: 'INR',
    isExisting: false
  }
}

/**
 * 2. Cryptographic Webhook Processor (The ONLY place that confirms success)
 */
export const processWebhookPayment = async (rawBody, signature, io) => {
  if (process.env.NODE_ENV === 'production' && !RAZORPAY_WEBHOOK_SECRET) {
    throw new AppError('Webhook secret missing in production.', 500, 'WEBHOOK_CONFIG_ERROR')
  }

  // Verify HMAC SHA-256 signature if secret is configured
  if (RAZORPAY_WEBHOOK_SECRET && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      throw new AppError('Invalid webhook signature.', 400, 'INVALID_SIGNATURE')
    }
  }

  const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody
  const eventName = event.event
  const paymentEntity = event.payload?.payment?.entity

  if (eventName === 'payment.captured' || eventName === 'order.paid') {
    const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id
    const paymentId = paymentEntity?.id || `pay_mock_${Date.now()}`

    if (!orderId) {
      console.warn('Webhook event missing order_id:', eventName)
      return false
    }

    let settledRecord = null

    // Atomic database transaction
    await sequelize.transaction(async (t) => {
      const settlement = await Settlement.findOne({
        where: { provider_order_id: orderId },
        transaction: t,
        lock: true
      })

      if (!settlement) {
        console.warn(`No pending settlement found for order ID: ${orderId}`)
        return
      }

      if (settlement.status === 'success') {
        // Idempotent replay safety
        settledRecord = settlement
        return
      }

      settlement.status = 'success'
      settlement.provider_payment_id = paymentId
      settlement.settled_at = new Date()
      await settlement.save({ transaction: t })

      settledRecord = settlement
    })

    if (settledRecord && io) {
      // Recompute updated ledger and broadcast live to trip room
      const updatedLedger = await computeTripLedger(settledRecord.activity_id)
      io.to(settledRecord.activity_id).emit('settlement_completed', {
        settlement: settledRecord,
        ledger: updatedLedger
      })
    }

    return true
  }

  if (eventName === 'payment.failed') {
    const orderId = paymentEntity?.order_id
    if (orderId) {
      await Settlement.update(
        {
          status: 'failed',
          failure_reason: paymentEntity?.error_description || 'Payment rejected by bank/UPI'
        },
        { where: { provider_order_id: orderId } }
      )
    }
    return true
  }

  return true
}

/**
 * 3. Mock Sandbox Settlement (for test / development mode only)
 */
export const mockSettlePayment = async (settlementId, userId, io) => {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError('Direct manual settlement bypass disabled in production.', 403, 'PROD_MOCK_DISABLED')
  }

  const settlement = await Settlement.findByPk(settlementId)
  if (!settlement) {
    throw new AppError('Settlement record not found.', 404, 'SETTLEMENT_NOT_FOUND')
  }

  if (settlement.payer_id !== userId) {
    throw new AppError('Only the assigned payer can settle this debt.', 403, 'NOT_AUTHORIZED')
  }

  settlement.status = 'success'
  settlement.provider_payment_id = `pay_mock_${Date.now()}`
  settlement.settled_at = new Date()
  await settlement.save()

  if (io) {
    const updatedLedger = await computeTripLedger(settlement.activity_id)
    io.to(settlement.activity_id).emit('settlement_completed', {
      settlement,
      ledger: updatedLedger
    })
  }

  return settlement
}

/**
 * 4. Get Settlement History for Trip Room
 */
export const getSettlementHistory = async (activityId) => {
  return await Settlement.findAll({
    where: { activity_id: activityId },
    include: [
      {
        model: User,
        as: 'Payer',
        attributes: ['id', 'email'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      },
      {
        model: User,
        as: 'Payee',
        attributes: ['id', 'email'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      }
    ],
    order: [['created_at', 'DESC']]
  })
}
