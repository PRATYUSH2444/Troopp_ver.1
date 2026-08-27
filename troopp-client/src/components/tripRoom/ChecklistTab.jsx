import React from 'react'
import { motion } from 'framer-motion'

/**
 * Shared packing checklist. Coordinates who's bringing what across the group.
 */
const ChecklistTab = ({ checklist = [], onToggleItem, members = [] }) => {
  const safeList = Array.isArray(checklist)
    ? checklist
    : typeof checklist === 'string'
    ? (() => { try { return JSON.parse(checklist) } catch { return [] } })()
    : []

  const safeMembers = Array.isArray(members) ? members : []

  const packedCount = safeList.filter((item) => item?.checked).length
  const totalCount = safeList.length
  const packedPercentage = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0

  return (
    <div className="flex flex-col gap-5 text-[#f3f1ea]">
      
      {/* Top Header & Progress */}
      <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#f3f1ea] font-display">Trip Packing Checklist</h3>
          <p className="text-xs text-[#9ba6ad] mt-1">
            Claim items you are bringing. Toggling syncs live with all other travelers.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-3 bg-[#1a2129] px-4 py-2.5 rounded-xl border border-white/5 self-start sm:self-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase tracking-wider">Packed Status</span>
              <span className="text-xs font-black text-[#4fbe8e]">{packedCount} of {totalCount} Items ({packedPercentage}%)</span>
            </div>
          </div>
        )}
      </div>

      {safeList.length === 0 ? (
        <div className="text-center py-16 bg-[#151c24] border border-[#242f3d] rounded-2xl flex flex-col items-center gap-2">
          <span className="text-3xl">🎒</span>
          <h4 className="text-sm font-bold text-[#f3f1ea]">Checklist is empty</h4>
          <p className="text-xs text-[#9ba6ad]">No packing items have been defined by the trip host.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {safeList.map((item, index) => {
            if (!item) return null
            const checkedByMember = safeMembers.find((m) => m && (m.userId || m.id) === item.checked_by_id)
            const isChecked = !!item.checked

            return (
              <motion.div
                key={index}
                whileTap={{ scale: 0.99 }}
                onClick={() => onToggleItem(index, !isChecked)}
                className={`p-3.5 sm:p-4 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                  isChecked
                    ? 'bg-[rgba(255,106,44,0.06)] border border-[#ff6a2c]'
                    : 'bg-[#151c24] border border-[#242f3d] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 max-w-[75%] min-w-0">
                  {/* Custom Checkbox scale bounce animation */}
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

                {/* Avatar status of who is bringing it */}
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
                      <span className="text-[11px] font-bold text-[#9ba6ad] truncate max-w-[60px]">
                        {mFirst}
                      </span>
                    </div>
                  )
                })()}
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
