import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { haptics } from '../../utils/haptics.js'
import Avatar from '../common/Avatar.jsx'
import { apiRequest } from '../../utils/api.js'

// Dynamically load Razorpay SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const formatINR = (val) => {
  const num = Number(val)
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 1
  })
}

/**
 * ExpensesTab — Redesigned to match reference image.
 *
 * Layout:
 *   Row 1: 3 stat cards (Net Position | Total Trip Pool | Settlement Progress bar)
 *   Row 2: Action bar (Settle Up & Ledger | All Bills) + (WhatsApp Export | + Add Bill)
 *   Row 3: 2-column grid — Smart Settle Up Plan (left) | Member Balance Sheet (right)
 *   Info strip at bottom of left card
 *
 * All backend APIs, real-time state, WebSocket listeners, Razorpay payments,
 * ledger calculations, confetti, and modal logic are preserved unchanged.
 */
const ExpensesTab = ({
  expenses = [],
  members = [],
  currentUserId,
  isHost = false,
  onAddExpense,
  onDeleteExpense,
  activityId
}) => {
  const [subTab, setSubTab] = useState('ledger')

  const [ledger, setLedger] = useState(null)
  const [loadingLedger, setLoadingLedger] = useState(true)
  const [payingSettlementId, setPayingSettlementId] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitType, setSplitType] = useState('equal')
  const [customShares, setCustomShares] = useState({})
  const [percentages, setPercentages] = useState({})
  const [payers, setPayers] = useState({})
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [expensesLocked, setExpensesLocked] = useState(false)

  const [celebrated, setCelebrated] = useState(false)

  const safeMembers = Array.isArray(members) ? members : []
  const safeExpenses = Array.isArray(expenses) ? expenses : []

  // ─── Fetch computed ledger ────────────────────────────────────────────────
  const fetchLedger = async () => {
    if (!activityId) return
    try {
      const res = await apiRequest(`/trip-rooms/${activityId}/ledger`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) setLedger(json.data)
      }
    } catch (err) {
      console.warn('Failed to load trip ledger:', err)
    } finally {
      setLoadingLedger(false)
    }
  }

  useEffect(() => { fetchLedger() }, [activityId, expenses.length])

  useEffect(() => {
    const handleUpdate = () => fetchLedger()
    window.addEventListener('admin:live_update', handleUpdate)
    return () => window.removeEventListener('admin:live_update', handleUpdate)
  }, [])

  // ─── Computed values ──────────────────────────────────────────────────────
  const memberBalances = ledger?.memberBalances || []
  const simplifiedTransactions = ledger?.simplifiedTransactions || []
  const totalTripSpend = ledger?.totalTripSpend ?? safeExpenses.reduce((acc, cur) => acc + parseFloat(cur?.amount || 0), 0)

  const settledMembersCount = memberBalances.filter((m) => m.status === 'settled').length
  const totalMembersCount = memberBalances.length || safeMembers.length || 1
  const settlementPercentage = totalMembersCount > 0 ? Math.round((settledMembersCount / totalMembersCount) * 100) : 0

  const myBalance = memberBalances.find((m) => m.userId === currentUserId)
  const myNet = myBalance?.net ?? 0

  // ─── 100% Settled celebration ─────────────────────────────────────────────
  useEffect(() => {
    if (settlementPercentage === 100 && memberBalances.length > 1 && !celebrated) {
      setCelebrated(true)
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } })
      import('../../utils/sounds.js').then((m) => m.playSuccess?.()).catch(() => {})
    } else if (settlementPercentage < 100) {
      setCelebrated(false)
    }
  }, [settlementPercentage, memberBalances.length, celebrated])

  // ─── Add Expense Modal init ───────────────────────────────────────────────
  const handleOpenModal = () => {
    setDescription('')
    setAmount('')
    setSplitType('equal')
    const initialShares = {}, initialPcts = {}, initialPayers = {}
    safeMembers.forEach((m) => {
      const uId = m.userId || m.id
      if (uId) {
        initialShares[uId] = ''
        initialPcts[uId] = ''
        initialPayers[uId] = uId === currentUserId ? '' : '0'
      }
    })
    setCustomShares(initialShares)
    setPercentages(initialPcts)
    setPayers(initialPayers)
    setModalOpen(true)
  }

  // ─── Submit Expense ───────────────────────────────────────────────────────
  const handleSubmitExpense = async () => {
    const totalAmt = parseFloat(amount)
    if (!description.trim() || isNaN(totalAmt) || totalAmt <= 0) {
      toast.error('Please provide a valid description and amount.')
      return
    }
    setSubmittingExpense(true)
    try {
      const payload = { description: description.trim(), amount: totalAmt, splitType }
      if (splitType === 'custom') {
        let customSum = 0
        payload.customSplits = safeMembers.map((m) => {
          const uId = m.userId || m.id
          const val = parseFloat(customShares[uId] || 0)
          customSum += val
          return { userId: uId, amount: val }
        })
        if (Math.abs(customSum - totalAmt) > 0.1) {
          toast.error(`Custom splits sum to ₹${customSum.toFixed(2)}, expected ₹${totalAmt.toFixed(2)}.`)
          setSubmittingExpense(false)
          return
        }
      } else if (splitType === 'percentage') {
        let pctSum = 0
        payload.percentages = safeMembers.map((m) => {
          const uId = m.userId || m.id
          const val = parseFloat(percentages[uId] || 0)
          pctSum += val
          return { userId: uId, percentage: val }
        })
        if (Math.abs(pctSum - 100) > 0.1) {
          toast.error(`Percentages sum to ${pctSum}%, expected 100%.`)
          setSubmittingExpense(false)
          return
        }
      } else if (splitType === 'multi_payer_equal') {
        let payerSum = 0
        payload.payers = safeMembers.map((m) => {
          const uId = m.userId || m.id
          const val = parseFloat(payers[uId] || 0)
          payerSum += val
          return { userId: uId, amount: val }
        })
        if (Math.abs(payerSum - totalAmt) > 0.1) {
          toast.error(`Payers contribution sum to ₹${payerSum.toFixed(2)}, expected ₹${totalAmt.toFixed(2)}.`)
          setSubmittingExpense(false)
          return
        }
      }
      await onAddExpense(payload)
      setModalOpen(false)
      fetchLedger()
    } catch (err) {
      toast.error(err.message || 'Failed to log expense.')
    } finally {
      setSubmittingExpense(false)
    }
  }

  // ─── Pay Settlement ───────────────────────────────────────────────────────
  const handlePaySettlement = async (transaction) => {
    const { toUserId, toUser, amount: payAmount } = transaction
    const idempotencyKey = `set_${currentUserId}_${toUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    setPayingSettlementId(toUserId)
    haptics.impact?.()
    try {
      const res = await apiRequest(`/trip-rooms/${activityId}/settlements/initiate`, {
        method: 'POST',
        body: JSON.stringify({ payeeId: toUserId, amount: payAmount, idempotencyKey, paymentMethod: 'upi' })
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Failed to initiate payment.')
      }
      const json = await res.json()
      const { settlement, orderId, keyId } = json.data
      const sdkLoaded = await loadRazorpayScript()
      if (sdkLoaded && window.Razorpay && keyId && !keyId.includes('mock')) {
        const options = {
          key: keyId,
          amount: Math.round(payAmount * 100),
          currency: 'INR',
          name: 'Troopp Trip Settlement',
          description: `Settling ₹${payAmount} to ${toUser?.name || 'Explorer'}`,
          order_id: orderId,
          handler: async function (response) {
            toast.success(`Payment captured! ID: ${response.razorpay_payment_id}`)
            fetchLedger()
          },
          prefill: { name: toUser?.name || 'Traveler' },
          theme: { color: '#ff6a2c' }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        const mockRes = await apiRequest(`/trip-rooms/${activityId}/settlements/${settlement.id}/mock-settle`, { method: 'POST' })
        if (mockRes.ok) {
          haptics.expenseSettle?.()
          toast.success(`Sandbox payment of ₹${payAmount} to ${toUser?.name || 'Explorer'} confirmed! 🎉`)
          fetchLedger()
        } else {
          throw new Error('Sandbox settlement failed.')
        }
      }
    } catch (err) {
      toast.error(err.message || 'Payment initiation failed.')
    } finally {
      setPayingSettlementId(null)
    }
  }

  // ─── WhatsApp Export ──────────────────────────────────────────────────────
  const handleExportSummary = () => {
    let summaryText = `*💸 Troopp Trip Expense Summary - ${new Date().toLocaleDateString()}*\n`
    summaryText += `Total Spent: ₹${totalTripSpend.toLocaleString()}\n--------------------------------------\n*Member Balances:*\n`
    memberBalances.forEach((m) => {
      const statusText = m.net > 0 ? `Gets back ₹${m.net}` : m.net < 0 ? `Owes ₹${Math.abs(m.net)}` : `Settled (₹0)`
      summaryText += `• *${m.user?.name || 'Member'}*: Paid ₹${m.paid} | Share ₹${m.share} | ${statusText}\n`
    })
    summaryText += `\n*Simplified Settlement Plan:*\n`
    if (simplifiedTransactions.length === 0) {
      summaryText += `✨ All debts are settled!\n`
    } else {
      simplifiedTransactions.forEach((t) => {
        summaryText += `👉 ${t.fromUser?.name || 'Member'} pays ₹${t.amount} to ${t.toUser?.name || 'Member'}\n`
      })
    }
    navigator.clipboard.writeText(summaryText)
    toast.success('Expense summary copied to clipboard! Ready to paste into WhatsApp.')
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 text-[#f3f4f8] relative min-h-[480px] pb-16">

      {/* ── ROW 1: THREE STAT PANELS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* 1a. Your Net Position */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="text-[10.5px] font-bold text-[#64748b] uppercase tracking-wider">Your Net Position</div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className={`text-2xl sm:text-3xl font-black font-display leading-none ${
              myNet > 0.5 ? 'text-[#34d399]' : myNet < -0.5 ? 'text-[#f87171]' : 'text-[#f3f4f8]'
            }`}>
              {myNet > 0.5 ? `+₹${formatINR(myNet)}` : myNet < -0.5 ? `-₹${formatINR(Math.abs(myNet))}` : '₹0'}
            </span>
            {myNet !== 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                myNet > 0.5 ? 'text-[#34d399] bg-[#0d281e]' : 'text-[#f87171] bg-[#2d1b1b]'
              }`}>
                {myNet > 0.5 ? 'You get back' : 'You owe'}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#475569] mt-3">Reconciled across all bills &amp; payments</div>
        </div>

        {/* 1b. Total Trip Pool */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[10.5px] font-bold text-[#64748b] uppercase tracking-wider">Total Trip Pool</div>
            <div className="w-9 h-9 rounded-xl bg-[#2d1b17] text-[#f97316] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#f3f4f8] font-display mt-2 leading-none">
            ₹{formatINR(totalTripSpend)}
          </div>
          <div className="text-[11px] text-[#475569] mt-3">
            {safeExpenses.length} {safeExpenses.length === 1 ? 'bill' : 'bills'} · Shared expenditure
          </div>
        </div>

        {/* 1c. Settlement Completion */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[10.5px] font-bold text-[#64748b] uppercase tracking-wider">Settlement Completion</div>
            <span className={`text-[11px] font-black ${
              settlementPercentage === 100 ? 'text-[#34d399]' : 'text-[#f97316]'
            }`}>
              {settlementPercentage}% Settled ({settledMembersCount}/{totalMembersCount})
            </span>
          </div>
          <div className="my-3 w-full h-2 bg-[#1e2638] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${settlementPercentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                settlementPercentage === 100 ? 'bg-[#34d399]' : 'bg-[#f97316]'
              }`}
            />
          </div>
          <div className="text-[11px] text-[#475569]">
            {settlementPercentage === 100 ? '🎉 All debts settled!' : 'Keep settling to clear all balances'}
          </div>
        </div>
      </div>

      {/* ── ROW 2: ACTION BAR ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Sub-tab switcher — left side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('ledger')}
            className={`h-10 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'ledger'
                ? 'bg-[#f97316] text-[#1a0a02] shadow-md shadow-[#f97316]/20'
                : 'bg-[#131826] border border-[#1e2638] text-[#94a3b8] hover:text-[#f3f4f8]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            Settle Up &amp; Ledger
          </button>
          <button
            onClick={() => setSubTab('bills')}
            className={`h-10 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'bills'
                ? 'bg-[#f97316] text-[#1a0a02] shadow-md shadow-[#f97316]/20'
                : 'bg-[#131826] border border-[#1e2638] text-[#94a3b8] hover:text-[#f3f4f8]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
            </svg>
            All Bills ({safeExpenses.length})
          </button>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isHost && (
            <button
              onClick={() => {
                setExpensesLocked(!expensesLocked)
                toast.success(expensesLocked ? 'Ledger unlocked for entries.' : 'Ledger locked.')
              }}
              className={`h-10 px-3.5 border rounded-xl text-sm font-bold transition-all cursor-pointer ${
                expensesLocked
                  ? 'border-[#f87171] bg-[rgba(248,113,113,0.12)] text-[#f87171]'
                  : 'border-[#1e2638] bg-[#131826] hover:bg-[#182032] text-[#94a3b8] hover:text-[#f3f4f8]'
              }`}
            >
              {expensesLocked ? '🔒 Locked' : '🔓 Lock Ledger'}
            </button>
          )}
          <button
            onClick={handleExportSummary}
            className="h-10 px-4 bg-[#131826] hover:bg-[#182032] border border-[#1e2638] rounded-xl text-sm font-bold text-[#f3f4f8] flex items-center gap-2 transition-all cursor-pointer"
            title="Export WhatsApp Summary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp Export</span>
          </button>
          <button
            disabled={expensesLocked}
            onClick={handleOpenModal}
            className={`h-10 px-5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
              expensesLocked
                ? 'bg-[#1e2638] text-[#475569] cursor-not-allowed'
                : 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-[#f97316]/25'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Bill
          </button>
        </div>
      </div>

      {/* ── ROW 3: MAIN CONTENT ───────────────────────────────────────────── */}
      {subTab === 'ledger' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ── LEFT: Smart Settle Up Plan ─────────────────────────────── */}
          <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  <h3 className="text-sm font-bold text-[#f3f4f8]">Smart Settle Up Plan</h3>
                </div>
                <p className="text-[11px] text-[#64748b] mt-0.5 ml-6">
                  Minimized direct payments (no complex loops)
                </p>
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#f97316] bg-[rgba(249,115,22,0.12)] px-2.5 py-1 rounded-full flex-shrink-0">
                {simplifiedTransactions.length} {simplifiedTransactions.length === 1 ? 'Payment' : 'Payments'}
              </span>
            </div>

            {simplifiedTransactions.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center gap-2">
                <span className="text-3xl">🎉</span>
                <h4 className="text-sm font-bold text-[#34d399]">All debts settled!</h4>
                <p className="text-xs text-[#64748b]">No pending transfers required across the group.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {simplifiedTransactions.map((tx, idx) => {
                  const isMyDebt = tx.fromUserId === currentUserId
                  const isOwedToMe = tx.toUserId === currentUserId

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isMyDebt
                          ? 'bg-[rgba(248,113,113,0.05)] border-[rgba(248,113,113,0.2)]'
                          : isOwedToMe
                          ? 'bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.2)]'
                          : 'bg-[#182032] border-[#1e2638]'
                      }`}
                    >
                      {/* From Avatar + Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar size="xs" src={tx.fromUser?.avatarUrl} name={tx.fromUser?.name} />
                        <span className="text-xs font-semibold text-[#f3f4f8] truncate">{tx.fromUser?.name || 'Traveler'}</span>
                      </div>

                      {/* Arrow */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" className="flex-shrink-0">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>

                      {/* To Avatar + Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar size="xs" src={tx.toUser?.avatarUrl} name={tx.toUser?.name} />
                        <span className="text-xs font-semibold text-[#f3f4f8] truncate">{tx.toUser?.name || 'Traveler'}</span>
                      </div>

                      {/* Amount */}
                      <span className="text-sm font-black text-[#f3f4f8] font-mono flex-shrink-0">
                        ₹{formatINR(tx.amount)}
                      </span>

                      {/* CTA */}
                      {isMyDebt ? (
                        <button
                          disabled={payingSettlementId === tx.toUserId}
                          onClick={() => handlePaySettlement(tx)}
                          className="text-xs font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 flex-shrink-0 shadow-sm"
                        >
                          {payingSettlementId === tx.toUserId ? 'Processing...' : '⚡ Pay UPI'}
                        </button>
                      ) : isOwedToMe ? (
                        <span className="text-[11px] font-bold text-[#34d399] bg-[#0d281e] px-2.5 py-1 rounded-md flex-shrink-0 whitespace-nowrap">
                          Pending receipt
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#64748b] flex-shrink-0 whitespace-nowrap">
                          Group transfer
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Info strip */}
            <div className="mt-auto pt-2 flex items-start gap-2 p-3 rounded-xl bg-[#1a2436] border border-[#263148]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span className="text-[11px] text-[#60a5fa] leading-relaxed">
                Settle payments to update balances and complete settlement.
              </span>
            </div>
          </div>

          {/* ── RIGHT: Member Balance Sheet ────────────────────────────── */}
          <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h3 className="text-sm font-bold text-[#f3f4f8]">Member Balance Sheet</h3>
              </div>
              <p className="text-[11px] text-[#64748b] mt-0.5 ml-6">
                Breakdown of total paid, consumption share, and net balance
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {memberBalances.length === 0 ? (
                <div className="text-center py-10 text-[#64748b] text-xs">
                  {loadingLedger ? 'Loading member balances...' : 'No balance data yet. Add a bill to get started.'}
                </div>
              ) : (
                memberBalances.map((m) => (
                  <div
                    key={m.userId}
                    className="p-3.5 bg-[#182032] border border-[#1e2638] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar size="sm" src={m.user?.avatarUrl} name={m.user?.name} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#f3f4f8] truncate">
                          {m.user?.name || 'Member'}{m.userId === currentUserId ? ' (You)' : ''}
                        </span>
                        <span className="text-[11px] text-[#64748b] mt-0.5 truncate">
                          Paid: ₹{formatINR(m.paid)} · Share: ₹{formatINR(m.share)}
                        </span>
                      </div>
                    </div>

                    <span className={`text-sm font-black font-mono flex-shrink-0 ${
                      m.status === 'gets_back'
                        ? 'text-[#34d399]'
                        : m.status === 'owes'
                        ? 'text-[#f87171]'
                        : 'text-[#94a3b8]'
                    }`}>
                      {m.status === 'gets_back'
                        ? `+₹${formatINR(m.net)}`
                        : m.status === 'owes'
                        ? `-₹${formatINR(Math.abs(m.net))}`
                        : 'Settled'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {memberBalances.length > 0 && (
              <button
                onClick={() => {
                  toast.success('Detailed balance breakdown copied!')
                  handleExportSummary()
                }}
                className="mt-auto flex items-center gap-2 text-xs font-semibold text-[#94a3b8] hover:text-[#f3f4f8] transition-colors cursor-pointer group"
              >
                View Detailed Balances
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── BILLS LIST VIEW ─────────────────────────────────────────────── */
        <div className="flex flex-col gap-3 pb-20">
          {safeExpenses.length === 0 ? (
            <div className="text-center py-16 bg-[#131826] border border-[#1e2638] rounded-2xl flex flex-col items-center gap-2">
              <span className="text-3xl">💸</span>
              <h4 className="text-sm font-bold text-[#f3f4f8]">No bills logged yet</h4>
              <p className="text-xs text-[#64748b]">Tap "Add Bill" to record an expense for this trip.</p>
            </div>
          ) : (
            safeExpenses.map((exp) => (
              <div
                key={exp?.id}
                className="bg-[#131826] border border-[#1e2638] p-4 rounded-2xl flex flex-col gap-3 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#f3f4f8]">{exp?.description}</span>
                    <span className="text-xs text-[#64748b] mt-0.5">
                      Paid by <span className="font-semibold text-[#f3f4f8]">{exp?.Payer?.Profile?.name || 'Explorer'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-[#f97316] font-mono">
                      ₹{parseFloat(exp?.amount || 0).toLocaleString()}
                    </span>
                    {(isHost || exp?.payer_id === currentUserId) && (
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="w-7 h-7 rounded-lg bg-[#2d1b1b] hover:bg-[rgba(248,113,113,0.2)] text-[#f87171] text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete bill"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-t border-[#1e2638] pt-2.5 flex flex-col gap-1.5 text-xs text-[#64748b]">
                  {(Array.isArray(exp?.Splits) ? exp.Splits : []).map((split) => (
                    <div key={split?.id} className="flex justify-between items-center py-0.5">
                      <span>{split?.User?.Profile?.name || 'Member'}</span>
                      <span className="font-mono text-[#94a3b8]">₹{parseFloat(split?.share_amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ADD EXPENSE MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#131826] border border-[#1e2638] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-[#1e2638] pb-3">
                <h4 className="text-sm font-bold text-[#f3f4f8]">Log New Trip Expense</h4>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-[#64748b] hover:text-[#f3f4f8] flex items-center justify-center cursor-pointer hover:bg-[#182032] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#94a3b8]">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Campsite Booking, Lunch, Fuel"
                    className="w-full h-11 bg-[#182032] border border-[#263148] rounded-xl px-3.5 text-sm text-[#f3f4f8] outline-none focus:border-[#f97316] transition-colors"
                  />
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#94a3b8]">Total Bill Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-base text-[#64748b]">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 bg-[#182032] border border-[#263148] rounded-xl pl-8 pr-3.5 text-sm text-[#f3f4f8] outline-none focus:border-[#f97316] transition-colors"
                    />
                  </div>
                </div>

                {/* Split Policy */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#94a3b8]">Split Policy</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'equal', label: 'Equal' },
                      { id: 'custom', label: 'Custom' },
                      { id: 'percentage', label: 'Percent %' },
                      { id: 'multi_payer_equal', label: 'Multi-Payer' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSplitType(mode.id)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center ${
                          splitType === mode.id
                            ? 'bg-[#f97316] text-white'
                            : 'bg-[#182032] border border-[#263148] text-[#94a3b8] hover:text-[#f3f4f8]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Split */}
                {splitType === 'custom' && (
                  <div className="flex flex-col gap-2 border border-dashed border-[#263148] p-3 rounded-xl max-h-40 overflow-y-auto">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">Assign Exact Shares (₹)</span>
                    {safeMembers.map((m) => {
                      const uId = m.userId || m.id
                      return (
                        <div key={uId} className="flex justify-between items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f4f8] truncate">{m.name || 'Member'}</span>
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1.5 text-xs text-[#64748b]">₹</span>
                            <input
                              type="number"
                              value={customShares[uId] || ''}
                              onChange={(e) => setCustomShares({ ...customShares, [uId]: e.target.value })}
                              placeholder="0"
                              className="w-full h-8 bg-[#182032] border border-[#263148] rounded-lg pl-6 pr-2 text-right text-xs text-[#f3f4f8] outline-none"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Percentage Split */}
                {splitType === 'percentage' && (
                  <div className="flex flex-col gap-2 border border-dashed border-[#263148] p-3 rounded-xl max-h-40 overflow-y-auto">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">Assign Percentages (%)</span>
                    {safeMembers.map((m) => {
                      const uId = m.userId || m.id
                      return (
                        <div key={uId} className="flex justify-between items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f4f8] truncate">{m.name || 'Member'}</span>
                          <div className="relative w-24">
                            <input
                              type="number"
                              value={percentages[uId] || ''}
                              onChange={(e) => setPercentages({ ...percentages, [uId]: e.target.value })}
                              placeholder="0"
                              className="w-full h-8 bg-[#182032] border border-[#263148] rounded-lg px-2 text-right text-xs text-[#f3f4f8] outline-none"
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-[#64748b]">%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Multi-Payer */}
                {splitType === 'multi_payer_equal' && (
                  <div className="flex flex-col gap-2 border border-dashed border-[#263148] p-3 rounded-xl max-h-40 overflow-y-auto">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">Who Paid What Upfront (₹)</span>
                    {safeMembers.map((m) => {
                      const uId = m.userId || m.id
                      return (
                        <div key={uId} className="flex justify-between items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f4f8] truncate">{m.name || 'Member'}</span>
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1.5 text-xs text-[#64748b]">₹</span>
                            <input
                              type="number"
                              value={payers[uId] || ''}
                              onChange={(e) => setPayers({ ...payers, [uId]: e.target.value })}
                              placeholder="0"
                              className="w-full h-8 bg-[#182032] border border-[#263148] rounded-lg pl-6 pr-2 text-right text-xs text-[#f3f4f8] outline-none"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2 border-t border-[#1e2638]">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-10 bg-[#182032] border border-[#263148] rounded-xl text-xs font-bold text-[#94a3b8] hover:text-[#f3f4f8] hover:bg-[#1e2a40] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitExpense}
                  disabled={submittingExpense}
                  className={`flex-1 h-10 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    submittingExpense
                      ? 'bg-[#1e2638] text-[#475569] cursor-not-allowed'
                      : 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md active:scale-95'
                  }`}
                >
                  {submittingExpense ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExpensesTab
export { ExpensesTab }
