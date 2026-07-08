import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ACTIVITY_TYPES = [
  { id: 'trek', label: 'Trek', icon: '🏔️' },
  { id: 'road_trip', label: 'Road Trip', icon: '🚗' },
  { id: 'cycling', label: 'Cycling', icon: '🚴' },
  { id: 'night_drive', label: 'Night Drive', icon: '🌙' },
  { id: 'camping', label: 'Camping', icon: '⛺' },
  { id: 'heritage_walk', label: 'Heritage Walk', icon: '🏛️' },
  { id: 'photography_walk', label: 'Photography', icon: '📸' },
  { id: 'day_trip', label: 'Day Trip', icon: '🎒' }
]

const FilterPanel = ({ isOpen, onClose, filters, onApply, onReset }) => {
  const [localFilters, setLocalFilters] = useState({
    type: '',
    minBudget: 0,
    maxBudget: 5000,
    difficulty: '',
    maxGroupSize: 20,
    isWomenOnly: false,
    startDate: '',
    endDate: ''
  })

  // Sync state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters({
        type: filters.type || '',
        minBudget: filters.minBudget || 0,
        maxBudget: filters.maxBudget || 5000,
        difficulty: filters.difficulty || '',
        maxGroupSize: filters.maxGroupSize || 20,
        isWomenOnly: filters.isWomenOnly === 'true' || filters.isWomenOnly === true,
        startDate: filters.startDate || '',
        endDate: filters.endDate || ''
      })
    }
  }, [isOpen, filters])

  const handleTypeSelect = (typeId) => {
    setLocalFilters((prev) => ({
      ...prev,
      type: prev.type === typeId ? '' : typeId // Toggle selection
    }))
  }

  const handleCheckboxChange = (level) => {
    setLocalFilters((prev) => ({
      ...prev,
      difficulty: prev.difficulty === level ? '' : level
    }))
  }

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleReset = () => {
    const defaultFilters = {
      type: '',
      minBudget: 0,
      maxBudget: 5000,
      difficulty: '',
      maxGroupSize: 20,
      isWomenOnly: false,
      startDate: '',
      endDate: ''
    }
    setLocalFilters(defaultFilters)
    onReset()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950 z-40"
          />

          {/* Drawer Sidebar container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="h-16 px-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Search Filters</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-border hover:bg-stone-50 text-sm font-semibold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Filters form */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* 1. Activity Type Chips */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Activity Types
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_TYPES.map((type) => {
                    const isSelected = localFilters.type === type.id
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeSelect(type.id)}
                        className={`h-11 flex items-center gap-2 px-3.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-md'
                            : 'border-border bg-stone-50/50 hover:bg-stone-100 text-text-secondary'
                        }`}
                      >
                        <span className="text-base">{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Date ranges */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Timeframe
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-secondary">Start Date</label>
                    <input
                      type="date"
                      value={localFilters.startDate}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full h-11 border border-border rounded-xl px-3 text-xs outline-none bg-stone-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-secondary">End Date</label>
                    <input
                      type="date"
                      value={localFilters.endDate}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full h-11 border border-border rounded-xl px-3 text-xs outline-none bg-stone-50"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Budget Range Slider */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Max Budget Per Head
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {localFilters.maxBudget >= 5000 ? '₹5,000+' : `₹${localFilters.maxBudget}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={localFilters.maxBudget}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, maxBudget: parseInt(e.target.value) }))}
                  className="w-full accent-primary bg-stone-100 h-1.5 rounded-full appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Free</span>
                  <span>₹5,000+</span>
                </div>
              </div>

              {/* 4. Group Size Range Slider */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Max Group Capacity
                  </span>
                  <span className="text-xs font-bold text-primary">
                    Up to {localFilters.maxGroupSize} spots
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={localFilters.maxGroupSize}
                  onChange={(e) => setLocalFilters((p) => ({ ...p, maxGroupSize: parseInt(e.target.value) }))}
                  className="w-full accent-primary bg-stone-100 h-1.5 rounded-full appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>2 spots</span>
                  <span>20 spots</span>
                </div>
              </div>

              {/* 5. Difficulty Selection */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Difficulty Level
                </span>
                <div className="flex flex-wrap gap-2">
                  {['easy', 'moderate', 'hard', 'expert'].map((lvl) => {
                    const isSelected = localFilters.difficulty === lvl
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleCheckboxChange(lvl)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-text-secondary hover:bg-stone-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 6. Women Only Toggle */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">
                    🔒 Women-Only Trips
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    Only show trips created for verified female members
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalFilters((p) => ({ ...p, isWomenOnly: !p.isWomenOnly }))}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                    localFilters.isWomenOnly ? 'bg-primary' : 'bg-stone-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      localFilters.isWomenOnly ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="h-20 border-t border-border p-4 flex gap-3 bg-stone-50/50">
              <button
                onClick={handleReset}
                className="flex-1 h-full border border-border bg-white rounded-xl text-xs font-bold text-text-secondary hover:bg-stone-50"
              >
                Reset All
              </button>
              <button
                onClick={handleApply}
                className="flex-[2] h-full bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default FilterPanel
export { FilterPanel }
