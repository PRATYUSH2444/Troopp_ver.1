import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../components/common/Button.jsx'

const RULES_LIST = [
  { id: 'phone_sharing_enabled', label: 'Strict Contact Privacy', desc: 'Restricts members from sharing phone numbers in chat before the physical meetup.' },
  { id: 'members_can_add_expenses', label: 'Equal Expense Splits', desc: 'Allows members to request expense splitting in the trip room.' },
  { id: 'members_can_create_polls', label: 'Allow Group Polls', desc: 'Enables members to create polls for scheduling or food choices.' },
  { id: 'chat_before_full', label: 'Chat Before Full', desc: 'Opens group chat room immediately, even if all slots are not filled.' },
  { id: 'moderated_mode', label: 'Host-Moderated Messages', desc: 'Allows the host to flag or delete member messages in the chat.' },
  { id: 'checkin_required', label: 'Geofenced Safety Checkins', desc: 'Requires members to register check-ins at safety waypoints.' },
  { id: 'no_spam', label: 'Zero-Spam Policy', desc: 'Blocks marketing links, ads, or external promotional messages.' },
  { id: 'no_substances', label: 'Zero-Tolerance Substance Policy', desc: 'Strictly bans carrying or consuming illegal substances during the trip.' }
]

const TripSetupPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Rules State
  const [rules, setRules] = useState({
    phone_sharing_enabled: false,
    members_can_add_expenses: true,
    members_can_create_polls: true,
    chat_before_full: true,
    moderated_mode: false,
    checkin_required: false,
    no_spam: true,
    no_substances: true
  })

  // Waypoints State
  const [waypoints, setWaypoints] = useState([])
  const [wpLabel, setWpLabel] = useState('')
  const [wpLat, setWpLat] = useState(19.076)
  const [wpLng, setWpLng] = useState(72.877)

  // Welcome Message State
  const [welcomeMsg, setWelcomeMsg] = useState('Hey travelers! Welcome to the group chat. Please introduce yourselves and let us know what city zone you are travelling from!')

  const toggleRule = (ruleId) => {
    setRules((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }))
  }

  const addWaypoint = () => {
    if (wpLabel.trim() === '') return
    setWaypoints((prev) => [
      ...prev,
      { label: wpLabel.trim(), latitude: wpLat, longitude: wpLng, radius_meters: 100 }
    ])
    setWpLabel('')
  }

  const removeWaypoint = (index) => {
    setWaypoints((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Handle final finish setup
  const handleFinish = async () => {
    try {
      // Mock API calls to post setup parameters
      // Target A: axios.post(`/api/v1/activities/${id}/setup/rules`, rules)
      // Target B: axios.post(`/api/v1/activities/${id}/setup/welcome-message`, { message_text: welcomeMsg })
      // Target C: axios.post(`/api/v1/activities/${id}/setup/waypoints`, { waypoints })
      await new Promise((r) => setTimeout(r, 1000))

      // Navigate back to detail page on success
      navigate(`/activities/${id}`)
    } catch (err) {
      console.error('Setup failed:', err)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 pb-20">
      {/* Indicator */}
      <div className="flex items-center justify-between bg-surface border border-border px-5 py-3.5 rounded-2xl shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Publish Setup</span>
          <h2 className="text-base font-extrabold text-text-primary">Step {step} of 4</h2>
        </div>
        <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main wizard cards */}
      <div className="glass-card p-6 min-h-[420px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="setup1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 text-center py-8 items-center"
            >
              <span className="text-5xl">🎒</span>
              <h3 className="text-lg font-extrabold text-text-primary mt-2">Your trip is live!</h3>
              <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
                Awesome! The trip was successfully published to the operating city feed. Now let's configure rules, waypoints, and the chat room welcome message.
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="setup2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-text-primary">Step 2: Group Rules</h3>
                <span className="text-[10px] text-text-secondary">Configure group guidelines and chat privacy features.</span>
              </div>

              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                {RULES_LIST.map((rule) => {
                  const isActive = rules[rule.id]
                  return (
                    <div
                      key={rule.id}
                      className="p-3 bg-stone-50/50 hover:bg-stone-50 border border-border/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{rule.label}</span>
                        <span className="text-[10px] text-text-secondary leading-snug mt-0.5">{rule.desc}</span>
                      </div>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none flex-shrink-0 ${
                          isActive ? 'bg-primary' : 'bg-stone-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="setup3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-text-primary">Step 3: Geofenced Waypoints</h3>
                <span className="text-[10px] text-text-secondary">Define geographic coordinates for safety checkins.</span>
              </div>

              {/* Waypoint Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Meeting point, basecamp..."
                  value={wpLabel}
                  onChange={(e) => setWpLabel(e.target.value)}
                  className="flex-1 h-11 border border-border rounded-xl px-4 text-xs outline-none bg-stone-50"
                />
                <button
                  onClick={addWaypoint}
                  className="h-11 px-4 bg-stone-850 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow"
                >
                  Add
                </button>
              </div>

              {/* Added Waypoints List */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto mt-2">
                {waypoints.length === 0 ? (
                  <span className="text-[10px] text-text-secondary italic text-center py-8">
                    No waypoints configured. Tapping next will skip waypoint checkins.
                  </span>
                ) : (
                  waypoints.map((wp, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 border border-border/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary">{wp.label}</span>
                        <span className="text-[9px] text-text-secondary">Radius: {wp.radius_meters}m</span>
                      </div>
                      <button
                        onClick={() => removeWaypoint(idx)}
                        className="text-[10px] font-bold text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="setup4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-text-primary">Step 4: Pinned Welcome Message</h3>
                <span className="text-[10px] text-text-secondary">Draft the welcoming message shown in chat room.</span>
              </div>

              <textarea
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                placeholder="Welcome members, introduce yourself, or share the whatsapp/contact details."
                className="w-full h-32 border border-border rounded-xl p-4 text-xs outline-none focus:border-primary bg-stone-50"
                maxLength={500}
              />
              <span className="text-[10px] text-text-secondary self-end">
                {welcomeMsg.length}/500
              </span>

              {/* Preview */}
              <div className="border border-border/80 rounded-xl bg-surface p-3.5 mt-2">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest block mb-1">
                  Pinned Host Welcome Message
                </span>
                <p className="text-[11px] text-text-secondary leading-relaxed italic">
                  "{welcomeMsg}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions Navigation */}
        <div className="flex gap-3 border-t border-border pt-5 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 h-11 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-stone-50"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 h-11 bg-stone-850 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow-md ml-auto"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 h-11 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark ml-auto"
            >
              Finish Setup 🏁
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TripSetupPage
export { TripSetupPage }
