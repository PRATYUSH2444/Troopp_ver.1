import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Platform Activities oversight and cancellation panel.
 * Overhauled to match the premium dark moody theme.
 */
const AdminActivities = () => {
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  
  // Filters parameters
  const [statusFilter, setStatusFilter] = useState('all')

  // Cancellation Modal
  const [cancelTrip, setCancelTrip] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const fetchActivities = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/activities')
      await new Promise((r) => setTimeout(r, 450))

      setActivities([
        {
          id: 'act-1',
          title: 'Secret Wild Forest Drinking Party',
          creatorName: 'Vikram Malhotra',
          city: 'Pune',
          type: 'Adventure',
          status: 'active',
          membersCount: 4,
          maxMembers: 8,
          dateTime: '2026-07-22T06:00:00Z'
        },
        {
          id: 'act-2',
          title: 'Stargazing Camp & Lake BBQ Pune',
          creatorName: 'Priya Sharma',
          city: 'Pune',
          type: 'Camping',
          status: 'completed',
          membersCount: 8,
          maxMembers: 10,
          dateTime: '2026-06-12T14:00:00Z'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving activities oversight:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleCancelSubmit = async () => {
    if (!cancelTrip || !cancelReason.trim()) return

    try {
      // Mock API cancel: axios.put(`/api/v1/admin/activities/${cancelTrip.id}/cancel`, { reason: cancelReason })
      await new Promise((r) => setTimeout(r, 400))

      setActivities((prev) =>
        prev.map((a) => (a.id === cancelTrip.id ? { ...a, status: 'cancelled' } : a))
      )

      alert('Activity successfully cancelled. Members notified.')
      setCancelTrip(null)
      setCancelReason('')
    } catch (err) {
      console.error('Failed cancelling activity:', err)
    }
  }

  const filteredActivities = activities.filter((a) => {
    if (statusFilter === 'all') return true
    return a.status === statusFilter
  })

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
            Platform Activities Oversight
          </h2>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            background: statusFilter === 'all' ? 'var(--accent-soft)' : 'var(--surface-raised)',
            color: statusFilter === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
            border: statusFilter === 'all' ? '1px solid transparent' : '1px solid var(--border)'
          }}
        >
          All Trips
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            background: statusFilter === 'active' ? 'var(--moss-soft)' : 'var(--surface-raised)',
            color: statusFilter === 'active' ? 'var(--moss)' : 'var(--text-secondary)',
            border: statusFilter === 'active' ? '1px solid transparent' : '1px solid var(--border)'
          }}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            background: statusFilter === 'completed' ? 'var(--surface)' : 'var(--surface-raised)',
            color: statusFilter === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: statusFilter === 'completed' ? '1px solid transparent' : '1px solid var(--border)'
          }}
        >
          Completed
        </button>
      </div>

      {/* Grid details list */}
      <div 
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div className="overflow-x-auto">
          <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <thead 
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-primary)',
                background: 'var(--surface-raised)',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <tr>
                <th style={{ padding: '16px' }}>Trip Title</th>
                <th style={{ padding: '16px' }}>Host / Creator</th>
                <th style={{ padding: '16px' }}>City</th>
                <th style={{ padding: '16px' }}>Type</th>
                <th style={{ padding: '16px' }}>Members</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ divideY: '1px solid rgba(255,255,255,0.04)' }}>
              {filteredActivities.map((a) => (
                <tr 
                  key={a.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                  className="hover:bg-white/[0.02]"
                >
                  <td style={{ padding: '16px', fontWeight: '700', color: '#f3f1ea' }}>{a.title}</td>
                  <td style={{ padding: '16px' }}>{a.creatorName}</td>
                  <td style={{ padding: '16px' }}>{a.city}</td>
                  <td style={{ padding: '16px' }}>{a.type}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: '#f3f1ea' }}>
                    {a.membersCount} / {a.maxMembers}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span 
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '100px',
                        textTransform: 'uppercase',
                        background: a.status === 'active' ? 'var(--moss-soft)' : a.status === 'completed' ? 'rgba(59,130,246,0.14)' : 'var(--danger-soft)',
                        color: a.status === 'active' ? 'var(--moss)' : a.status === 'completed' ? '#3b82f6' : 'var(--danger)'
                      }}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => navigate(`/trip-rooms/${a.id}`)}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          color: '#f3f1ea',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background 150ms'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-raised)' }}
                      >
                        Enter Room 💬
                      </button>
                      {a.status === 'active' && (
                        <button
                          onClick={() => setCancelTrip(a)}
                          style={{
                            height: '32px',
                            padding: '0 12px',
                            background: 'var(--danger)',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel confirm modal */}
      {cancelTrip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '360px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '36px', display: 'block', margin: '0 auto' }}>🛑</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', margin: 0, fontFamily: 'var(--font-display)' }}>Cancel Activity</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Are you sure you want to cancel the activity "{cancelTrip.title}"?
              </p>
            </div>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Mandatory cancellation reason..."
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px',
                color: '#f3f1ea',
                resize: 'none',
                outline: 'none',
                fontSize: '12px',
                textAlign: 'left'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                onClick={() => setCancelTrip(null)} 
                style={{
                  flex: 1,
                  height: '38px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={handleCancelSubmit}
                style={{
                  flex: 1,
                  height: '38px',
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: !cancelReason.trim() ? 0.4 : 1
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminActivities
export { AdminActivities }
