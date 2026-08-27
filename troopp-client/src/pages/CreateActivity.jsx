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
  const [isDraftHovered, setIsDraftHovered] = useState(false)
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
    music_allowed: false,
    
    // Upgraded trust context fields
    hosting_reason: '',
    location_rationale: '',
    host_role: 'creator_is_host',
    host_id: '',
    host_name: '',
    media: []
  })

  // User search autocomplete state
  const [memberQuery, setMemberQuery] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Load cache & cities
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

  // Auto cache locally
  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(formData))
  }, [formData])

  // Autocomplete search members
  useEffect(() => {
    if (!memberQuery || memberQuery.trim().length < 2) {
      setMemberResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setSearchingMembers(true)
      try {
        const res = await apiRequest(`/profiles/search/members?q=${encodeURIComponent(memberQuery)}`)
        if (res.ok) {
          const json = await res.json()
          setMemberResults(json.data || [])
        }
      } catch (err) {
        console.error('Failed to search members:', err)
      } finally {
        setSearchingMembers(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [memberQuery])

  const handleTextChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  // Cloudinary media file uploader
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (formData.media.length + files.length > 10) {
      return toast.error('You can upload a maximum of 10 images.')
    }

    setUploadingMedia(true)
    try {
      const { getAccessToken, BASE_URL } = await import('../utils/api.js')
      const token = getAccessToken()

      const uploadedUrls = []

      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 10MB limit.`)
          continue
        }

        // 1. Get Cloudinary presign signature
        const presignRes = await fetch(`${BASE_URL}/community/media/presign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
          })
        })

        if (!presignRes.ok) {
          const errData = await presignRes.json()
          throw new Error(errData.error?.message || 'Failed to acquire upload signature.')
        }

        const presignJson = await presignRes.json()
        const { upload_url, fields } = presignJson.data

        // 2. Direct upload to Cloudinary using presigned fields
        const cloudData = new FormData()
        Object.entries(fields).forEach(([k, v]) => {
          cloudData.append(k, v)
        })
        cloudData.append('file', file)

        const uploadRes = await fetch(upload_url, {
          method: 'POST',
          body: cloudData
        })

        if (!uploadRes.ok) {
          throw new Error('Failed to upload file to Cloudinary.')
        }

        const uploadJson = await uploadRes.json()
        const mediaUrl = uploadJson.secure_url

        // 3. Register uploaded URL in media register completes
        const completeRes = await fetch(`${BASE_URL}/community/media/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            media_url: mediaUrl,
            file_type: file.type
          })
        })

        if (!completeRes.ok) {
          throw new Error('Failed to register uploaded resource.')
        }

        uploadedUrls.push(mediaUrl)
      }

      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...uploadedUrls]
      }))
      toast.success('Images uploaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setUploadingMedia(false)
    }
  }

  const removeMediaImage = (index) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, idx) => idx !== index)
    }))
  }

  // Handle Publish Submit
  const handlePublishSubmit = async (isDraft = false) => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return toast.error('Please fill in title and description details.')
    }
    if (!formData.destination.trim() || !formData.meeting_point_label.trim()) {
      return toast.error('Please enter a destination and meeting point.')
    }
    if (!formData.city_id) {
      return toast.error('Please select a hosting city.')
    }

    // Required check ONLY if publishing
    if (!isDraft) {
      if (!formData.hosting_reason.trim() || formData.hosting_reason.trim().length < 10) {
        return toast.error('Please write a hosting reason (minimum 10 characters).')
      }
      if (!formData.location_rationale.trim() || formData.location_rationale.trim().length < 10) {
        return toast.error('Please write a location rationale (minimum 10 characters).')
      }
      if (formData.host_role === 'creator_assigns_host' && !formData.host_id) {
        return toast.error('Please select a member to host this trip.')
      }
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
          date_time: formData.date_time ? new Date(formData.date_time).toISOString() : new Date(Date.now() + 86400000).toISOString(),
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
          packing_checklist: [],
          
          // Upgraded fields
          status: isDraft ? 'draft' : 'open',
          hosting_reason: formData.hosting_reason.trim() || null,
          location_rationale: formData.location_rationale.trim() || null,
          host_role: formData.host_role,
          host_id: formData.host_role === 'creator_assigns_host' ? formData.host_id : null,
          media: formData.media
        })
      })

      const json = await res.json()
      if (res.ok) {
        haptics.success()
        toast.success(isDraft ? 'Draft saved successfully!' : 'Activity published successfully!')
        localStorage.removeItem(CACHE_KEY)
        if (isDraft) {
          navigate('/feed')
        } else {
          navigate(`/activities/${json.data.activity.id}/setup`)
        }
      } else {
        throw new Error(json.error?.message || 'Failed to process request.')
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
    <div className="page-container-narrow">
        
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
              Host a Trip
            </h1>
            <p style={{ fontSize: '13px', color: '#9ba6ad', margin: '2px 0 0' }}>
              Create an exciting travel meetup in your area.
            </p>
          </div>
        </div>

        {/* Multi-step Container */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#1a2129',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Progress Banner indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#ff6a2c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Step {step} of 5</span>
              <span>
                {step === 1 && 'Tell us the basics'}
                {step === 2 && 'Set timings and destination'}
                {step === 3 && 'Choose group safety guidelines'}
                {step === 4 && 'Host, Trust & Media'}
                {step === 5 && 'Review and publish'}
              </span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${(step / 5) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #ff6a2c 0%, #ff952c 100%)', borderRadius: '10px', transition: 'width 200ms ease' }} />
            </div>
          </div>

          {/* Step 1 Form */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Category Cards grid selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Select Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CATEGORY_CARDS.map((cat) => {
                    const isSelected = formData.category === cat.name
                    const isHovered = hoveredCategory === cat.name
                    return (
                      <div
                        key={cat.name}
                        onClick={() => {
                          haptics.lightTap()
                          setFormData(prev => ({ ...prev, category: cat.name }))
                        }}
                        onMouseEnter={() => setHoveredCategory(cat.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`rounded-xl p-3 sm:p-3.5 flex flex-col items-center gap-1.5 cursor-pointer text-center transition-all ${
                          isSelected
                            ? 'bg-[rgba(255,106,44,0.14)] border border-[#ff6a2c] shadow-sm'
                            : 'bg-[#212b33] border border-white/5 hover:border-white/15'
                        }`}
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#ff6a2c]' : 'text-[#f3f1ea]'}`}>
                          {cat.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Trip Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleTextChange}
                  placeholder="e.g. Bhandardara Lakeside Camping"
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Description textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleTextChange}
                  placeholder="Describe your plan, what to bring, and expectations..."
                  rows={4}
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Numerical controls Group */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Max capacity (people)</label>
                  <input
                    type="number"
                    name="max_capacity"
                    value={formData.max_capacity}
                    onChange={handleTextChange}
                    min={2}
                    max={100}
                    style={{
                      background: '#212b33',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#f3f1ea',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Cost estimate (₹)</label>
                  <input
                    type="number"
                    name="cost_estimate"
                    value={formData.cost_estimate}
                    onChange={handleTextChange}
                    min={0}
                    style={{
                      background: '#212b33',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#f3f1ea',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Step 2 Form */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Destination */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Destination Location</label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleTextChange}
                  placeholder="e.g. Bhandardara Lake, Maharashtra"
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Meeting Point Label */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Meeting Point Address</label>
                <input
                  type="text"
                  name="meeting_point_label"
                  value={formData.meeting_point_label}
                  onChange={handleTextChange}
                  placeholder="e.g. Thane Station East Bus Stop"
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Timings inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Start Date & Time</label>
                <input
                  type="datetime-local"
                  name="date_time"
                  value={formData.date_time}
                  onChange={handleTextChange}
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* City Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Hosting City</label>
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleTextChange}
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
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

          {/* Step 4 Form: Host, Trust & Media Upload */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Trust Context 1: Hosting Reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Why are you hosting this trip?</label>
                <textarea
                  name="hosting_reason"
                  value={formData.hosting_reason}
                  onChange={handleTextChange}
                  placeholder="e.g. Passionate about stargazing and want to meet fellow campers from Troopp."
                  rows={3}
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Trust Context 2: Location Rationale */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Why choose this destination?</label>
                <textarea
                  name="location_rationale"
                  value={formData.location_rationale}
                  onChange={handleTextChange}
                  placeholder="e.g. Visited this lakeside spot three times; it is less crowded and has clean toilets nearby."
                  rows={3}
                  style={{
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#f3f1ea',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Host Role selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Hosting Role assignment</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.lightTap()
                      setFormData(prev => ({ ...prev, host_role: 'creator_is_host', host_id: '', host_name: '' }))
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: formData.host_role === 'creator_is_host' ? 'rgba(255,106,44,0.12)' : '#212b33',
                      border: formData.host_role === 'creator_is_host' ? '1px solid #ff6a2c' : '1px solid rgba(255,255,255,0.06)',
                      color: '#f3f1ea',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700',
                      transition: 'all 150ms ease'
                    }}
                  >
                    🙋 I will host
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.lightTap()
                      setFormData(prev => ({ ...prev, host_role: 'creator_assigns_host' }))
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: formData.host_role === 'creator_assigns_host' ? 'rgba(255,106,44,0.12)' : '#212b33',
                      border: formData.host_role === 'creator_assigns_host' ? '1px solid #ff6a2c' : '1px solid rgba(255,255,255,0.06)',
                      color: '#f3f1ea',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700',
                      transition: 'all 150ms ease'
                    }}
                  >
                    🤝 Assign Co-Host
                  </button>
                </div>
              </div>

              {/* Autocomplete Member Search Dropdown */}
              {formData.host_role === 'creator_assigns_host' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Search and select Co-Host</label>
                  <input
                    type="text"
                    value={formData.host_name || memberQuery}
                    onChange={(e) => {
                      setMemberQuery(e.target.value)
                      if (formData.host_name) {
                        setFormData(prev => ({ ...prev, host_name: '', host_id: '' }))
                      }
                    }}
                    placeholder="Type to search members..."
                    style={{
                      background: '#212b33',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#f3f1ea',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {searchingMembers && (
                    <span style={{ fontSize: '11px', color: '#ff6a2c', marginTop: '4px' }}>Searching...</span>
                  )}
                  {memberResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '72px',
                        left: 0,
                        right: 0,
                        background: '#1a2129',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        zIndex: 100,
                        maxHeight: '180px',
                        overflowY: 'auto',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                      }}
                    >
                      {memberResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            haptics.lightTap()
                            setFormData(prev => ({ ...prev, host_id: u.id, host_name: u.name }))
                            setMemberResults([])
                            setMemberQuery('')
                          }}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '13px',
                            color: '#f3f1ea'
                          }}
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ff6a2c', color: '#1a0e08', display: 'flex', alignItems: 'center', justifyContext: 'center', fontWeight: '700', fontSize: '12px' }}>{u.name[0]}</div>
                          )}
                          <span>{u.name} (Trust Score: {u.trust_score})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gallery Multi-Image upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Upload Photos (Up to 10)</label>
                
                {/* Thumbnails grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {formData.media.map((imgUrl, idx) => (
                    <div
                      key={imgUrl}
                      style={{
                        width: '100%',
                        paddingTop: '100%',
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt=""
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeMediaImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {formData.media.length < 10 && (
                    <label
                      style={{
                        width: '100%',
                        paddingTop: '100%',
                        position: 'relative',
                        borderRadius: '8px',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        cursor: uploadingMedia ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleMediaUpload}
                        disabled={uploadingMedia}
                        style={{ display: 'none' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ba6ad'
                        }}
                      >
                        <span style={{ fontSize: '20px', fontWeight: '300' }}>{uploadingMedia ? '⏳' : '+'}</span>
                        <span style={{ fontSize: '9px', marginTop: '2px' }}>{uploadingMedia ? 'Uploading' : 'Add Photo'}</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Step 5 Form */}
          {step === 5 && (
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
                <div>🤝 <strong>Host settings:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.host_role === 'creator_assigns_host' ? `Co-host Assigned (${formData.host_name})` : 'Self Hosted'}</span></div>
                <div>📷 <strong>Photos attached:</strong> <span style={{ color: '#f3f1ea', fontWeight: '500', marginLeft: '6px' }}>{formData.media.length} images</span></div>
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

            {/* Save Draft Button (accessible anytime) */}
            <button
              onClick={() => handlePublishSubmit(true)}
              onMouseEnter={() => setIsDraftHovered(true)}
              onMouseLeave={() => setIsDraftHovered(false)}
              style={{
                flex: 1,
                height: '46px',
                background: isDraftHovered ? 'rgba(255,255,255,0.08)' : '#212b33',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#ff6a2c',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              Save Draft
            </button>
            
            {step < 5 ? (
              <button
                onClick={handleContinue}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => setIsCtaHovered(false)}
                style={{
                  flex: 2,
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
                onClick={() => handlePublishSubmit(false)}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => setIsCtaHovered(false)}
                style={{
                  flex: 2,
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
  )
}

export default CreateActivity
export { CreateActivity }
