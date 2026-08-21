import React from 'react'
import { motion } from 'framer-motion'

/**
 * Shared packing checklist. Coordinates who's bringing what.
 */
const ChecklistTab = ({ checklist = [], onToggleItem, members = [] }) => {
  const safeList = Array.isArray(checklist)
    ? checklist
    : typeof checklist === 'string'
    ? (() => { try { return JSON.parse(checklist) } catch { return [] } })()
    : []

  const safeMembers = Array.isArray(members) ? members : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#f3f1ea' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f3f1ea', fontFamily: 'var(--font-display)' }}>Packing checklist</h3>
        <span style={{ fontSize: '11px', color: '#9ba6ad', marginTop: '2px' }}>
          Tick items you are bringing. Toggling syncs with all other participants.
        </span>
      </div>

      {safeList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '32px' }}>🎒</span>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>Checklist is empty</h4>
          <p style={{ fontSize: '11px', color: '#9ba6ad' }}>No packing items have been defined by the host.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {safeList.map((item, index) => {
            if (!item) return null
            const checkedByMember = safeMembers.find((m) => (m.userId || m.id) === item.checked_by_id)
            const isChecked = !!item.checked

            return (
              <motion.div
                key={index}
                whileTap={{ scale: 0.99 }}
                onClick={() => onToggleItem(index, !isChecked)}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 150ms ease',
                  background: isChecked ? 'rgba(255,106,44,0.06)' : '#1a2129',
                  border: isChecked ? '1px solid #ff6a2c' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '70%' }}>
                  {/* Custom Checkbox scale bounce animation */}
                  <motion.div
                    animate={{ scale: isChecked ? [1, 1.15, 1] : 1 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: isChecked ? '1px solid #ff6a2c' : '1px solid rgba(255,255,255,0.18)',
                      background: isChecked ? '#ff6a2c' : 'transparent',
                      color: isChecked ? '#1a0e08' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '11px'
                    }}
                  >
                    {isChecked && '✓'}
                  </motion.div>
                  <span style={{ fontSize: '13px', fontWeight: '600', textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? '#6b757c' : '#f3f1ea' }}>
                    {item.name || item.item}
                  </span>
                </div>

                {/* Avatar status of who is bringing it */}
                {isChecked && checkedByMember && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} title={`${checkedByMember.name} is bringing this`}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', bg: '#212b33', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '9px', fontWeight: '700', color: '#9ba6ad' }}>
                      {checkedByMember.avatarUrl ? (
                        <img src={checkedByMember.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        checkedByMember.name[0]
                      )}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px' }}>
                      {checkedByMember.name.split(' ')[0]}
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChecklistTab
export { ChecklistTab }
