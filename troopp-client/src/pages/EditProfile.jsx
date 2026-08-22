import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import Spinner from '../components/common/Spinner.jsx'
import { haptics } from '../utils/haptics.js'

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
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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
          setAvatarUrl(data.profile?.avatar_url || '')
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Avatar file size must be under 5MB.')
    }

    const formData = new FormData()
    formData.append('avatar', file)

    setUploadingAvatar(true)
    try {
      const { getAccessToken, BASE_URL } = await import('../utils/api.js')
      const token = getAccessToken()

      const res = await fetch(`${BASE_URL}/profiles/me/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const json = await res.json()
        setAvatarUrl(json.data.avatarUrl)
        toast.success('Profile avatar updated successfully!')
      } else {
        const json = await res.json()
        throw new Error(json.error?.message || 'Failed to upload avatar.')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploadingAvatar(false)
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
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow-card)',
          userSelect: 'none'
        }}
        className="w-full flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '900', color: 'var(--color-text-primary)', tracking: '-0.02em', margin: 0 }}>
            Edit Profile
          </h2>
          <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-disabled)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
            Update your public profile properties
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Avatar Upload */}
          <div 
            style={{ borderColor: 'var(--color-border)' }}
            className="flex flex-col items-center gap-3 py-2 border-b pb-5"
          >
            <div 
              style={{ borderColor: 'var(--color-border)' }}
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 shadow-inner group"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}
                  className="w-full h-full flex items-center justify-center font-bold uppercase text-xl"
                >
                  {name ? name.charAt(0) : 'U'}
                </div>
              )}

              {/* Upload Overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload-file"
                disabled={uploadingAvatar}
              />
              <label
                htmlFor="avatar-upload-file"
                style={{
                  padding: '6px 14px',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '9px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                className="hover:brightness-110 active:scale-95"
              >
                Change Photo
              </label>
              <span style={{ color: 'var(--color-text-disabled)', fontSize: '8px' }} className="font-bold uppercase tracking-wide mt-0.5">
                PNG or JPG up to 5MB
              </span>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Pratyush Prakash"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                transition: 'border-color 150ms ease'
              }}
              className="focus:border-[#ff6a2c]"
              required
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>
              Bio / Tagline
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              placeholder="Tell other travelers about yourself..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.6',
                transition: 'border-color 150ms ease'
              }}
              className="focus:border-[#ff6a2c]"
            />
            <div className="flex justify-between items-center px-1 mt-1">
              <span style={{ color: 'var(--color-text-disabled)', fontSize: '9px' }} className="font-bold uppercase tracking-wider">
                Min 10 characters required
              </span>
              <span style={{ color: 'var(--color-text-disabled)', fontSize: '9px' }} className="font-bold uppercase tracking-wider">
                {bio.length}/500
              </span>
            </div>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 150ms ease'
              }}
              className="focus:border-[#ff6a2c]"
            >
              <option value="male" style={{ background: '#1a2129', color: '#f3f1ea' }}>Male</option>
              <option value="female" style={{ background: '#1a2129', color: '#f3f1ea' }}>Female</option>
              <option value="non-binary" style={{ background: '#1a2129', color: '#f3f1ea' }}>Non-Binary</option>
              <option value="other" style={{ background: '#1a2129', color: '#f3f1ea' }}>Other</option>
              <option value="prefer_not_to_say" style={{ background: '#1a2129', color: '#f3f1ea' }}>Prefer not to say</option>
            </select>
          </div>

          {/* Interest tags */}
          <div className="flex flex-col gap-2">
            <label style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>
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
                    style={{
                      padding: '6px 14px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: '1px solid',
                      borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                      background: selected ? 'var(--color-primary-light)' : 'var(--color-surface-elevated)',
                      color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 200ms ease'
                    }}
                    className="hover:brightness-110 active:scale-95"
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                haptics.lightTap()
                navigate('/profile/me')
              }}
              style={{
                flex: 1,
                height: '44px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
              className="hover:brightness-110 hover:text-white active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={() => haptics.lightTap()}
              style={{
                flex: 1,
                height: '44px',
                background: 'var(--color-text-primary)',
                border: 'none',
                color: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
              className="hover:brightness-110 active:scale-95 disabled:opacity-50"
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
