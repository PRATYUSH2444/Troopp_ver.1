import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Trip Activities Content Oversight Queue. Checks inappropriate descriptions.
 * Overhauled to match the premium dark moody theme.
 */
const AdminActivityReports = () => {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  
  // Modals state
  const [activeReport, setActiveReport] = useState(null)
  const [actionType, setActionType] = useState('') // 'resolve' | 'dismiss'
  const [resolutionNote, setResolutionNote] = useState('')

  const fetchReports = async () => {
    try {
      // Mock API: axios.get('/api/v1/admin/activity-reports')
      await new Promise((r) => setTimeout(r, 400))

      setReports([
        {
          id: 'act-rep-1',
          activityId: 'act-1',
          activityTitle: 'Secret Wild Forest Drinking Party',
          creatorName: 'Vikram Malhotra',
          reporterName: 'Priya Sharma',
          reason: 'Inappropriate Content / Safety Violation',
          details: 'Description promotes drinking inside reserved forest areas without permits. Violates safety bylaws.',
          createdAt: '2026-07-06T12:00:00Z',
          status: 'pending'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving activity reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleActionSubmit = async () => {
    if (!activeReport || !resolutionNote.trim()) return

    try {
      // Mock API dispatch: axios.put(`/api/v1/admin/activity-reports/${activeReport.id}/resolve`, { status: actionType === 'resolve' ? 'resolved' : 'dismissed', resolutionNote })
      await new Promise((r) => setTimeout(r, 350))

      setReports((prev) =>
        prev.map((r) =>
          r.id === activeReport.id
            ? { ...r, status: actionType === 'resolve' ? 'resolved' : 'dismissed' }
            : r
        )
      )

      alert(`Activity report resolved. status updated to ${actionType === 'resolve' ? 'Resolved' : 'Dismissed'}.`)
      setActiveReport(null)
      setResolutionNote('')
    } catch (err) {
      console.error('Failed resolving activity report:', err)
    }
  }

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true
    return r.status === statusFilter
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
            Activities Content Oversight Queue
          </h2>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: '10px' }}>
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
