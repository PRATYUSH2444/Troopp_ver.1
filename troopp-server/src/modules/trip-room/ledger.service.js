import { ActivityMember, Expense, ExpenseSplit, ExpensePayer, Settlement, User, Profile } from '../../models/index.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'

/**
 * Utility to safely round amounts to 2 decimal places.
 */
export const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100

/**
 * 1. Single Source of Truth: Compute Trip Room Net Ledger
 * Calculates each confirmed member's paid amount, consumption share, settlements sent/received, and net position.
 * Reconciles strictly on: net = (paid - share) - paidViaSettlement + receivedViaSettlement
 */
export const computeTripLedger = async (activityId) => {
  // Fetch all confirmed trip members
  const members = await ActivityMember.findAll({
    where: { activity_id: activityId, status: 'confirmed' },
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'email'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      }
    ]
  })

  // Fetch all expenses with splits and multi-payers
  const expenses = await Expense.findAll({
    where: { activity_id: activityId },
    include: [
      { model: ExpenseSplit, as: 'Splits' },
      { model: ExpensePayer, as: 'Payers' }
    ]
  })

  // Fetch all successful settlements (real money movements)
  const settlements = await Settlement.findAll({
    where: { activity_id: activityId, status: 'success' }
  })

  // Initialize balance sheet
  const balances = {}
  const memberMap = {}

  members.forEach((m) => {
    const uId = m.user_id || m.User?.id
    if (!uId) return

    memberMap[uId] = {
      id: uId,
      name: m.User?.Profile?.name || 'Explorer',
      avatarUrl: m.User?.Profile?.avatar_url || null,
      email: m.User?.email || ''
    }

    balances[uId] = {
      userId: uId,
      user: memberMap[uId],
      paid: 0,
      share: 0,
      paidViaSettlement: 0,
      receivedViaSettlement: 0,
      net: 0,
      status: 'settled' // 'settled' | 'gets_back' | 'owes'
    }
  })

  // Step 1: Aggregate raw spend & shares from expenses
  for (const exp of expenses) {
    const rawAmt = parseFloat(exp.amount) || 0

    // Handle multi-payer vs single payer
    if (exp.Payers && exp.Payers.length > 0) {
      for (const p of exp.Payers) {
        if (balances[p.user_id]) {
          balances[p.user_id].paid += parseFloat(p.amount_paid) || 0
        }
      }
    } else if (exp.payer_id && balances[exp.payer_id]) {
      balances[exp.payer_id].paid += rawAmt
    }

    // Handle consumption shares
    if (exp.Splits && exp.Splits.length > 0) {
      for (const split of exp.Splits) {
        if (balances[split.user_id]) {
          balances[split.user_id].share += parseFloat(split.share_amount) || 0
        }
      }
    }
  }

  // Step 2: Apply verified settlements
  for (const s of settlements) {
    const sAmt = parseFloat(s.amount) || 0
    if (balances[s.payer_id]) {
      balances[s.payer_id].paidViaSettlement += sAmt
    }
    if (balances[s.payee_id]) {
      balances[s.payee_id].receivedViaSettlement += sAmt
    }
  }

  // Step 3: Compute final net position
  let totalTripSpend = 0
  for (const userId in balances) {
    const b = balances[userId]
    b.paid = round2(b.paid)
    b.share = round2(b.share)
    b.paidViaSettlement = round2(b.paidViaSettlement)
    b.receivedViaSettlement = round2(b.receivedViaSettlement)

    totalTripSpend += b.paid

    // net = (paid - share) - paidViaSettlement + receivedViaSettlement
    const rawNet = b.paid - b.share
    b.net = round2(rawNet - b.paidViaSettlement + b.receivedViaSettlement)

    if (Math.abs(b.net) < 0.5) {
      b.net = 0
      b.status = 'settled'
    } else if (b.net > 0) {
      b.status = 'gets_back'
    } else {
      b.status = 'owes'
    }
  }

  // Step 4: Run greedy debt minimization (who pays whom)
  const simplifiedTransactions = optimizeSettlements(balances)

  return {
    totalTripSpend: round2(totalTripSpend),
    memberBalances: Object.values(balances),
    simplifiedTransactions,
    settlementCount: settlements.length
  }
}

/**
 * 2. Greedy Debt Minimization (Min-Cash-Flow)
 * Collapses complex multi-way debts into the minimum direct payments.
 */
export const optimizeSettlements = (balances) => {
  const creditors = []
  const debtors = []

  for (const b of Object.values(balances)) {
    if (b.net > 0.5) {
      creditors.push({ userId: b.userId, user: b.user, amount: b.net })
    } else if (b.net < -0.5) {
      debtors.push({ userId: b.userId, user: b.user, amount: Math.abs(b.net) })
    }
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const settledAmount = Math.min(debtor.amount, creditor.amount)

    if (settledAmount >= 0.5) {
      transactions.push({
        fromUserId: debtor.userId,
        fromUser: debtor.user,
        toUserId: creditor.userId,
        toUser: creditor.user,
        amount: round2(settledAmount)
      })
    }

    debtor.amount = round2(debtor.amount - settledAmount)
    creditor.amount = round2(creditor.amount - settledAmount)

    if (debtor.amount < 0.5) i++
    if (creditor.amount < 0.5) j++
  }

  return transactions
}

/**
 * 3. Smart Expense Splitter Logic
 * Supports Equal (with drift correction), Custom, Percentage, and Multi-Payer Equal modes.
 */
export const calculateSplit = (amount, mode, members, options = {}) => {
  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new AppError('Invalid expense amount.', 400, 'INVALID_AMOUNT')
  }

  if (!Array.isArray(members) || members.length === 0) {
    throw new AppError('Cannot split expense without confirmed trip members.', 400, 'NO_MEMBERS')
  }

  switch (mode) {
    case 'equal':
    case 'multi_payer_equal': {
      const share = round2(numAmount / members.length)
      const splits = members.map((m) => ({
        userId: m.id || m.userId,
        shareAmount: share
      }))

      // Remainder drift correction on first member
      const totalAllocated = round2(share * members.length)
      const drift = round2(numAmount - totalAllocated)
      if (drift !== 0 && splits.length > 0) {
        splits[0].shareAmount = round2(splits[0].shareAmount + drift)
      }
      return splits
    }

    case 'custom': {
      const customShares = options.customShares || []
      let totalCustom = 0
      const splits = customShares.map((cs) => {
        const sAmt = round2(parseFloat(cs.amount) || 0)
        totalCustom += sAmt
        return {
          userId: cs.userId,
          shareAmount: sAmt
        }
      })

      if (Math.abs(totalCustom - numAmount) > 0.1) {
        throw new AppError(
          `Custom splits sum to ₹${totalCustom.toFixed(2)}, expected ₹${numAmount.toFixed(2)}.`,
          400,
          'INVALID_SPLIT_SUM'
        )
      }
      return splits
    }

    case 'percentage': {
      const percentages = options.percentages || []
      let totalPct = 0
      const splits = percentages.map((p) => {
        const pct = parseFloat(p.percentage) || 0
        totalPct += pct
        return {
          userId: p.userId,
          shareAmount: round2(numAmount * (pct / 100))
        }
      })

      if (Math.abs(totalPct - 100) > 0.1) {
        throw new AppError(
          `Percentages sum to ${totalPct}%, expected 100%.`,
          400,
          'INVALID_PERCENTAGE_SUM'
        )
      }
      return splits
    }

    default:
      throw new AppError(`Unsupported split mode: ${mode}`, 400, 'INVALID_SPLIT_MODE')
  }
}
