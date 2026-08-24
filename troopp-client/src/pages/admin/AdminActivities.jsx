import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * Platform Activities oversight and cancellation panel.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminActivities = () => {
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activities, setActivities] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 25
  
  // Filters parameters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Cancellation Modal
  const [cancelTrip, setCancelTrip] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchActivities = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        status: statusFilter
      })

      const res = await apiRequest(`/admin/activities?${queryParams.toString()}`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setActivities(json.data)
        setTotalCount(json.total || json.data.length)
      } else {
        throw new Error(json.message || 'Failed to retrieve platform trips')
      }
    } catch (err) {
      console.error('Failed retrieving activities oversight:', err)
      if (activities.length === 0) {
        setError(err.message || 'Unable to connect to activities service.')
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, activities.length])

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchActivities()
    }, 300)
    return () => clearTimeout(handler)
  }, [search, statusFilter, page, fetchActivities])

  // Real-time synchronization
  useEffect(() => {
    const handleLiveUpdate = () => {
      fetchActivities(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchActivities])

  const handleCancelSubmit = async () => {
    if (!cancelTrip || !cancelReason.trim()) {
      toast.error('Please enter a cancellation reason.')
      return
    }

    setCancelling(true)
    try {
      const res = await apiRequest(`/admin/activities/${cancelTrip.id}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason: cancelReason })
      })

      if (!res.ok) throw new Error('Failed to cancel trip')

      toast.success('Trip successfully cancelled. All confirmed members have been notified.')
      setActivities((prev) =>
        prev.map((a) => (a.id === cancelTrip.id ? { ...a, status: 'cancelled' } : a))
      )

      setCancelTrip(null)
      setCancelReason('')
      fetchActivities(true)
    } catch (err) {
      toast.error(err.message || 'Failed cancelling activity.')
    } finally {
      setCancelling(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / limit))

  if (loading && activities.length === 0) {
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

  if (error && activities.length === 0) {
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f3f1ea' }}>Failed to Load Activities</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>{error}</p>
        <button
          onClick={() => fetchActivities()}
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
            Platform Activities Oversight
          </h2>
        </div>
      </div>

      {/* Filters row with Search */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search trips by title..."
          style={{
            height: '38px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0 14px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
            minWidth: '220px',
            flex: '1'
          }}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: '100px',
              fontSize: '12px',
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
              padding: '0 14px',
              borderRadius: '100px',
              fontSize: '12px',
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
              padding: '0 14px',
              borderRadius: '100px',
              fontSize: '12px',
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
          <button
            onClick={() => setStatusFilter('cancelled')}
            style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              background: statusFilter === 'cancelled' ? 'var(--danger-soft)' : 'var(--surface-raised)',
              color: statusFilter === 'cancelled' ? 'var(--danger)' : 'var(--text-secondary)',
              border: statusFilter === 'cancelled' ? '1px solid transparent' : '1px solid var(--border)'
            }}
          >
            Cancelled
          </button>
        </div>
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
              {activities.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    {search ? `No trips found matching "${search}"` : `No trips found in the ${statusFilter} category.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-raised)',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          <span>
            Showing <strong>{activities.length}</strong> of <strong>{totalCount}</strong> platform trips
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                height: '32px',
                padding: '0 12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: page <= 1 ? 'var(--text-tertiary)' : '#f3f1ea',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1
              }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '0 4px', color: '#f3f1ea' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                height: '32px',
                padding: '0 12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: page >= totalPages ? 'var(--text-tertiary)' : '#f3f1ea',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1
              }}
            >
              Next →
            </button>
          </div>
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
