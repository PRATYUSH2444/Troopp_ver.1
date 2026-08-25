import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * Trip Activities Content Oversight Queue. Checks inappropriate descriptions.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminActivityReports = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reports, setReports] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  
  // Modals state
  const [activeReport, setActiveReport] = useState(null)
  const [actionType, setActionType] = useState('') // 'resolve' | 'dismiss'
  const [resolutionNote, setResolutionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReports = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/admin/activity-reports')
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((r) => ({
          id: r.id,
          activityId: r.activity_id,
          activityTitle: r.Activity?.title || 'Trip Event',
          creatorName: r.Activity?.Creator?.Profile?.name || 'Trip Host',
          reporterName: r.Reporter?.Profile?.name || 'Explorer',
          reason: r.reason,
          details: r.details,
          createdAt: r.createdAt,
          status: r.status
        }))
        setReports(formatted)
      } else {
        throw new Error(json.message || 'Failed fetching activity reports')
      }
    } catch (err) {
      console.error('Failed retrieving activity reports:', err)
      setError(err.message || 'Unable to connect to activity reports service.')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()

    const handleLiveUpdate = () => {
      fetchReports(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchReports])

  const handleActionSubmit = async () => {
    if (!activeReport || !resolutionNote.trim()) {
      toast.error('Please enter resolution justification notes.')
      return
    }

    setSubmitting(true)
    try {
      const decision = actionType === 'resolve' ? 'resolved' : 'dismissed'
      const res = await apiRequest(`/admin/activity-reports/${activeReport.id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({
          status: decision,
          resolutionNote
        })
      })

      if (!res.ok) throw new Error('Failed to resolve activity report')

      toast.success(`Activity report ${actionType === 'resolve' ? 'Resolved (Trip Cancelled)' : 'Dismissed'}.`)

      setReports((prev) =>
        prev.map((r) =>
          r.id === activeReport.id
            ? { ...r, status: decision }
            : r
        )
      )

      setActiveReport(null)
      setResolutionNote('')
      fetchReports(true)
    } catch (err) {
      toast.error(err.message || 'Failed resolving activity report.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true
    return r.status === statusFilter
  })

  if (loading && reports.length === 0) {
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

  if (error && reports.length === 0) {
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f3f1ea' }}>Failed to Load Activity Reports</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>{error}</p>
        <button
          onClick={() => fetchReports()}
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
            Activities Content Oversight Queue
          </h2>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => setStatusFilter('pending')}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            background: statusFilter === 'pending' ? 'var(--accent-soft)' : 'var(--surface-raised)',
            color: statusFilter === 'pending' ? 'var(--accent)' : 'var(--text-secondary)',
            border: statusFilter === 'pending' ? '1px solid transparent' : '1px solid var(--border)'
          }}
        >
          📥 Pending Queue ({reports.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            background: statusFilter === 'resolved' ? 'var(--moss-soft)' : 'var(--surface-raised)',
            color: statusFilter === 'resolved' ? 'var(--moss)' : 'var(--text-secondary)',
            border: statusFilter === 'resolved' ? '1px solid transparent' : '1px solid var(--border)'
          }}
        >
          ✓ Resolved Queue
        </button>
        <button
          onClick={() => setStatusFilter('dismissed')}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            background: statusFilter === 'dismissed' ? 'var(--surface)' : 'var(--surface-raised)',
            color: statusFilter === 'dismissed' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: statusFilter === 'dismissed' ? '1px solid transparent' : '1px solid var(--border)'
          }}
        >
          🚫 Dismissed Queue
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
          <table className="min-w-[700px]" style={{ width: '100%', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
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
                <th style={{ padding: '16px' }}>Reporter</th>
                <th style={{ padding: '16px' }}>Activity Title</th>
                <th style={{ padding: '16px' }}>Creator / Host</th>
                <th style={{ padding: '16px' }}>Flag Reason</th>
                <th style={{ padding: '16px' }}>Details Description</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ divideY: '1px solid rgba(255,255,255,0.04)' }}>
              {filteredReports.map((r) => (
                <tr 
                  key={r.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                  className="hover:bg-white/[0.02]"
                >
                  <td style={{ padding: '16px', fontWeight: '700', color: '#f3f1ea' }}>{r.reporterName}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: '#f3f1ea' }}>{r.activityTitle}</td>
                  <td style={{ padding: '16px' }}>{r.creatorName}</td>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                    <span 
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'var(--danger-soft)',
                        color: 'var(--danger)',
                        fontWeight: '700',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {r.reason}
                    </span>
                  </td>
                  <td style={{ padding: '16px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.details}>{r.details}</td>
                  <td style={{ padding: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setActiveReport(r)
                            setActionType('resolve')
                          }}
                          style={{
                            height: '30px',
                            padding: '0 12px',
                            background: 'var(--danger)',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Cancel Trip
                        </button>
                        <button
                          onClick={() => {
                            setActiveReport(r)
                            setActionType('dismiss')
                          }}
                          style={{
                            height: '30px',
                            padding: '0 12px',
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: '#f3f1ea',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>No action needed</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No activity reports found in the {statusFilter} queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Note modal overlay */}
      {activeReport && (
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
              gap: '16px'
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f3f1ea', margin: 0, fontFamily: 'var(--font-display)' }}>
              {actionType === 'resolve' ? 'Confirm Cancellation' : 'Confirm Dismiss Report'}
            </h4>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              {actionType === 'resolve'
                ? 'Cancelling this activity will alert all members, delete group access and issue trust score strikes on the host.'
                : 'Dismissing this report files it as invalid. No action will be taken.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Auditor Action Notes</span>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Write resolution notes..."
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#f3f1ea',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => {
                  setActiveReport(null)
                  setResolutionNote('')
                }}
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
                Cancel
              </button>
              <button
                disabled={!resolutionNote.trim()}
                onClick={handleActionSubmit}
                style={{
                  flex: 1,
                  height: '38px',
                  background: actionType === 'resolve' ? 'var(--danger)' : 'var(--surface-raised)',
                  color: actionType === 'resolve' ? 'white' : '#f3f1ea',
                  border: actionType === 'resolve' ? 'none' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: !resolutionNote.trim() ? 0.4 : 1
                }}
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminActivityReports
export { AdminActivityReports }
