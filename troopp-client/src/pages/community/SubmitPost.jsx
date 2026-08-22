import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { haptics } from '../../utils/haptics.js'

const SubmitPost = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBoardName = searchParams.get('board') || ''

  // State
  const [boards, setBoards] = useState([])
  const [selectedBoard, setSelectedBoard] = useState(initialBoardName)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('text') // 'text' | 'link' | 'image' | 'poll' | 'trip_report'
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  
  const [destination, setDestination] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBoardsList = async () => {
      try {
        const res = await apiRequest('/community/boards?limit=50')
        if (res.ok) {
          const json = await res.json()
          if (json.status === 'success' && json.data) {
            setBoards(json.data.items || [])
            if (initialBoardName) {
              setSelectedBoard(initialBoardName)
            } else if (json.data.items?.length > 0) {
              setSelectedBoard(json.data.items[0].name)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load boards directory:', err)
      } finally {
        setLoadingBoards(false)
      }
    }
    fetchBoardsList()
  }, [initialBoardName])

  const handlePollOptionChange = (idx, val) => {
    const opts = [...pollOptions]
    opts[idx] = val
    setPollOptions(opts)
  }

  const addPollOption = () => {
    haptics.impactLight()
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ''])
    }
  }

  const removePollOption = (idx) => {
    haptics.impactLight()
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    haptics.lightTap()
    setError(null)
    setSubmitting(true)

    const payload = {
      board_name: selectedBoard || null,
      title,
      type,
      content: (type === 'text' || type === 'poll') ? content : null,
      link_url: type === 'link' ? linkUrl : null,
    }

    if (type === 'image') {
      payload.media_urls = mediaUrl ? [mediaUrl] : []
    }

    if (type === 'trip_report') {
      payload.trip_report_details = {
        destination,
        coordinates: lat && lng ? [parseFloat(lng), parseFloat(lat)] : null
      }
    }

    if (type === 'poll') {
      payload.trip_report_details = {
        options: pollOptions.filter(o => o.trim() !== '')
      }
    }

    try {
      const res = await apiRequest('/community/posts', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (res.ok && json.status === 'success' && json.data?.post) {
        navigate(`/community/post/${json.data.post.id}`)
      } else {
        throw new Error(json.error?.message || json.message || 'Failed to create post')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to submit post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingBoards) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-container-narrow select-none">
      <div 
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
          padding: '32px',
          textAlign: 'left'
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--accent)', marginBottom: '6px' }}>
          Create a Community Post
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Share updates, local guide logs, media files, or coordinate pins of destination routes.
        </p>

        {error && (
          <div style={{ padding: '14px', background: 'var(--color-danger-bg)', border: '1px solid rgba(255,84,112,0.2)', borderRadius: '12px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Board selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Select Destination Board</label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              style={{
                background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '100%'
              }}
              required
            >
              <option value="" disabled>-- Choose a Board --</option>
              {boards.map(b => (
                <option key={b.id} value={b.name} style={{ background: 'var(--surface)' }}>
                  b/{b.name} ({b.display_name})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <Input
            label="Title"
            type="text"
            required
            placeholder="e.g. Spiti Valley Trek base camp requirements"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
          />

          {/* Post Format Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Post Format Type</label>
            <div 
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                background: 'var(--bg)',
                padding: '6px',
                borderRadius: '12px',
                border: '1.5px solid var(--border)'
              }}
            >
              {[
                { key: 'text', label: '📝 Text' },
                { key: 'link', label: '🔗 Link' },
                { key: 'image', label: '🖼️ Media' },
                { key: 'poll', label: '📊 Poll' },
                { key: 'trip_report', label: '🗺️ Trip Report' }
              ].map(format => (
                <button
                  key={format.key}
                  type="button"
                  onClick={() => setType(format.key)}
                  style={{
                    flex: '1 1 auto',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all var(--transition-fast) ease',
                    background: type === format.key ? 'var(--surface-raised)' : 'transparent',
                    color: type === format.key ? 'var(--accent)' : 'var(--text-tertiary)'
                  }}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic input sections */}
          {(type === 'text' || type === 'poll') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {type === 'poll' ? 'Poll Description (Optional)' : 'Content Body'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your travel experiences or ask for recommendation listings..."
                style={{
                  width: '100%',
                  fontSize: '14px',
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  minHeight: '140px'
                }}
                required={type === 'text'}
              />
            </div>
          )}

          {type === 'link' && (
            <Input
              label="External Link URL"
              type="url"
              required
              placeholder="https://example.com/great-travel-blog"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={submitting}
            />
          )}

          {type === 'image' && (
            <Input
              label="Image or Video Resource URL"
              type="url"
              required
              placeholder="https://images.unsplash.com/photo-example"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              disabled={submitting}
            />
          )}

          {type === 'poll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>
                📊 Config Poll Choices
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--surface)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removePollOption(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0 8px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={addPollOption}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      marginTop: '4px',
                      padding: 0
                    }}
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {type === 'trip_report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>
                🗺️ Pinpoint Trip Route Details
              </span>
              
              <Input
                label="Destination Location Name"
                type="text"
                required
                placeholder="e.g. Spiti Valley Trek base camp"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={submitting}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Latitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 32.2461"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  disabled={submitting}
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 78.0349"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginTop: '12px', 
              borderTop: '1px solid var(--border)', 
              paddingTop: '24px' 
            }}
          >
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="ghost"
              disabled={submitting}
              style={{
                padding: '10px 24px',
                height: '44px',
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                color: 'var(--text-secondary)',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              variant="primary"
              style={{
                padding: '10px 32px',
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                cursor: 'pointer',
                fontWeight: '700',
                boxShadow: '0 4px 14px rgba(255,106,44,0.35)'
              }}
            >
              Publish Post
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default SubmitPost
