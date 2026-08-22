import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'
import confetti from 'canvas-confetti'

// Settlement Row Component with checkmark draw, bg flash, and strikethrough animations
const ExpenseSplitRow = ({ split, isMySplit, onSettleSplit, currentUserId }) => {
  if (!split) return null
  const [justSettled, setJustSettled] = useState(false)
  const prevSettledRef = useRef(split.is_settled)

  useEffect(() => {
    if (split.is_settled && !prevSettledRef.current) {
      setJustSettled(true)
      haptics.expenseSettle()
      const timer = setTimeout(() => setJustSettled(false), 2000)
      return () => clearTimeout(timer)
    }
    prevSettledRef.current = split.is_settled
  }, [split.is_settled])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        padding: '6px 8px',
        borderRadius: '8px',
        transition: 'all 1000ms ease',
        background: justSettled ? 'rgba(79,190,142,0.14)' : 'transparent'
      }}
    >
      <span style={{ color: '#9ba6ad' }}>
        {split.User?.Profile?.name || 'Member'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ position: 'relative', fontWeight: '700', color: split.is_settled ? '#6b757c' : '#f3f1ea', fontFamily: 'var(--font-mono)' }}>
          ₹{parseFloat(split.share_amount)}
          {split.is_settled && (
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: '1.5px',
                background: '#4fbe8e',
                originX: 0
              }}
            />
          )}
        </span>
        {split.is_settled ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#4fbe8e', fontWeight: '700' }}>
            <svg
              style={{ width: '14px', height: '14px', stroke: '#4fbe8e', strokeWidth: '3', fill: 'none' }}
              viewBox="0 0 24 24"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Settled</span>
          </div>
        ) : isMySplit ? (
          <button
            onClick={() => onSettleSplit(split.id)}
            style={{
              padding: '3px 8px',
              background: 'rgba(255,106,44,0.14)',
              color: '#ff6a2c',
              border: 'none',
              borderRadius: '100px',
              fontWeight: '700',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'background-color 150ms'
            }}
          >
            Pay & Settle
          </button>
        ) : (
          <span style={{ color: '#ffc94d', fontWeight: '700' }}>⏳ Pending</span>
        )}
      </div>
    </div>
  )
}


/**
 * Shared ledger interface for expense splits and settling.
 */
const ExpensesTab = ({
  expenses = [],
  members = [],
  currentUserId,
  isHost = false,
  onAddExpense,
  onDeleteExpense,
  onSettleSplit
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitType, setSplitType] = useState('equal') // 'equal' | 'custom'
  const [customShares, setCustomShares] = useState({}) // { userId: amount }
  
  const [expensesLocked, setExpensesLocked] = useState(false)

  const safeExpenses = Array.isArray(expenses)
    ? expenses
    : typeof expenses === 'string'
    ? (() => { try { return JSON.parse(expenses) } catch { return [] } })()
    : []

  const safeMembers = Array.isArray(members) ? members : []

  // Summary statistics
  const totalLogged = safeExpenses.reduce((acc, cur) => acc + parseFloat(cur?.amount || 0), 0)

  let totalSplits = 0
  let settledSplits = 0
  safeExpenses.forEach((e) => {
    if (!e) return
    const splits = Array.isArray(e.Splits) ? e.Splits : []
    splits.forEach((s) => {
      totalSplits += 1
      if (s?.is_settled) {
        settledSplits += 1
      }
    })
  })
  const settlementPercentage = totalSplits > 0 ? Math.round((settledSplits / totalSplits) * 100) : 0

  const [allSettledCelebrated, setAllSettledCelebrated] = useState(false)

  useEffect(() => {
    if (settlementPercentage === 100 && totalSplits > 0 && !allSettledCelebrated) {
      setAllSettledCelebrated(true)
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.5 }
      })
      import('../../utils/sounds.js').then((m) => m.playSuccess())
    } else if (settlementPercentage < 100) {
      setAllSettledCelebrated(false)
    }
  }, [settlementPercentage, totalSplits, allSettledCelebrated])
  
  // Balance calculation
  let myOutstanding = 0
  safeExpenses.forEach((exp) => {
    if (!exp) return
    const splits = Array.isArray(exp.Splits) ? exp.Splits : []
    splits.forEach((split) => {
      if (split?.user_id === currentUserId && !split?.is_settled) {
        myOutstanding += parseFloat(split?.share_amount || 0)
      }
    })
  })

  const handleOpenModal = () => {
    if (expensesLocked) return
    setDescription('')
    setAmount('')
    setSplitType('equal')
    
    const initialShares = {}
    safeMembers.forEach((m) => {
      if (m?.userId || m?.id) initialShares[m.userId || m.id] = ''
    })
    setCustomShares(initialShares)
    setModalOpen(true)
  }

  const handleCustomShareChange = (userId, value) => {
    setCustomShares((prev) => ({
      ...prev,
      [userId]: value
    }))
  }

  const handleSubmit = () => {
    const totalAmt = parseFloat(amount)
    if (!description.trim() || isNaN(totalAmt) || totalAmt <= 0) return

    let finalCustomList = []
    if (splitType === 'custom') {
      let sumCustom = 0
      finalCustomList = (Array.isArray(members) ? members : []).map((m) => {
        if (!m) return { userId: null, amount: 0 }
        const amt = parseFloat(customShares[m.userId] || 0)
        sumCustom += amt
        return {
          userId: m.userId,
          amount: amt
        }
      })

      // Validation check
      if (Math.abs(sumCustom - totalAmt) > 1) {
        alert(`Validation Error: The custom sum is ₹${sumCustom}, but total amount is ₹${totalAmt}. Details must match.`)
        return
      }
    }

    onAddExpense({
      amount: totalAmt,
      description: description.trim(),
      splitType,
      customSplits: finalCustomList
    })

    setModalOpen(false)
  }

  // Export WhatsApp Summary Text
  const handleExportSummary = () => {
    let summaryText = `*💸 Troopp Trip Expense Summary - ${new Date().toLocaleDateString()}*\n\n`
    summaryText += `Total Logged: ₹${totalLogged.toLocaleString()}\n`
    summaryText += `--------------------------------------\n`
    
    ;(Array.isArray(expenses) ? expenses : []).forEach((e) => {
      if (!e) return
      summaryText += `• *${e.description || 'Unnamed'}*: ₹${parseFloat(e.amount || 0).toLocaleString()}\n`
    })

    navigator.clipboard.writeText(summaryText)
    alert('Expense summary text copied to clipboard! Ready to share on WhatsApp.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#f3f1ea', position: 'relative', minHeight: '460px' }}>
      
      {/* Top status dashboard cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Debt</span>
          <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#ff5470', marginTop: '4px', fontFamily: 'var(--font-display)' }}>₹{myOutstanding.toLocaleString()}</h4>
          <span style={{ fontSize: '9px', color: '#6b757c', marginTop: '4px' }}>Outstanding Splits</span>
        </div>
        <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Ledger</span>
          <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#f3f1ea', marginTop: '4px', fontFamily: 'var(--font-display)' }}>₹{totalLogged.toLocaleString()}</h4>
          <span style={{ fontSize: '9px', color: '#6b757c', marginTop: '4px' }}>For all members</span>
        </div>
      </div>

      {/* Settlement Progress Bar */}
      <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: '#9ba6ad' }}>
          <span>Settlement Progress</span>
          <span style={{ color: settlementPercentage === 100 ? '#4fbe8e' : '#ff6a2c', fontWeight: '800' }}>
            {settlementPercentage === 100 ? 'All settled! 🎉' : `${settlementPercentage}% Settled`}
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#212b33', borderRadius: '100px', overflow: 'hidden', position: 'relative' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${settlementPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: '100px',
              background: settlementPercentage === 100 ? '#4fbe8e' : '#ff6a2c',
              transition: 'background-color 300ms'
            }}
          />
        </div>
      </div>

      {/* Control row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase' }}>Ledger Lock</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isHost && (
            <>
              <button
                onClick={handleExportSummary}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: '#212b33',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#9ba6ad',
                  cursor: 'pointer'
                }}
              >
                📤 Export Text
              </button>
              <button
                onClick={() => setExpensesLocked(!expensesLocked)}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: expensesLocked ? '1px solid #ff5470' : '1px solid rgba(255,255,255,0.14)',
                  background: expensesLocked ? 'rgba(255,84,112,0.14)' : '#212b33',
                  color: expensesLocked ? '#ff5470' : '#9ba6ad',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                {expensesLocked ? '🔓 Unlock Ledger' : '🔒 Lock Ledger'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expenses list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '64px' }}>
        {safeExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '32px' }}>💸</span>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>Ledger is empty</h4>
            <p style={{ fontSize: '11px', color: '#9ba6ad' }}>Tap the orange button to log the first expense.</p>
          </div>
        ) : (
          safeExpenses.map((exp) => (
            <div key={exp?.id} style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>{exp?.description}</span>
                  <span style={{ fontSize: '11px', color: '#9ba6ad', marginTop: '2px' }}>Paid by {exp?.Payer?.Profile?.name || 'Explorer'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#ff6a2c', fontFamily: 'var(--font-mono)' }}>₹{parseFloat(exp?.amount || 0).toLocaleString()}</span>
                  {isHost && (
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'none',
                        border: 'none',
                        color: '#ff5470',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      title="Delete expense"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Splits rows */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(Array.isArray(exp?.Splits) ? exp.Splits : []).map((split) => (
                  <ExpenseSplitRow
                    key={split?.id}
                    split={split}
                    isMySplit={split?.user_id === currentUserId}
                    onSettleSplit={onSettleSplit}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense FAB */}
      {!expensesLocked && (
        <button
          onClick={handleOpenModal}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
            color: '#1a0e08',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '24px',
            border: 'none',
            boxShadow: '0 8px 24px rgba(255,106,44,0.3)',
            zIndex: 20,
            cursor: 'pointer'
          }}
        >
          ＋
        </button>
      )}

      {/* AddExpenseModal overlay */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,16,19,0.75)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ba6ad' }}>Log New Expense</h4>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ba6ad', fontWeight: '700', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#9ba6ad' }}>Expense Description</span>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Campsite Booking or Lunch"
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#212b33',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '100px',
                      padding: '0 16px',
                      color: '#f3f1ea',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#9ba6ad' }}>Total Amount</span>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '10px', color: '#6b757c' }}>₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        height: '44px',
                        background: '#212b33',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '100px',
                        padding: '0 16px 0 32px',
                        color: '#f3f1ea',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Split Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#9ba6ad' }}>Split Policy</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="radio"
                        checked={splitType === 'equal'}
                        onChange={() => setSplitType('equal')}
                        style={{ accentColor: '#ff6a2c' }}
                      />
                      <span>Equally</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="radio"
                        checked={splitType === 'custom'}
                        onChange={() => setSplitType('custom')}
                        style={{ accentColor: '#ff6a2c' }}
                      />
                      <span>Custom</span>
                    </label>
                  </div>
                </div>

                {/* Custom Split input list */}
                {splitType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px dashed rgba(255,255,255,0.14)', padding: '12px', borderRadius: '12px', maxHeight: '160px', overflowY: 'auto' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase' }}>Assign Shares</span>
                    {(Array.isArray(members) ? members : []).map((m) => {
                      if (!m) return null
                      return (
                      <div key={m.userId || m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#f3f1ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || 'Member'}</span>
                        <div style={{ position: 'relative', width: '100px' }}>
                          <span style={{ position: 'absolute', left: '10px', top: '6px', fontSize: '10px', color: '#6b757c' }}>₹</span>
                          <input
                            type="number"
                            value={customShares[m.userId] || ''}
                            onChange={(e) => handleCustomShareChange(m.userId, e.target.value)}
                            placeholder="0"
                            style={{
                              width: '100%',
                              height: '28px',
                              background: '#212b33',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              padding: '0 8px 0 20px',
                              textAlign: 'right',
                              fontSize: '11px',
                              color: '#f3f1ea',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                  color: '#1a0e08',
                  borderRadius: '100px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,106,44,0.25)',
                  marginTop: '8px'
                }}
              >
                Log Expense Ledger
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
