import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'

const CACHE_KEY = 'troopp_activity_draft'

const CATEGORY_CARDS = [
  { name: 'Trekking', emoji: '🥾' },
  { name: 'Camping', emoji: '⛺' },
  { name: 'Photography', emoji: '📷' },
  { name: 'Road Trips', emoji: '🚗' },
  { name: 'Cycling', emoji: '🚴' },
  { name: 'Heritage', emoji: '🏛️' },
  { name: 'Day Trips', emoji: '☀️' },
  { name: 'Night Drives', emoji: '🌃' }
]

const CreateActivity = () => {
  const [step, setStep] = useState(1)
  const [cities, setCities] = useState([])
  const navigate = useNavigate()
  
  const [isBackHovered, setIsBackHovered] = useState(false)
  const [isPrevHovered, setIsPrevHovered] = useState(false)
  const [isCtaHovered, setIsCtaHovered] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Trekking',
    description: '',
    cost_estimate: 0,
    max_capacity: 5,
    date_time: '',
    auto_close_at: '',
    city_id: '',
    destination: '',
    meeting_point_label: '',
    meeting_point_lat: 19.6175,
    meeting_point_lng: 73.7845,
    no_smoking: false,
    pets_allowed: false,
    alcohol_allowed: false,
    music_allowed: false
  })

  // Load draft & cities
  useEffect(() => {
    const saved = localStorage.getItem(CACHE_KEY)
    let loadedData = {}
    if (saved) {
      try {
        loadedData = JSON.parse(saved)
      } catch (err) {
        console.error('Failed reading draft state:', err)
      }
    }

    const params = new URLSearchParams(window.location.search)
    const categoryParam = params.get('category')
    const stepParam = params.get('step')

    setFormData((prev) => ({
      ...prev,
      ...loadedData,
      ...(categoryParam ? { category: categoryParam } : {})
    }))

    if (stepParam) {
      setStep(parseInt(stepParam, 10))
    }

    const loadCities = async () => {
      try {
        const res = await apiRequest('/cities')
        if (res.ok) {
          const json = await res.json()
          setCities(json.data || [])
          if (json.data?.length > 0 && !formData.city_id) {
            setFormData((prev) => ({ ...prev, city_id: json.data[0].id }))
          }
        }
      } catch (err) {
        console.error('Failed to load cities list:', err)
      }
    }
    loadCities()
  }, [])

  // Auto cache
  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(formData))
  }, [formData])

  const handleTextChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handlePublish = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return toast.error('Please fill in title and description details.')
    }
    if (!formData.destination.trim() || !formData.meeting_point_label.trim()) {
      return toast.error('Please enter a destination and meeting point.')
    }
    if (!formData.city_id) {
      return toast.error('Please select a hosting city.')
    }

    const categoryToType = {
      'Trekking': 'trek',
      'Camping': 'camping',
      'Photography': 'photography_walk',
      'Road Trips': 'road_trip',
      'Cycling': 'cycling',
      'Heritage': 'heritage_walk',
      'Day Trips': 'day_trip',
      'Night Drives': 'night_drive'
    }

    haptics.lightTap()
    try {
      const res = await apiRequest('/activities', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title.trim(),
          type: categoryToType[formData.category] || 'trek',
          description: formData.description.trim(),
          date_time: new Date(formData.date_time).toISOString(),
          meeting_point_lat: parseFloat(formData.meeting_point_lat) || 19.6175,
          meeting_point_lng: parseFloat(formData.meeting_point_lng) || 73.7845,
          meeting_point_label: formData.meeting_point_label.trim(),
          destination: formData.destination.trim(),
          city_id: formData.city_id,
          max_group_size: parseInt(formData.max_capacity) || 5,
          cost_per_person: parseFloat(formData.cost_estimate) || 0.00,
          difficulty_level: 'easy',
          visibility: 'open',
          is_women_only: false,
          min_trust_score: 0,
          min_reliability_score: 50,
          packing_checklist: []
        })
      })

      const json = await res.json()
      if (res.ok) {
        haptics.success()
        toast.success('Activity created successfully!')
        localStorage.removeItem(CACHE_KEY)
        navigate(`/activities/${json.data.activity.id}/setup`)
      } else {
        throw new Error(json.error?.message || 'Failed to create trip.')
      }
    } catch (err) {
      haptics.error()
      toast.error(err.message)
    }
  }

  const handleContinue = () => {
    haptics.lightTap()
    if (step === 1) {
      if (!formData.title.trim()) {
        return toast.error('Please enter a trip title.')
      }
      if (formData.title.trim().length < 5) {
        return toast.error('Title must be at least 5 characters long.')
      }
      if (!formData.description.trim()) {
        return toast.error('Please enter a trip description.')
      }
      if (formData.description.trim().length < 10) {
        return toast.error('Description must be at least 10 characters long.')
      }
    }
    if (step === 2) {
      if (!formData.destination.trim()) {
        return toast.error('Please enter a destination.')
      }
      if (!formData.meeting_point_label.trim()) {
        return toast.error('Please enter a meeting point.')
      }
      if (!formData.date_time) {
        return toast.error('Please specify a start date and time.')
      }
      if (new Date(formData.date_time).getTime() <= Date.now()) {
        return toast.error('Activity date and time must be in the future.')
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    haptics.lightTap()
    setStep(step - 1)
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#10151a', padding: '28px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Back and Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', userSelect: 'none' }}>
          <button
            onClick={() => {
              haptics.lightTap()
              navigate(-1)
            }}
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: isBackHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: isBackHovered ? '#f3f1ea' : '#9ba6ad',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'background 150ms ease, color 150ms ease'
            }}
          >
            ←
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: '700',
                color: '#f3f1ea',
                margin: 0,
                letterSpacing: '-0.015em'
              }}
            >
              Create a Trip
            </h1>
            <p style={{ fontSize: '13px', color: '#9ba6ad', margin: '2px 0 0' }}>
              {step === 1 && 'Tell us the basics'}
              {step === 2 && 'Set timings and destination'}
              {step === 3 && 'Choose group safety guidelines'}
              {step === 4 && 'Review and publish'}
            </p>
          </div>
        </div>

        {/* Step progress segments */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', userSelect: 'none', marginBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4].map((s) => {
              const isCompleted = s < step
              const isActive = s === step
              return (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '100px',
                    background: (isCompleted || isActive) ? '#ff6a2c' : '#212b33',
                    transition: 'background 300ms ease'
                  }}
                />
              )
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
            <span style={step >= 1 ? { color: '#ff6a2c' } : {}}>Details</span>
            <span style={step >= 2 ? { color: '#ff6a2c' } : {}}>Location</span>
            <span style={step >= 3 ? { color: '#ff6a2c' } : {}}>Rules</span>
            <span style={step >= 4 ? { color: '#ff6a2c' } : {}}>Review</span>
          </div>
        </div>

        {/* Form Card container */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Step 1 Form */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Trip title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleTextChange}
                  placeholder="Day Hike at sunset trail..."
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    color: '#f3f1ea',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Grid of category selector cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Category vibe
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {CATEGORY_CARDS.map((item) => {
                    const isSelected = formData.category === item.name
                    const isHovered = hoveredCategory === item.name
                    return (
                      <div
                        key={item.name}
                        onClick={() => {
                          haptics.lightTap()
                          setFormData((prev) => ({ ...prev, category: item.name }))
                        }}
                        onMouseEnter={() => setHoveredCategory(item.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        style={{
                          background: '#212b33',
                          border: '1px solid',
                          borderColor: isSelected ? '#ff6a2c' : 'rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>
                          {item.emoji}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#f3f1ea' }}>
                          {item.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cost input with currency marker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Cost estimate per head
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#6b757c',
                      pointerEvents: 'none'
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    name="cost_estimate"
                    value={formData.cost_estimate}
                    onChange={handleTextChange}
                    placeholder="1500"
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 16px 0 32px',
                      background: '#212b33',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '100px',
                      fontSize: '14px',
                      color: '#f3f1ea',
                      outline: 'none'
                    }}
                  />
                </div>
                {Number(formData.cost_estimate || 0) === 0 && (
                  <span style={{ fontSize: '11px', color: '#4fbe8e', fontWeight: '600', paddingLeft: '4px' }}>
                    This trip is FREE
                  </span>
                )}
              </div>

              {/* Description box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Trip description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleTextChange}
                  placeholder="Tell others what you plan to do, route guidelines, what to bring..."
                  style={{
                    width: '100%',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    outline: 'none',
                    minHeight: '100px',
                    resize: 'none',
                    lineHeight: '1.5',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2 Form */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Max slots capacity
                </label>
                <input
                  type="number"
                  name="max_capacity"
                  value={formData.max_capacity}
                  onChange={handleTextChange}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    color: '#f3f1ea',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Destination Location name
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleTextChange}
                  placeholder="e.g. Kalsubai Peak Summit"
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    color: '#f3f1ea',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Meeting point address
                </label>
                <input
                  type="text"
                  name="meeting_point_label"
                  value={formData.meeting_point_label}
                  onChange={handleTextChange}
                  placeholder="e.g. Bari Village Base camp"
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    color: '#f3f1ea',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Trip start date & time
                </label>
                <input
                  type="datetime-local"
                  name="date_time"
                  value={formData.date_time}
                  onChange={handleTextChange}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    color: '#f3f1ea',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#9ba6ad' }}>
                  Hosting city
                </label>
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleTextChange}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    color: '#f3f1ea',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  required
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id} style={{ background: '#1a2129', color: '#f3f1ea' }}>
                      {city.city_name || city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3 Form */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                onClick={() => handleCheckboxChange({ target: { name: 'no_smoking', checked: !formData.no_smoking } })}
                style={{
                  background: '#212b33',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  name="no_smoking"
                  checked={formData.no_smoking}
                  onChange={handleCheckboxChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#ff6a2c'
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f3f1ea' }}>No Smoking allowed</span>
              </label>

              <label
                onClick={() => handleCheckboxChange({ target: { name: 'pets_allowed', checked: !formData.pets_allowed } })}
                style={{
                  background: '#212b33',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  name="pets_allowed"
                  checked={formData.pets_allowed}
                  onChange={handleCheckboxChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#ff6a2c'
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f3f1ea' }}>Pets are allowed</span>
              </label>

              <label
                onClick={() => handleCheckboxChange({ target: { name: 'alcohol_allowed', checked: !formData.alcohol_allowed } })}
                style={{
                  background: '#212b33',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  name="alcohol_allowed"
                  checked={formData.alcohol_allowed}
                  onChange={handleCheckboxChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#ff6a2c'
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f3f1ea' }}>Alcohol permitted</span>
              </label>

              <label
                onClick={() => handleCheckboxChange({ target: { name: 'music_allowed', checked: !formData.music_allowed } })}
                style={{
                  background: '#212b33',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  name="music_allowed"
                  checked={formData.music_allowed}
                  onChange={handleCheckboxChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#ff6a2c'
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f3f1ea' }}>Loud Music permitted</span>
              </label>
            </div>
          )}

          {/* Step 4 Form */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: '#212b33',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  color: '#9ba6ad'
                }}
              >
                <div>📌 <strong>Title:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.title}</span></div>
                <div>🎒 <strong>Category:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.category}</span></div>
                <div>📍 <strong>Destination:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.destination}</span></div>
                <div>🏁 <strong>Meeting Point:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.meeting_point_label}</span></div>
                <div>💰 <strong>Estimated Cost:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>₹{formData.cost_estimate}</span></div>
                <div>👥 <strong>Capacity limit:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.max_capacity} travelers</span></div>
                <div>📅 <strong>Starts:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.date_time ? new Date(formData.date_time).toLocaleString() : 'N/A'}</span></div>
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', userSelect: 'none' }}>
            {step > 1 && (
              <button
                onClick={handleBack}
                onMouseEnter={() => setIsPrevHovered(true)}
                onMouseLeave={() => setIsPrevHovered(false)}
                style={{
                  flex: 1,
                  height: '46px',
                  background: isPrevHovered ? 'rgba(255,255,255,0.04)' : 'none',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#9ba6ad',
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
              >
                Previous
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={handleContinue}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => setIsCtaHovered(false)}
                style={{
                  flex: step > 1 ? 2 : 1,
                  height: '46px',
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                  color: '#1a0e08',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: 'Space Grotesk, sans-serif',
                  cursor: 'pointer',
                  boxShadow: isCtaHovered ? '0 6px 18px rgba(255,106,44,0.35)' : '0 4px 12px rgba(255,106,44,0.20)',
                  transform: isCtaHovered ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handlePublish}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => setIsCtaHovered(false)}
                style={{
                  flex: step > 1 ? 2 : 1,
                  height: '46px',
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                  color: '#1a0e08',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: 'Space Grotesk, sans-serif',
                  cursor: 'pointer',
                  boxShadow: isCtaHovered ? '0 6px 18px rgba(255,106,44,0.35)' : '0 4px 12px rgba(255,106,44,0.20)',
                  transform: isCtaHovered ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Publish Trip
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  )
}

export default CreateActivity
export { CreateActivity }
