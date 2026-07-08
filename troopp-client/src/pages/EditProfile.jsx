import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import Spinner from '../components/common/Spinner.jsx'

const AVAILABLE_TAGS = [
  'Trekking',
  'Camping',
  'Photography Walk',
  'Road Trips',
  'Night Drives',
  'Cycling',
  'Heritage Walks',
  'Day Trips'
]

const EditProfile = () => {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [interestTags, setInterestTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiRequest('/profiles/me')
        if (res.ok) {
          const json = await res.json()
          const data = json.data
          setName(data.profile?.name || '')
          setBio(data.profile?.bio || '')
          setGender(data.profile?.gender || 'prefer_not_to_say')
          setInterestTags(data.interestTags || [])
        }
      } catch (err) {
        toast.error('Failed loading profile details.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const toggleTag = (tag) => {
    setInterestTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name is required.')

    setSaving(true)
    try {
      const res = await apiRequest('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          gender,
          interestTags
        })
      })

      if (res.ok) {
        toast.success('Profile updated successfully!')
        navigate('/profile/me')
      } else {
        const json = await res.json()
        throw new Error(json.error?.message || 'Failed updating profile.')
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
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-stone-200 rounded-3xl p-6 lg:p-8 shadow-xl shadow-stone-200/50 flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
            Edit Profile
          </h2>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-1">
            Update your public profile properties
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Raj Malhotra"
              className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
              required
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Bio / Tagline
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short sentence about your travels..."
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
            />
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {/* Interest tags */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Select Interest Vibe Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const selected = interestTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
                      selected
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate('/profile/me')}
              className="flex-1 h-11 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-stone-900 text-white hover:bg-stone-850 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default EditProfile
