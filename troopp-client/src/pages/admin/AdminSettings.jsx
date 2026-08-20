import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * System and Admin Settings Panel. Handles administrator rosters and Grievance Officer details.
 * Overhauled to match the premium dark moody theme.
 */
const AdminSettings = () => {
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState([])
  const [promoteEmail, setPromoteEmail] = useState('')
  
  // Grievance Officer State
  const [officerName, setOfficerName] = useState('Prakash Joshi')
  const [officerEmail, setOfficerEmail] = useState('grievance.officer@troopp.com')
  const [officerDesignation, setOfficerDesignation] = useState('Chief Compliance Officer')

  const fetchAdmins = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/list')
      await new Promise((r) => setTimeout(r, 400))

      setAdmins([
        { id: 'admin-101', name: 'Admin Priya', email: 'priya.admin@troopp.com' },
        { id: 'admin-102', name: 'Admin Raj', email: 'raj.admin@troopp.com' }
      ])
    } catch (err) {
      console.error('Failed retrieving administrative settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handlePromoteSubmit = async (e) => {
    e.preventDefault()
    if (!promoteEmail.trim()) return

    try {
      // Mock API promote: axios.post('/api/v1/admin/promote', { email: promoteEmail })
      await new Promise((r) => setTimeout(r, 350))

      alert('Traveler successfully promoted to administrator.')
      setPromoteEmail('')
      fetchAdmins()
    } catch (err) {
      console.error('Failed promoting user to admin:', err)
    }
  }

  const handleDemote = async (userId) => {
    try {
      // Mock API demote: axios.post('/api/v1/admin/demote', { userId })
      await new Promise((r) => setTimeout(r, 350))

      alert('Administrator successfully demoted to member status.')
      setAdmins((prev) => prev.filter((a) => a.id !== userId))
    } catch (err) {
      console.error('Failed demoting administrator:', err)
    }
  }

  const handleSaveOfficer = async (e) => {
    e.preventDefault()
    try {
      // Mock API update: axios.put('/api/v1/admin/settings/grievance-officer', { name: officerName, email: officerEmail, designation: officerDesignation })
      await new Promise((r) => setTimeout(r, 300))
      alert('Grievance Officer settings updated successfully.')
    } catch (err) {
      console.error('Failed saving Grievance Officer details:', err)
    }
  }

  if (loading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
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
                    onClick={() => handleDemote(a.id)}
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
              <div style={{ display: 'flex', gap: '10px' }}>
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
                  style={{
                    height: '40px',
                    padding: '0 18px',
                    background: 'var(--accent)',
                    color: '#1a0e08',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '700',
                    borderRadius: '100px',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Promote
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
