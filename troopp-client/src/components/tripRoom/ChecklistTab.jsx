import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'

/**
 * Shared packing checklist. Coordinates who's bringing what across the group.
 * Follows the standard Troopp card and spacing system.
 */
const ChecklistTab = ({ checklist = [], onToggleItem, onAddItem, members = [] }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  const safeList = Array.isArray(checklist)
    ? checklist
    : typeof checklist === 'string'
    ? (() => { try { return JSON.parse(checklist) } catch { return [] } })()
    : []

  const safeMembers = Array.isArray(members) ? members : []

  const packedCount = safeList.filter((item) => item?.checked).length
  const totalCount = safeList.length
  const packedPercentage = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0

  const handleCreateItem = (e) => {
    e.preventDefault()
    if (!newItemName.trim()) return
    haptics.lightTap?.()
    if (typeof onAddItem === 'function') {
      onAddItem(newItemName.trim())
    }
    setNewItemName('')
    setModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 text-[#f3f1ea] pb-16">
      
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#f3f1ea] font-display">
            🎒 Trip Packing Checklist
          </h3>
          <p className="text-xs text-[#9ba6ad] mt-1">
            Claim gear items you are bringing. Toggling syncs live with all expedition members.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {totalCount > 0 && (
            <div className="flex items-center gap-2.5 bg-[#10151a] px-4 py-2 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase tracking-wider">Status:</span>
              <span className="text-xs font-black text-[#4fbe8e]">
                {packedCount}/{totalCount} Packed ({packedPercentage}%)
              </span>
            </div>
          )}

          {typeof onAddItem === 'function' && (
            <button
              onClick={() => {
                haptics.lightTap?.()
                setModalOpen(true)
              }}
              className="h-10 px-5 bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-90 text-[#1a0e08] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#ff6a2c]/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>＋</span>
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT CARD */}
      <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-5 sm:p-6 min-h-[460px] shadow-xl flex flex-col">
        {safeList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#10151a] border border-white/5 flex items-center justify-center text-3xl shadow-inner">
              🎒
            </div>
            <h4 className="text-base font-bold text-[#f3f1ea] mt-1 font-display">
              Checklist is currently empty
            </h4>
            <p className="text-xs text-[#9ba6ad] max-w-sm leading-relaxed">
              No shared gear or essentials have been added yet. Add items like tents, first aid kits, or cooking gear.
            </p>
            {typeof onAddItem === 'function' && (
              <button
                onClick={() => {
                  haptics.lightTap?.()
                  setModalOpen(true)
                }}
                className="mt-2 h-10 px-6 bg-[#10151a] hover:bg-white/5 border border-white/10 hover:border-[#ff6a2c]/50 text-xs font-bold text-[#f3f1ea] rounded-full flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>＋</span>
                <span>Add First Item</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Packed Progress Bar */}
            <div className="w-full h-2 bg-[#1a2129] rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${packedPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full transition-all ${
                  packedPercentage === 100 ? 'bg-[#4fbe8e]' : 'bg-[#ff6a2c]'
                }`}
              />
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
              {safeList.map((item, index) => {
                if (!item) return null
                const checkedByMember = safeMembers.find((m) => m && (m.userId || m.id) === item.checked_by_id)
                const isChecked = !!item.checked

                return (
                  <motion.div
                    key={index}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      haptics.lightTap?.()
                      onToggleItem(index, !isChecked)
                    }}
                    className={`p-4 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                      isChecked
                        ? 'bg-[rgba(255,106,44,0.06)] border border-[#ff6a2c]'
                        : 'bg-[#1a2129] border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 max-w-[75%] min-w-0">
                      <motion.div
                        animate={{ scale: isChecked ? [1, 1.15, 1] : 1 }}
                        transition={{ duration: 0.25 }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-[#ff6a2c] text-[#1a0e08] border border-[#ff6a2c]'
                            : 'border border-white/20 text-transparent'
                        }`}
                      >
                        {isChecked && '✓'}
                      </motion.div>
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isChecked ? 'line-through text-[#6b757c]' : 'text-[#f3f1ea]'
                        }`}
                      >
                        {item.name || item.item}
                      </span>
                    </div>

                    {/* Assignee status */}
                    {isChecked && checkedByMember && (() => {
                      const mName = checkedByMember?.name || checkedByMember?.User?.Profile?.name || 'Member'
                      const mInitial = typeof mName === 'string' && mName.length > 0 ? mName[0].toUpperCase() : 'M'
                      const mFirst = typeof mName === 'string' ? mName.split(' ')[0] : 'Member'
                      return (
                        <div className="flex items-center gap-1.5 flex-shrink-0" title={`${mName} is bringing this`}>
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-[#212b33] border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#9ba6ad]">
                            {checkedByMember.avatarUrl || checkedByMember.User?.Profile?.avatar_url ? (
                              <img
                                src={checkedByMember.avatarUrl || checkedByMember.User?.Profile?.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              mInitial
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-[#9ba6ad] truncate max-w-[64px]">
                            {mFirst}
                          </span>
                        </div>
                      )
                    })()}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. ADD ITEM MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-sm font-bold text-[#f3f1ea] font-display">
                  Add Packing Item
                </h4>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#9ba6ad] hover:text-white text-base cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#9ba6ad]">Item Name</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. 4-Person Camping Tent, Power Bank"
                    autoFocus
                    className="w-full bg-[#1a2129] border border-white/10 rounded-xl p-3 text-xs text-[#f3f1ea] outline-none focus:border-[#ff6a2c]"
                  />
                </div>

                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 h-10 border border-white/10 bg-[#1a2129] rounded-xl text-[#9ba6ad] text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newItemName.trim()}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      newItemName.trim()
                        ? 'bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] text-[#1a0e08] shadow-md'
                        : 'bg-white/5 text-[#6b757c] cursor-not-allowed'
                    }`}
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChecklistTab
export { ChecklistTab }
