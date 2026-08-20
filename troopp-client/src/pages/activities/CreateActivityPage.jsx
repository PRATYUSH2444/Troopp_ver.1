import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'

const STEPS = [
  { step: 1, title: 'Basics' },
  { step: 2, title: 'Details' },
  { step: 3, title: 'Requirements' },
  { step: 4, title: 'Preview' }
]

const ACTIVITY_OPTIONS = [
  { id: 'trek', label: 'Trek', icon: '🏔️', desc: 'Mountain summits and forest trails' },
  { id: 'road_trip', label: 'Road Trip', icon: '🚗', desc: 'Long drives and highway tracks' },
  { id: 'cycling', label: 'Cycling', icon: '🚴', desc: 'Pedal exploring around city circuits' },
  { id: 'night_drive', label: 'Night Drive', icon: '🌙', desc: 'Cruising under stars' },
  { id: 'camping', label: 'Camping', icon: '⛺', desc: 'Tents and bonfires' },
  { id: 'heritage_walk', label: 'Heritage Walk', icon: '🏛️', desc: 'Historic streets and cafes' },
  { id: 'photography_walk', label: 'Photography', icon: '📸', desc: 'Snapshots and visual walks' },
  { id: 'day_trip', label: 'Day Trip', icon: '🎒', desc: 'Weekend sightsees' }
]

const CreateActivityPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)

  // Unified Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'trek',
    description: '',
    date_time: '',
    meeting_point_label: '',
    meeting_point_lat: 19.0760, // Default Mumbai coordinates
    meeting_point_lng: 72.8777,
    destination: '',
    max_group_size: 6,
    cost_per_person: 0,
    difficulty_level: 'easy',
    min_trust_score: 50,
    min_reliability_score: 80,
    is_women_only: false,
    visibility: 'open',
    packing_checklist: []
  })

  // Packing list temporary input state
  const [tempChecklistItem, setTempChecklistItem] = useState('')

  // 1. Restore progress on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('troopp_create_draft')
    if (saved) {
      setFormData(JSON.parse(saved))
    }
  }, [])

  // 2. Save progress to sessionStorage on edit
  const updateField = (field, value) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    sessionStorage.setItem('troopp_create_draft', JSON.stringify(updated))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Checklist manipulations
  const addChecklistItem = () => {
    if (tempChecklistItem.trim() === '') return
    const updated = [
      ...formData.packing_checklist,
      { item: tempChecklistItem.trim(), qty: '1', checked: false }
    ]
    updateField('packing_checklist', updated)
    setTempChecklistItem('')
  }

  const removeChecklistItem = (index) => {
    const updated = formData.packing_checklist.filter((_, idx) => idx !== index)
    updateField('packing_checklist', updated)
  }

  // Handle Publish Submit
  const handlePublish = async () => {
    try {
      // Mock API call to create activity
      // Target: axios.post('/api/v1/activities', formData)
      await new Promise((r) => setTimeout(r, 1000))
      
      const mockCreatedId = 'mock-activity-123'
      sessionStorage.removeItem('troopp_create_draft') // Clear draft on success
      navigate(`/activities/${mockCreatedId}/setup`)
    } catch (err) {
      console.error('Failed to publish activity:', err)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 pb-20">
      {/* Step Indicators */}
      <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-2xl shadow-sm">
        {STEPS.map((s) => {
          const isActive = currentStep === s.step
          const isCompleted = currentStep > s.step
          return (
            <div key={s.step} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white scale-110'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stone-100 text-text-secondary'
                }`}
              >
                {isCompleted ? '✓' : s.step}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Main Wizard Panels */}
      <div className="glass-card p-6 min-h-[400px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              <h3 className="text-sm font-bold text-text-primary">Step 1: Basic Information</h3>

              <Input
                label="Activity Title"
                placeholder="e.g. Harishchandragad Monsoon Trek & Night Camping"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                maxLength={100}
                required
              />

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-primary">Activity Type</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateField('type', opt.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        formData.type === opt.id
                          ? 'border-primary bg-primary/5 text-text-primary'
                          : 'border-border bg-stone-50/50 hover:bg-stone-100'
                      }`}
                    >
                      <span className="text-lg">{opt.icon} {opt.label}</span>
                      <span className="text-[10px] text-text-secondary line-clamp-1">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-primary">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Explain what the trip involves, packing tips, or travel schedules..."
                  className="w-full h-32 border border-border rounded-xl p-3 text-xs outline-none focus:border-primary bg-stone-50"
                  maxLength={1000}
                />
                <span className="text-[10px] text-text-secondary self-end">
                  {formData.description.length}/1000
                </span>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              <h3 className="text-sm font-bold text-text-primary">Step 2: Meeting Logistics</h3>

              <Input
                label="Date & Time"
                type="datetime-local"
                value={formData.date_time}
                onChange={(e) => updateField('date_time', e.target.value)}
                required
              />

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-text-primary">Meeting Location Pin</label>
                <input
                  type="text"
                  placeholder="Search meeting address..."
                  value={formData.meeting_point_label}
                  onChange={(e) => updateField('meeting_point_label', e.target.value)}
                  className="w-full h-11 border border-border rounded-xl px-4 text-xs outline-none bg-stone-50"
                />
                <div className="h-32 w-full bg-stone-100 rounded-xl border border-border flex items-center justify-center text-xs text-text-secondary flex-col gap-1.5 p-4 text-center">
                  <span>📍 Google Maps Integration Bypass</span>
                  <span className="text-[10px] text-text-secondary">
                    Lat: {formData.meeting_point_lat} · Lng: {formData.meeting_point_lng}
                  </span>
                </div>
              </div>

              <Input
                label="Final Destination Name"
                placeholder="e.g. Bhandardara, Maharashtra"
                value={formData.destination}
                onChange={(e) => updateField('destination', e.target.value)}
                required
              />

              {/* Group Size and Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-primary">Max Size</label>
                  <div className="flex items-center border border-border rounded-xl h-11 bg-stone-50 overflow-hidden">
                    <button
                      onClick={() => updateField('max_group_size', Math.max(2, formData.max_group_size - 1))}
                      className="w-10 h-full hover:bg-stone-100 text-xs font-extrabold"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{formData.max_group_size}</span>
                    <button
                      onClick={() => updateField('max_group_size', Math.min(20, formData.max_group_size + 1))}
                      className="w-10 h-full hover:bg-stone-100 text-xs font-extrabold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-primary">Cost Per Person</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={formData.cost_per_person}
                      onChange={(e) => updateField('cost_per_person', parseFloat(e.target.value) || 0)}
                      className="w-full h-11 border border-border rounded-xl pl-7 pr-3 text-xs outline-none bg-stone-50"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              <h3 className="text-sm font-bold text-text-primary">Step 3: Security & Items</h3>

              {/* Difficulty */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-primary">Difficulty Level</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['easy', 'moderate', 'hard', 'expert'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => updateField('difficulty_level', lvl)}
                      className={`h-10 rounded-xl border text-[10px] font-bold capitalize transition-all ${
                        formData.difficulty_level === lvl
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-stone-50 hover:bg-stone-100 text-text-secondary'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider gates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-primary">Min Trust ({formData.min_trust_score})</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.min_trust_score}
                    onChange={(e) => updateField('min_trust_score', parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-stone-100 rounded-full cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-primary">Min Reliability ({formData.min_reliability_score}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.min_reliability_score}
                    onChange={(e) => updateField('min_reliability_score', parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-stone-100 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Packing Checklist */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-primary">Packing Checklist</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempChecklistItem}
                    onChange={(e) => setTempChecklistItem(e.target.value)}
                    placeholder="e.g. Raincoat"
                    className="flex-1 h-10 border border-border rounded-xl px-3 text-xs outline-none bg-stone-50"
                  />
                  <button
                    type="button"
                    onClick={addChecklistItem}
                    className="h-10 px-4 bg-stone-800 text-white rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto mt-1">
                  {formData.packing_checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-100 border border-border/80 rounded-lg px-2.5 py-1 text-[10px] font-bold text-text-secondary flex items-center gap-1.5"
                    >
                      <span>{item.item}</span>
                      <span onClick={() => removeChecklistItem(idx)} className="cursor-pointer text-rose-500">
                        ✕
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Women Only */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">👩 Women-Only Trip</span>
                  <span className="text-[10px] text-text-secondary">Restrict to female travelers only.</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('is_women_only', !formData.is_women_only)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                    formData.is_women_only ? 'bg-primary' : 'bg-stone-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      formData.is_women_only ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <h3 className="text-sm font-bold text-text-primary">Step 4: Preview Activity</h3>
              <p className="text-[11px] text-text-secondary">
                Review your activity post details below. Tapping publish will activate the chat room.
              </p>

              {/* Mock Preview Card layout */}
              <div className="border border-border/80 rounded-2xl overflow-hidden shadow-sm bg-surface p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-text-primary">{formData.title || 'Untitled Activity'}</h4>
                  <span className="text-xs font-bold text-primary">₹{formData.cost_per_person}</span>
                </div>
                <div className="flex flex-col gap-1 text-[10px] text-text-secondary">
                  <span>📍 Destination: {formData.destination || 'Unspecified'}</span>
                  <span>📅 Group Limit: Up to {formData.max_group_size} spots</span>
                  <span>🔒 Women-Only: {formData.is_women_only ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Action Buttons */}
        <div className="flex gap-3 border-t border-border pt-5 mt-6 bg-stone-50/20">
          {currentStep > 1 && (
            <button
              onClick={handlePrev}
              className="flex-1 h-11 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-stone-50"
            >
              Back
            </button>
          )}
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="flex-1 h-11 bg-stone-850 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow-md ml-auto"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="flex-1 h-11 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark ml-auto"
            >
              Publish Trip 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateActivityPage
export { CreateActivityPage }
