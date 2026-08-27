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
    if (window.Razorpay) {
      resolve(true)
      return
    }
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
 * Troopp Expense & Settlement Management Engine
 * Features:
 * - Single-source-of-truth computed net ledger
 * - Greedy debt minimization (min-cash-flow optimizer)
 * - Real UPI / Card payment via Razorpay Checkout
 * - Multi-split modes: Equal, Custom, Percentage, Multi-Payer
 * - Real-time Socket.IO synchronization
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
  // Navigation sub-tab: 'ledger' (Summary & Settle Up) | 'bills' (Expense History)
  const [subTab, setSubTab] = useState('ledger')

  // Ledger state from server
  const [ledger, setLedger] = useState(null)
  const [loadingLedger, setLoadingLedger] = useState(true)
  const [payingSettlementId, setPayingSettlementId] = useState(null)

  // Add Expense Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitType, setSplitType] = useState('equal') // 'equal' | 'custom' | 'percentage' | 'multi_payer_equal'
  const [customShares, setCustomShares] = useState({})
  const [percentages, setPercentages] = useState({})
  const [payers, setPayers] = useState({})
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [expensesLocked, setExpensesLocked] = useState(false)

  // Celebration trigger
  const [celebrated, setCelebrated] = useState(false)

  const safeMembers = Array.isArray(members) ? members : []
  const safeExpenses = Array.isArray(expenses) ? expenses : []

  // Fetch computed ledger from single-source-of-truth endpoint
  const fetchLedger = async () => {
    if (!activityId) return
    try {
      const res = await apiRequest(`/trip-rooms/${activityId}/ledger`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setLedger(json.data)
        }
      }
    } catch (err) {
      console.warn('Failed to load trip ledger:', err)
    } finally {
      setLoadingLedger(false)
    }
  }

  useEffect(() => {
    fetchLedger()
  }, [activityId, expenses.length])

  // Listen for real-time WebSocket updates
  useEffect(() => {
    const handleSettlementUpdate = () => {
      fetchLedger()
    }
    window.addEventListener('admin:live_update', handleSettlementUpdate)
    return () => window.removeEventListener('admin:live_update', handleSettlementUpdate)
  }, [])

  // Calculate settlement progress
  const memberBalances = ledger?.memberBalances || []
  const simplifiedTransactions = ledger?.simplifiedTransactions || []
  const totalTripSpend = ledger?.totalTripSpend ?? safeExpenses.reduce((acc, cur) => acc + parseFloat(cur?.amount || 0), 0)

  const settledMembersCount = memberBalances.filter((m) => m.status === 'settled').length
  const totalMembersCount = memberBalances.length || safeMembers.length || 1
  const settlementPercentage = totalMembersCount > 0 ? Math.round((settledMembersCount / totalMembersCount) * 100) : 0

  // Current user's net position
  const myBalance = memberBalances.find((m) => m.userId === currentUserId)
  const myNet = myBalance?.net ?? 0

  // 100% Settled celebration
  useEffect(() => {
    if (settlementPercentage === 100 && memberBalances.length > 1 && !celebrated) {
      setCelebrated(true)
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 }
      })
      import('../../utils/sounds.js').then((m) => m.playSuccess?.()).catch(() => {})
    } else if (settlementPercentage < 100) {
      setCelebrated(false)
    }
  }, [settlementPercentage, memberBalances.length, celebrated])

  // Open Add Expense Modal
  const handleOpenModal = () => {
    setDescription('')
    setAmount('')
    setSplitType('equal')

    const initialShares = {}
    const initialPcts = {}
    const initialPayers = {}

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

  // Submit Expense
  const handleSubmitExpense = async () => {
    const totalAmt = parseFloat(amount)
    if (!description.trim() || isNaN(totalAmt) || totalAmt <= 0) {
      toast.error('Please provide a valid description and amount.')
      return
    }

    setSubmittingExpense(true)
    try {
      const payload = {
        description: description.trim(),
        amount: totalAmt,
        splitType
      }

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

  // Pay Settlement via Razorpay / Sandbox
  const handlePaySettlement = async (transaction) => {
    const { toUserId, toUser, amount: payAmount } = transaction
    const idempotencyKey = `set_${currentUserId}_${toUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    setPayingSettlementId(toUserId)
    haptics.impact?.()

    try {
      const res = await apiRequest(`/trip-rooms/${activityId}/settlements/initiate`, {
        method: 'POST',
        body: JSON.stringify({
          payeeId: toUserId,
          amount: payAmount,
          idempotencyKey,
          paymentMethod: 'upi'
        })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Failed to initiate payment.')
      }

      const json = await res.json()
      const { settlement, orderId, keyId } = json.data

      // Check if Razorpay SDK is available
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
          prefill: {
            name: toUser?.name || 'Traveler'
          },
          theme: {
            color: '#ff6a2c'
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        // Sandbox / Test Mode fallback
        const mockRes = await apiRequest(`/trip-rooms/${activityId}/settlements/${settlement.id}/mock-settle`, {
          method: 'POST'
        })

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

  // Export WhatsApp Summary Text
  const handleExportSummary = () => {
    let summaryText = `*💸 Troopp Trip Expense Summary - ${new Date().toLocaleDateString()}*\n`
    summaryText += `Total Spent: ₹${totalTripSpend.toLocaleString()}\n`
    summaryText += `--------------------------------------\n`
    summaryText += `*Member Balances:*\n`
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

  return (
    <div className="flex flex-col gap-5 text-[#f3f1ea] relative min-h-[480px]">
      
      {/* 1. TOP STATS DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Net Position Banner */}
        <div className="bg-[#151c24] border border-[#242f3d] p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-[10px] font-bold text-[#9ba6ad] uppercase tracking-wider">
            Your Net Position
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h4
              className={`text-2xl font-black font-display ${
                myNet > 0.5 ? 'text-[#4fbe8e]' : myNet < -0.5 ? 'text-[#ff5470]' : 'text-[#f3f1ea]'
              }`}
            >
              {myNet > 0.5 ? `+₹${formatINR(myNet)}` : myNet < -0.5 ? `-₹${formatINR(Math.abs(myNet))}` : '₹0'}
            </h4>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                myNet > 0.5
                  ? 'bg-[rgba(79,190,142,0.15)] text-[#4fbe8e]'
                  : myNet < -0.5
                  ? 'bg-[rgba(255,84,112,0.15)] text-[#ff5470]'
                  : 'bg-white/10 text-[#9ba6ad]'
              }`}
            >
              {myNet > 0.5 ? 'You get back' : myNet < -0.5 ? 'You owe' : 'All Settled'}
            </span>
          </div>
          <span className="text-[10px] text-[#6b757c] mt-2">
            Reconciled across all bills & payments
          </span>
        </div>

        {/* Total Trip Pool */}
        <div className="bg-[#151c24] border border-[#242f3d] p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#9ba6ad] uppercase tracking-wider">
              Total Trip Pool
            </span>
            <span className="text-xs font-bold text-[#ff6a2c] font-mono">
              {safeExpenses.length} {safeExpenses.length === 1 ? 'bill' : 'bills'}
            </span>
          </div>
          <h4 className="text-2xl font-black text-[#f3f1ea] font-display mt-1">
            ₹{formatINR(totalTripSpend)}
          </h4>
          <span className="text-[10px] text-[#6b757c] mt-2">
            Shared expenditure for {totalMembersCount} members
          </span>
        </div>
      </div>

      {/* 2. SETTLEMENT PROGRESS BAR */}
      <div className="bg-[#151c24] border border-[#242f3d] p-4 rounded-2xl flex flex-col gap-2 shadow-lg">
        <div className="flex justify-between items-center text-xs font-bold text-[#9ba6ad]">
          <span>Settlement Completion</span>
          <span className={settlementPercentage === 100 ? 'text-[#4fbe8e] font-black' : 'text-[#ff6a2c] font-black'}>
            {settlementPercentage === 100 ? 'All Settled! 🎉' : `${settlementPercentage}% Settled (${settledMembersCount}/${totalMembersCount})`}
          </span>
        </div>
        <div className="w-full h-2.5 bg-[#212b33] rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${settlementPercentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${
              settlementPercentage === 100 ? 'bg-[#4fbe8e]' : 'bg-[#ff6a2c]'
            }`}
          />
        </div>
      </div>

      {/* 3. SUB-TAB SWITCHER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#151c24] border border-[#242f3d] p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-[#1a2129] rounded-xl">
          <button
            onClick={() => setSubTab('ledger')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'ledger'
                ? 'bg-[#ff6a2c] text-[#1a0e08] shadow-md'
                : 'text-[#9ba6ad] hover:text-[#f3f1ea]'
            }`}
          >
            📊 Settle Up & Ledger
          </button>
          <button
            onClick={() => setSubTab('bills')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'bills'
                ? 'bg-[#ff6a2c] text-[#1a0e08] shadow-md'
                : 'text-[#9ba6ad] hover:text-[#f3f1ea]'
            }`}
          >
            🧾 All Bills ({safeExpenses.length})
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2 px-1">
          {isHost && (
            <button
              onClick={() => {
                setExpensesLocked(!expensesLocked)
                toast.success(expensesLocked ? 'Ledger unlocked for entries.' : 'Ledger locked.')
              }}
              className={`h-9 px-3.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                expensesLocked
                  ? 'border-[#ff5470] bg-[rgba(255,84,112,0.15)] text-[#ff5470]'
                  : 'border-white/10 bg-[#212b33] hover:bg-[#2b3742] text-[#9ba6ad] hover:text-[#f3f1ea]'
              }`}
            >
              {expensesLocked ? '🔒 Locked' : '🔓 Lock Ledger'}
            </button>
          )}
          <button
            onClick={handleExportSummary}
            className="h-9 px-3.5 bg-[#212b33] hover:bg-[#2b3742] border border-white/10 rounded-xl text-xs font-bold text-[#9ba6ad] hover:text-[#f3f1ea] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export WhatsApp Summary"
          >
            <span>📤</span>
            <span className="hidden sm:inline">WhatsApp Export</span>
          </button>
          <button
            disabled={expensesLocked}
            onClick={handleOpenModal}
            className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer ${
              expensesLocked
                ? 'bg-[#212b33] text-[#6b757c] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-95 text-[#1a0e08]'
            }`}
          >
            <span>＋</span>
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT CONTAINER */}
      {subTab === 'ledger' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pb-20">
          
          {/* SECTION A: OPTIMIZED SETTLE UP (Who Pays Whom) */}
          <div className="bg-[#151c24] border border-[#242f3d] p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold font-display text-[#f3f1ea]">
                  ⚡ Smart Settle Up Plan
                </h3>
                <p className="text-[11px] text-[#9ba6ad] mt-0.5">
                  Minimized direct payments (no complex loops)
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff6a2c] bg-[rgba(255,106,44,0.12)] px-2.5 py-1 rounded-full">
                {simplifiedTransactions.length} {simplifiedTransactions.length === 1 ? 'Payment' : 'Payments'}
              </span>
            </div>

            {simplifiedTransactions.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-2">
                <span className="text-3xl">🎉</span>
                <h4 className="text-sm font-bold text-[#4fbe8e]">All debts settled!</h4>
                <p className="text-xs text-[#9ba6ad]">No pending transfers required across the group.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {simplifiedTransactions.map((tx, idx) => {
                  const isMyDebt = tx.fromUserId === currentUserId
                  const isOwedToMe = tx.toUserId === currentUserId

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                        isMyDebt
                          ? 'bg-[rgba(255,84,112,0.06)] border-[rgba(255,84,112,0.3)]'
                          : isOwedToMe
                          ? 'bg-[rgba(79,190,142,0.06)] border-[rgba(79,190,142,0.3)]'
                          : 'bg-[#1a2129] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 max-w-[130px] sm:max-w-[155px]">
                          <Avatar size="xs" src={tx.fromUser?.avatarUrl} name={tx.fromUser?.name} />
                          <span className="text-xs font-bold text-[#f3f1ea] truncate" title={tx.fromUser?.name}>
                            {tx.fromUser?.name || 'Traveler'}
                          </span>
                        </div>
                        <span className="text-xs text-[#ff6a2c] flex-shrink-0 font-black">➔</span>
                        <div className="flex items-center gap-2 min-w-0 max-w-[130px] sm:max-w-[155px]">
                          <Avatar size="xs" src={tx.toUser?.avatarUrl} name={tx.toUser?.name} />
                          <span className="text-xs font-bold text-[#f3f1ea] truncate" title={tx.toUser?.name}>
                            {tx.toUser?.name || 'Traveler'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto flex-shrink-0">
                        <span className="text-sm font-black text-[#f3f1ea] font-mono">
                          ₹{formatINR(tx.amount)}
                        </span>

                        {isMyDebt ? (
                          <button
                            disabled={payingSettlementId === tx.toUserId}
                            onClick={() => handlePaySettlement(tx)}
                            className="h-8 px-4 bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-95 text-[#1a0e08] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            {payingSettlementId === tx.toUserId ? (
                              <span>Processing...</span>
                            ) : (
                              <>
                                <span>⚡ Pay UPI</span>
                              </>
                            )}
                          </button>
                        ) : isOwedToMe ? (
                          <span className="text-xs font-bold text-[#4fbe8e] bg-[rgba(79,190,142,0.15)] px-2.5 py-1 rounded-md">
                            Pending receipt
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#9ba6ad]">
                            Group transfer
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SECTION B: MEMBER-WISE NET LEDGER GRID */}
          <div className="bg-[#151c24] border border-[#242f3d] p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold font-display text-[#f3f1ea]">
                  👥 Member Balance Sheet
                </h3>
                <p className="text-[11px] text-[#9ba6ad] mt-0.5">
                  Breakdown of total paid, consumption share, and net balance
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {memberBalances.map((m) => (
                <div
                  key={m.userId}
                  className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar size="sm" src={m.user?.avatarUrl} name={m.user?.name} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#f3f1ea] truncate">
                        {m.user?.name || 'Member'} {m.userId === currentUserId && '(You)'}
                      </span>
                      <span className="text-[11px] text-[#9ba6ad] mt-0.5">
                        Paid: ₹{formatINR(m.paid)} · Share: ₹{formatINR(m.share)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        m.status === 'gets_back'
                          ? 'bg-[rgba(79,190,142,0.15)] text-[#4fbe8e]'
                          : m.status === 'owes'
                          ? 'bg-[rgba(255,84,112,0.15)] text-[#ff5470]'
                          : 'bg-white/5 text-[#9ba6ad]'
                      }`}
                    >
                      {m.status === 'gets_back'
                        ? `+₹${formatINR(m.net)}`
                        : m.status === 'owes'
                        ? `-₹${formatINR(Math.abs(m.net))}`
                        : 'Settled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* BILLS LIST VIEW */
        <div className="flex flex-col gap-3 pb-20">
          {safeExpenses.length === 0 ? (
            <div className="text-center py-16 bg-[#151c24] border border-[#242f3d] rounded-2xl flex flex-col items-center gap-2">
              <span className="text-3xl">💸</span>
              <h4 className="text-sm font-bold text-[#f3f1ea]">No bills logged yet</h4>
              <p className="text-xs text-[#9ba6ad]">Tap "+ Add Bill" to record an expense for this trip.</p>
            </div>
          ) : (
            safeExpenses.map((exp) => (
              <div
                key={exp?.id}
                className="bg-[#151c24] border border-[#242f3d] p-4 rounded-2xl flex flex-col gap-3 shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#f3f1ea]">{exp?.description}</span>
                    <span className="text-xs text-[#9ba6ad] mt-0.5">
                      Paid by <span className="font-semibold text-white">{exp?.Payer?.Profile?.name || 'Explorer'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-[#ff6a2c] font-mono">
                      ₹{parseFloat(exp?.amount || 0).toLocaleString()}
                    </span>
                    {(isHost || exp?.payer_id === currentUserId) && (
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#ff5470] text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete bill"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Split details */}
                <div className="border-t border-white/5 pt-2.5 flex flex-col gap-1.5 text-xs text-[#9ba6ad]">
                  {(Array.isArray(exp?.Splits) ? exp.Splits : []).map((split) => (
                    <div key={split?.id} className="flex justify-between items-center py-0.5">
                      <span>{split?.User?.Profile?.name || 'Member'}</span>
                      <span className="font-mono text-white/80">₹{parseFloat(split?.share_amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. ADD EXPENSE MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#151c24] border border-[#242f3d] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ba6ad]">
                  Log New Trip Expense
                </h4>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-[#9ba6ad] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#9ba6ad]">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Campsite Booking, Lunch, Fuel"
                    className="w-full h-11 bg-[#1a2129] border border-white/10 rounded-xl px-3.5 text-sm text-[#f3f1ea] outline-none focus:border-[#ff6a2c]"
                  />
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#9ba6ad]">Total Bill Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-base text-[#6b757c]">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 bg-[#1a2129] border border-white/10 rounded-xl pl-8 pr-3.5 text-sm text-[#f3f1ea] outline-none focus:border-[#ff6a2c]"
                    />
                  </div>
                </div>

                {/* Split Policy Mode Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#9ba6ad]">Split Policy</label>
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
                            ? 'bg-[#ff6a2c] text-[#1a0e08]'
                            : 'bg-[#1a2129] border border-white/5 text-[#9ba6ad] hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Split breakdown */}
                {splitType === 'custom' && (
                  <div className="flex flex-col gap-2 border border-dashed border-white/10 p-3 rounded-xl max-h-40 overflow-y-auto">
                    <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">Assign Exact Shares (₹)</span>
                    {safeMembers.map((m) => {
                      const uId = m.userId || m.id
                      return (
                        <div key={uId} className="flex justify-between items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f1ea] truncate">{m.name || 'Member'}</span>
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1.5 text-xs text-[#6b757c]">₹</span>
                            <input
                              type="number"
                              value={customShares[uId] || ''}
                              onChange={(e) => setCustomShares({ ...customShares, [uId]: e.target.value })}
                              placeholder="0"
                              className="w-full h-8 bg-[#1a2129] border border-white/10 rounded-lg pl-6 pr-2 text-right text-xs text-[#f3f1ea] outline-none"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Percentage Split breakdown */}
                {splitType === 'percentage' && (
                  <div className="flex flex-col gap-2 border border-dashed border-white/10 p-3 rounded-xl max-h-40 overflow-y-auto">
                    <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">Assign Percentages (%)</span>
                    {safeMembers.map((m) => {
                      const uId = m.userId || m.id
                      return (
                        <div key={uId} className="flex justify-between items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f1ea] truncate">{m.name || 'Member'}</span>
                          <div className="relative w-24">
                            <input
                              type="number"
                              value={percentages[uId] || ''}
                              onChange={(e) => setPercentages({ ...percentages, [uId]: e.target.value })}
                              placeholder="0"
                              className="w-full h-8 bg-[#1a2129] border border-white/10 rounded-lg px-2 text-right text-xs text-[#f3f1ea] outline-none"
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-[#6b757c]">%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Multi-Payer breakdown */}
                {splitType === 'multi_payer_equal' && (
                  <div className="flex flex-col gap-2 border border-dashed border-white/10 p-3 rounded-xl max-h-40 overflow-y-auto">
                    <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">Who Paid What Upfront (₹)</span>
                    {safeMembers.map((m) => {
                      const uId = m.userId || m.id
                      return (
                        <div key={uId} className="flex justify-between items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f1ea] truncate">{m.name || 'Member'}</span>
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1.5 text-xs text-[#6b757c]">₹</span>
                            <input
                              type="number"
                              value={payers[uId] || ''}
                              onChange={(e) => setPayers({ ...payers, [uId]: e.target.value })}
                              placeholder="0"
                              className="w-full h-8 bg-[#1a2129] border border-white/10 rounded-lg pl-6 pr-2 text-right text-xs text-[#f3f1ea] outline-none"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <button
                disabled={submittingExpense}
                onClick={handleSubmitExpense}
                className="w-full h-11 bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-95 text-[#1a0e08] rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all mt-2 cursor-pointer"
              >
                {submittingExpense ? 'Logging Expense...' : 'Confirm & Log Bill'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExpensesTab
export { ExpensesTab }
