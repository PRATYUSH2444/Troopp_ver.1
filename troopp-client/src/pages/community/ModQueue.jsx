import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import Button from '../../components/common/Button.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { haptics } from '../../utils/haptics.js'

const ModQueue = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQueue = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/community/moderation/queue')
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          setReports(json.data.reports || [])
          return
        }
      }
      throw new Error('Failed to load moderator queue')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Access denied: Moderator privileges required.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleAction = async (reportId, action) => {
    haptics.impactLight()
    try {
      const res = await apiRequest(`/community/moderation/reports/${reportId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success') {
          setReports(prev => prev.filter(r => r.id !== reportId))
        }
      }
    } catch (err) {
      alert(err.message || 'Action resolution failed')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--danger)' }}>Access Denied</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', textAlign: 'center' }}>
          {error}
        </p>
        <Button onClick={() => navigate('/community')} variant="primary">
          Back to Community Feed
        </Button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            🛡️ Moderator Queue
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Review content flags submitted by travelers across boards you moderate.
          </p>
        </div>
        <Button onClick={() => navigate('/community')} variant="ghost" style={{ padding: '8px 16px', height: '36px', borderRadius: '10px', fontSize: '12px' }}>
          Back to Feed
        </Button>
      </div>

      {reports.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Queue is empty</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>Great job! No items are currently flagged for review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => (
            <div 
              key={report.id} 
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              {/* Card Header info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Flagged Item: {report.target_type}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Reported by <strong>{report.reporter_name}</strong> for <strong>"{report.reason}"</strong>
                  </span>
                </div>
                {report.board_name && (
                  <span style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    b/{report.board_name}
                  </span>
                )}
              </div>

              {/* Reported Content Snippet */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
                {report.target_type === 'post' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {report.target?.title}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {report.target?.content || <i>(No text content body)</i>}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {report.target?.content}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <Button 
                  onClick={() => handleAction(report.id, 'approve')}
                  variant="ghost" 
                  style={{
                    padding: '8px 18px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '12.5px'
                  }}
                >
                  Approve (Keep)
                </Button>
                <Button 
                  onClick={() => handleAction(report.id, 'remove')}
                  variant="primary" 
                  style={{
                    padding: '8px 20px',
                    height: '36px',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#ffffff',
                    background: 'var(--danger)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '12.5px'
                  }}
                >
                  Remove Content
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ModQueue
