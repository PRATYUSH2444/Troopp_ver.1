import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import Spinner from '../components/common/Spinner.jsx'
import { haptics } from '../utils/haptics.js'

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relationship, setRelationship] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const [isBackHovered, setIsBackHovered] = useState(false)
  const [isSubmitHovered, setIsSubmitHovered] = useState(false)
  const [hoveredContactId, setHoveredContactId] = useState(null)

  const loadContacts = async () => {
    try {
      const res = await apiRequest('/profiles/emergency-contacts')
      if (res.ok) {
        const json = await res.json()
        setContacts(json.data || [])
      }
    } catch (err) {
      toast.error('Failed to load emergency contacts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const handleAddContact = async (e) => {
    e.preventDefault()
    if (!name || !phone || !relationship) {
      return toast.error('All fields are required.')
    }

    const cleanedPhone = phone.replace(/\D/g, '')
    if (cleanedPhone.length !== 10) {
      return toast.error('Please enter a valid 10-digit mobile number.')
    }

    setSaving(true)
    try {
      const res = await apiRequest('/profiles/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: `+91${cleanedPhone}`,
          relationship: relationship.trim()
        })
      })

      if (res.ok) {
        haptics.success()
        toast.success('Emergency contact added successfully!')
        setName('')
        setPhone('')
        setRelationship('')
        await loadContacts()
      } else {
        const json = await res.json()
        throw new Error(json.error?.message || 'Failed to add contact.')
      }
    } catch (err) {
      haptics.error()
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteContact = async (id) => {
    haptics.lightTap()
    try {
      const res = await apiRequest(`/profiles/emergency-contacts/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Contact deleted.')
        setContacts((prev) => prev.filter((c) => c.id !== id))
      } else {
        const json = await res.json()
        throw new Error(json.error?.message || 'Delete failed.')
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#10151a' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-container-narrow select-none">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', userSelect: 'none' }}>
          <button
            onClick={() => {
              haptics.lightTap()
              navigate('/profile/me')
            }}
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
            style={{
              padding: '8px 16px',
              background: isBackHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              color: isBackHovered ? '#f3f1ea' : '#9ba6ad',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            ← Back
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
              Emergency Contacts
            </h2>
            <span style={{ fontSize: '10px', color: '#6b757c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Safety Contact List (Max 5)
            </span>
          </div>
        </div>

        {/* Existing Contacts List */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            userSelect: 'none'
          }}
        >
          <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b757c', margin: 0 }}>
            Registered Contacts
          </h3>

          {contacts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contacts.map((contact) => {
                const isHovered = hoveredContactId === contact.id
                return (
                  <div
                    key={contact.id}
                    onMouseEnter={() => setHoveredContactId(contact.id)}
                    onMouseLeave={() => setHoveredContactId(null)}
                    style={{
                      padding: '12px 14px',
                      background: '#212b33',
                      border: '1px solid',
                      borderColor: isHovered ? '#ff6a2c' : 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'border-color 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flexGrow: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contact.name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ba6ad', fontWeight: '500' }}>
                        {contact.relationship} • <span style={{ fontFamily: 'var(--font-mono)' }}>{contact.phone}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#ff5470',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        flexShrink: 0
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#6b757c', fontStyle: 'italic', margin: 0 }}>
              No contacts registered yet.
            </p>
          )}
        </div>

        {/* Add Contact Form */}
        {contacts.length < 5 && (
          <form
            onSubmit={handleAddContact}
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b757c', margin: 0, userSelect: 'none' }}>
              Add New Contact
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ba6ad', userSelect: 'none' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contact Name"
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
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ba6ad', userSelect: 'none' }}>
                Relationship
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Parent / Spouse / Friend"
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
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ba6ad', userSelect: 'none' }}>
                Mobile Number
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
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px 0 48px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    color: '#f3f1ea',
                    outline: 'none',
                    letterSpacing: '0.04em'
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              onMouseEnter={() => setIsSubmitHovered(true)}
              onMouseLeave={() => setIsSubmitHovered(false)}
              style={{
                width: '100%',
                height: '46px',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                color: '#1a0e08',
                border: 'none',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'Space Grotesk, sans-serif',
                cursor: 'pointer',
                boxShadow: isSubmitHovered ? '0 6px 18px rgba(255,106,44,0.35)' : '0 4px 12px rgba(255,106,44,0.20)',
                transform: isSubmitHovered ? 'translateY(-1px)' : 'translateY(0)',
                transition: 'all 150ms ease',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Adding...' : 'Add Contact'}
            </button>
          </form>
        )}

      </div>
  )
}

export default EmergencyContacts
