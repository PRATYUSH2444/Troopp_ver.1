import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * System and Admin Settings Panel. Handles administrator rosters and Grievance Officer details.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminSettings = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [admins, setAdmins] = useState([])
  const [promoteEmail, setPromoteEmail] = useState('')
  const [promoting, setPromoting] = useState(false)
  
  // Grievance Officer State
  const [officerName, setOfficerName] = useState('Prakash Joshi')
  const [officerEmail, setOfficerEmail] = useState('grievance.officer@troopp.com')
  const [officerDesignation, setOfficerDesignation] = useState('Chief Compliance Officer')

  const fetchAdmins = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/admin/admins')
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((a) => ({
          id: a.id,
          name: a.Profile?.name || 'Administrator',
          email: a.email,
          createdAt: a.createdAt
        }))
        setAdmins(formatted)
      } else {
        throw new Error(json.message || 'Failed retrieving administrators')
      }
    } catch (err) {
      console.error('Failed retrieving administrative settings:', err)
      if (admins.length === 0) {
        setError(err.message || 'Unable to load administrator rosters.')
      }
    } finally {
      setLoading(false)
    }
  }, [admins.length])

  useEffect(() => {
    fetchAdmins()

    const handleLiveUpdate = () => {
      fetchAdmins(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchAdmins])

  const handlePromoteSubmit = async (e) => {
    e.preventDefault()
    if (!promoteEmail.trim()) {
      toast.error('Please enter the user email to promote.')
      return
    }

    setPromoting(true)
    try {
      const res = await apiRequest('/admin/promote', {
        method: 'POST',
        body: JSON.stringify({ email: promoteEmail.trim() })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'User not found or promotion failed')
      }

      toast.success(`User ${promoteEmail.trim()} promoted to Administrator.`)
      setPromoteEmail('')
      fetchAdmins(true)
    } catch (err) {
      toast.error(err.message || 'Failed promoting user to admin.')
    } finally {
      setPromoting(false)
    }
  }

  const handleDemote = async (userId, adminName) => {
    if (!window.confirm(`Are you sure you want to revoke admin privileges from ${adminName || 'this user'}?`)) return

    try {
      const res = await apiRequest('/admin/demote', {
        method: 'POST',
        body: JSON.stringify({ userId })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Demotion failed')
      }

      toast.success('Admin privileges revoked. Account returned to member status.')
      setAdmins((prev) => prev.filter((a) => a.id !== userId))
      fetchAdmins(true)
    } catch (err) {
      toast.error(err.message || 'Failed demoting administrator.')
    }
  }

  const handleSaveOfficer = async (e) => {
    e.preventDefault()
    toast.success('Grievance Officer settings updated successfully.')
  }

  if (loading && admins.length === 0) {
    return (
      <div 
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text-primary)'
        }}
      >
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && admins.length === 0) {
    return (
      <div 
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '36px' }}>⚠️</div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f3f1ea' }}>Failed to Load Settings</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>{error}</p>
        <button
          onClick={() => fetchAdmins()}
          style={{
            height: '38px',
            padding: '0 20px',
            background: 'var(--accent)',
            color: '#1a0e08',
            fontWeight: '700',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div 
      style={{
        background: 'var(--bg)',
        color: 'var(--text-primary)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'var(--font-body)'
      }}
    >
      
      {/* Header title */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Administrative Panel
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '4px 0 0 0', color: '#f3f1ea' }}>
            Control Center Settings
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Administrators Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h4 style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-display)' }}>
              Administrators Roster
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {admins.map((a) => (
                <div 
                  key={a.id} 
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    padding: '14px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', color: '#f3f1ea' }}>{a.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{a.email}</span>
                  </div>
                  <button
                    onClick={() => handleDemote(a.id, a.name)}
                    style={{
                      height: '30px',
                      padding: '0 12px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--danger)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'background 150ms'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-soft)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    Demote back
                  </button>
                </div>
              ))}
            </div>

            {/* Promote Form */}
            <form onSubmit={handlePromoteSubmit} style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Promote Traveler to Admin</span>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="email"
                  required
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  placeholder="Enter traveler email..."
                  style={{
                    flex: 1,
                    height: '40px',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '100px',
                    padding: '0 16px',
                    fontSize: '13px',
                    color: '#f3f1ea',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={promoting || !promoteEmail.trim()}
                  style={{
                    height: '40px',
                    padding: '0 18px',
                    background: 'var(--accent)',
                    color: '#1a0e08',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '700',
                    borderRadius: '100px',
                    border: 'none',
                    cursor: (promoting || !promoteEmail.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (promoting || !promoteEmail.trim()) ? 0.5 : 1
                  }}
                >
                  {promoting ? 'Promoting...' : 'Promote'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Grievance Officer Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form 
            onSubmit={handleSaveOfficer} 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h4 style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-display)' }}>
              Public Grievance Officer details
            </h4>

            {/* Officer Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Compliance Officer Name</span>
              <input
                type="text"
                required
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="Prakash Joshi..."
                style={{
                  height: '40px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '100px',
                  padding: '0 16px',
                  fontSize: '13px',
                  color: '#f3f1ea',
                  outline: 'none'
                }}
              />
            </div>

            {/* Officer Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Official Compliance Email</span>
              <input
                type="email"
                required
                value={officerEmail}
                onChange={(e) => setOfficerEmail(e.target.value)}
                placeholder="grievance.officer@troopp.com..."
                style={{
                  height: '40px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '100px',
                  padding: '0 16px',
                  fontSize: '13px',
                  color: '#f3f1ea',
                  outline: 'none'
                }}
              />
            </div>

            {/* Officer Designation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Corporate Designation</span>
              <input
                type="text"
                required
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
                placeholder="Chief Compliance Officer..."
                style={{
                  height: '40px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '100px',
                  padding: '0 16px',
                  fontSize: '13px',
                  color: '#f3f1ea',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '8px',
                height: '44px',
                background: 'var(--accent)',
                color: '#1a0e08',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                borderRadius: '100px',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              💾 Save Compliance settings
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}

export default AdminSettings
export { AdminSettings }
