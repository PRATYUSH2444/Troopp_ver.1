import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Administrative Audit Logs. Immutable records of administrative actions.
 * Overhauled to match the premium dark moody theme.
 */
const AdminLogs = () => {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [actionFilter, setActionFilter] = useState('all')

  const fetchLogs = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/logs')
      await new Promise((r) => setTimeout(r, 450))

      setLogs([
        {
          id: 'log-1',
          createdAt: '2026-07-06T11:00:00Z',
          adminName: 'Admin Priya',
          action: 'add_ip_block',
          target_type: 'ip_block',
          target_id: 'block-1',
          details: 'IP: 192.168.1.120. Reason: DDoS attempts and socket request spamming.'
        },
        {
          id: 'log-2',
          createdAt: '2026-07-06T10:00:00Z',
          adminName: 'Admin Priya',
          action: 'approve_verification',
          target_type: 'user',
          target_id: 'user-3',
          details: 'KYC approved for Vikram Malhotra.'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving administrative audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((l) => {
    if (actionFilter === 'all') return true
    return l.action === actionFilter
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
            Administrative Audit Logs
          </h2>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{
            height: '42px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0 12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '320px'
          }}
        >
          <option value="all" style={{ background: '#1a2129', color: '#f3f1ea' }}>Filter Action: All Audit Logs</option>
          <option value="add_ip_block" style={{ background: '#1a2129', color: '#f3f1ea' }}>IP Blocked</option>
          <option value="approve_verification" style={{ background: '#1a2129', color: '#f3f1ea' }}>Approve KYC</option>
          <option value="suspend_user" style={{ background: '#1a2129', color: '#f3f1ea' }}>Suspend Traveler</option>
          <option value="ban_user" style={{ background: '#1a2129', color: '#f3f1ea' }}>Ban Traveler</option>
        </select>
      </div>

      {/* Logs Data Grid */}
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
                <th style={{ padding: '16px' }}>Timestamp</th>
                <th style={{ padding: '16px' }}>Administrator</th>
                <th style={{ padding: '16px' }}>Action Type</th>
                <th style={{ padding: '16px' }}>Target Class</th>
                <th style={{ padding: '16px' }}>Action Details</th>
              </tr>
            </thead>
            <tbody style={{ divideY: '1px solid rgba(255,255,255,0.04)' }}>
              {filteredLogs.map((l) => (
                <tr 
                  key={l.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                  className="hover:bg-white/[0.02]"
                >
                  <td style={{ padding: '14px 16px', color: 'var(--text-tertiary)' }}>
                    {new Date(l.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#f3f1ea' }}>{l.adminName}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span 
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        color: '#f3f1ea',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {l.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'capitalize' }}>{l.target_type}</td>
                  <td style={{ padding: '14px 16px', maxWidth: '320px', wordBreak: 'break-words', color: '#f3f1ea' }}>{l.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontWeight: '700' }}>
                    No matching audit log records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default AdminLogs
export { AdminLogs }
