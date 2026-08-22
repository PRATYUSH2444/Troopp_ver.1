import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import Spinner from '../components/common/Spinner.jsx'

const EditActivity = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form details
  const [formData, setFormData] = useState({
    title: '',
    category: 'Trekking',
    description: '',
    cost_estimate: 0,
    max_capacity: 5
  })

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const res = await apiRequest(`/activities/${id}`)
        if (res.ok) {
          const json = await res.json()
          const act = json.data.activity || json.data
          setFormData({
            title: act.title || '',
            category: act.type || act.category || 'Trekking',
            description: act.description || '',
            cost_estimate: act.cost_per_person || act.cost_estimate || 0,
            max_capacity: act.max_group_size || act.max_capacity || 5
          })
        }
      } catch (err) {
        toast.error('Failed to load activity details.')
        navigate('/feed')
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [id, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      return toast.error('Please enter both title and description details.')
    }

    setSaving(true)
    try {
      const res = await apiRequest(`/activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          cost_estimate: parseInt(formData.cost_estimate) || 0,
          max_capacity: parseInt(formData.max_capacity) || 5,
          max_group_size: parseInt(formData.max_capacity) || 5
        })
      })

      const json = await res.json()
      if (res.ok) {
        toast.success('Activity updated successfully!')
        navigate(`/activities/${id}`)
      } else {
        throw new Error(json.error?.message || 'Failed to update activity.')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-container-narrow">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#1a2129',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: '700',
              color: '#f3f1ea',
              margin: 0,
              letterSpacing: '-0.015em'
            }}
          >
            Edit Activity
          </h2>
          <p style={{ fontSize: '13px', color: '#9ba6ad', margin: '4px 0 0' }}>
            Update your active trip parameters
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ba6ad' }}>
              Trip Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Day Hike at sunset trail..."
              required
            />
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ba6ad' }}>
              Description / Itinerary Details
            </label>
            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="A brief explanation of itinerary checks..."
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          {/* Cost Estimate */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ba6ad' }}>
              Cost Estimate per head (₹)
            </label>
            <input
              type="number"
              name="cost_estimate"
              value={formData.cost_estimate}
              onChange={handleChange}
              placeholder="1500"
              required
            />
          </div>

          {/* Max Capacity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ba6ad' }}>
              Max slots Capacity
            </label>
            <input
              type="number"
              name="max_capacity"
              value={formData.max_capacity}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => navigate(`/activities/${id}`)}
              style={{
                flex: 1,
                height: '44px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '100px',
                color: '#f3f1ea',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                height: '44px',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                border: 'none',
                borderRadius: '100px',
                color: '#1a0e08',
                fontSize: '13px',
                fontWeight: '700',
                boxShadow: '0 4px 14px rgba(255,106,44,0.3)',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default EditActivity
