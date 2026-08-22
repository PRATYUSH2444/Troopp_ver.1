import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { haptics } from '../../utils/haptics.js'

const CreateBoard = () => {
  const navigate = useNavigate()

  // State
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('public') // 'public' | 'restricted' | 'private'
  const [rules, setRules] = useState(['Be respectful to other backpackers.'])
  const [ruleInput, setRuleInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleAddRule = (e) => {
    e.preventDefault()
    if (!ruleInput.trim()) return
    setRules([...rules, ruleInput.trim()])
    setRuleInput('')
  }

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    haptics.lightTap()
    setError(null)

    // Validate board name slug format
    const nameRegex = /^[a-z0-9-]+$/
    if (!nameRegex.test(name)) {
      setError('Board name must consist only of lowercase letters, numbers, and hyphens (e.g., himachal-treks).')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiRequest('/community/boards', {
        method: 'POST',
        body: JSON.stringify({
          name: name.toLowerCase().trim(),
          display_name: displayName.trim(),
          description: description.trim(),
          type,
          rules,
          flair_options: [
            { id: 'question', text: 'Question', color: '#ffc94d' },
            { id: 'trip_report', text: 'Trip Report', color: '#4fbe8e' },
            { id: 'guide', text: 'Guide', color: '#ff6a2c' }
          ]
        })
      })

      const json = await res.json()
      if (res.ok && json.status === 'success' && json.data?.board) {
        navigate(`/community/b/${json.data.board.name}`)
      } else {
        throw new Error(json.error?.message || json.message || 'Failed to create board')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create travel board. It may already exist.')
    } finally {
      setSubmitting(false)
    }
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
          Create a Travel Board
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Create a travel community to discuss local secrets, hiking guidelines, or destination trip reports.
        </p>

        {error && (
          <div style={{ padding: '14px', background: 'var(--color-danger-bg)', border: '1px solid rgba(255,84,112,0.2)', borderRadius: '12px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Board Handle Slug */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input
              label="Board Handle Slug"
              type="text"
              required
              placeholder="e.g. himachal-treks"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              disabled={submitting}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Only lowercase letters, numbers, and hyphens allowed. No spaces.</span>
          </div>

          {/* Display Title Name */}
          <Input
            label="Display Title Name"
            type="text"
            required
            placeholder="e.g. Himachal Treks & Camping"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
          />

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Community Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should travelers discuss on this board?"
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
                minHeight: '90px'
              }}
              required
            />
          </div>

          {/* Board Privacy Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Privacy Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
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
              <option value="public" style={{ background: 'var(--surface)' }}>Public (Anyone can view and post)</option>
              <option value="restricted" style={{ background: 'var(--surface)' }}>Restricted (Anyone can view, only approved members can post)</option>
              <option value="private" style={{ background: 'var(--surface)' }}>Private (Only approved members can view or post)</option>
            </select>
          </div>

          {/* Rules Builder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>
              📜 Community Guidelines Rules
            </span>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <input
                type="text"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                placeholder="e.g. Keep posts related to Himachal Pradesh treks..."
                style={{
                  flex: 1,
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  minWidth: 0
                }}
              />
              <Button 
                type="button" 
                onClick={handleAddRule} 
                variant="ghost" 
                style={{
                  padding: '0 20px',
                  height: '40px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                Add Rule
              </Button>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', padding: 0, listStyle: 'none' }}>
              {rules.map((rule, idx) => (
                <li 
                  key={idx} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--surface-raised)',
                    border: '1.5px solid var(--border)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span>{idx + 1}. {rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'color var(--transition-fast) ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--danger)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-tertiary)'}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

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
              Create Board
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateBoard
