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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 lg:py-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-stone-200 rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
            Edit Activity
          </h2>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-1">
            Update your active trip parameters
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Trip Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Day Hike at sunset trail..."
              className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Description / Itinerary Details
            </label>
            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="A brief explanation of itinerary checks..."
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
              required
            />
          </div>

          {/* Cost Estimate */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Cost Estimate per head (₹)
            </label>
            <input
              type="number"
              name="cost_estimate"
              value={formData.cost_estimate}
              onChange={handleChange}
              placeholder="1500"
              className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
              required
            />
          </div>

          {/* Max Capacity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Max slots Capacity
            </label>
            <input
              type="number"
              name="max_capacity"
              value={formData.max_capacity}
              onChange={handleChange}
              className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
              required
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate(`/activities/${id}`)}
              className="flex-1 h-11 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-stone-900 text-white hover:bg-stone-850 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
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
