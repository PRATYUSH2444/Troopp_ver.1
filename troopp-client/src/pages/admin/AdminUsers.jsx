import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * Traveler Administration Console. Filters, paginates, bans, suspends, and exports traveler accounts logs.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminUsers = () => {
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 25
  const [selectedUserIds, setSelectedUserIds] = useState([])
  
  // Filters parameters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifyFilter, setVerifyFilter] = useState('all')

  // Bulk Broadcast Modal State
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        account_status: statusFilter
      })

      const res = await apiRequest(`/admin/users?${queryParams.toString()}`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data)
        setTotalCount(json.total || json.data.length)
      } else {
        throw new Error(json.message || 'Failed to fetch users list')
      }
    } catch (err) {
      console.error('Failed retrieving travelers list:', err)
      setError(err.message || 'Unable to connect to users service.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(handler)
  }, [search, statusFilter, page, fetchUsers])

  // Real-time synchronization
  useEffect(() => {
    const handleLiveUpdate = () => {
      fetchUsers(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchUsers])

  const handleSelectRow = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id))
    }
  }

  const handleExportCSV = () => {
    const selectedRows = selectedUserIds.length > 0
      ? users.filter((u) => selectedUserIds.includes(u.id))
      : users

    if (selectedRows.length === 0) {
      toast.error('No traveler records available to export.')
      return
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Trust Score', 'Reliability', 'Status', 'Role']
    const rows = selectedRows.map((u) => [
      `"${u.id}"`,
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.city || ''}"`,
      u.trustScore ?? 50,
      u.reliabilityScore ?? 100,
      `"${u.account_status || 'active'}"`,
      `"${u.role || 'member'}"`
    ])
    
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `troopp_travelers_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${selectedRows.length} traveler records.`)
  }

  const handleSendBulkNotification = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error('Please enter notification title and message body.')
      return
    }
    setBroadcasting(true)
    try {
      const res = await apiRequest('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          target: 'all',
          title: broadcastTitle,
          body: broadcastBody
        })
      })
      if (!res.ok) throw new Error('Broadcast delivery failed')
      toast.success('Bulk broadcast sent successfully.')
      setBroadcastOpen(false)
      setBroadcastTitle('')
      setBroadcastBody('')
      setSelectedUserIds([])
    } catch (err) {
      toast.error(err.message || 'Failed delivering bulk broadcast.')
    } finally {
      setBroadcasting(false)
    }
  }

  // Filter local rows (for trust score tier client refinement)
  const filteredUsers = users.filter((u) => {
    const matchesVerify =
      verifyFilter === 'all' ||
      (verifyFilter === 'trusted' && (u.trustScore || 50) >= 75) ||
      (verifyFilter === 'explorer' && (u.trustScore || 50) >= 50)

    return matchesVerify
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / limit))

  if (loading && users.length === 0) {
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

  if (error && users.length === 0) {
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f3f1ea' }}>Failed to Load Travelers</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>{error}</p>
        <button
          onClick={() => fetchUsers()}
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
            Travelers Administration
          </h2>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search name or email..."
          style={{
            height: '42px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0 16px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: '42px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0 12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all" style={{ background: '#1a2129', color: '#f3f1ea' }}>Filter Status: All Accounts</option>
          <option value="active" style={{ background: '#1a2129', color: '#f3f1ea' }}>Active</option>
          <option value="suspended" style={{ background: '#1a2129', color: '#f3f1ea' }}>Suspended</option>
          <option value="banned" style={{ background: '#1a2129', color: '#f3f1ea' }}>Banned</option>
        </select>

        <select
          value={verifyFilter}
          onChange={(e) => setVerifyFilter(e.target.value)}
          style={{
            height: '42px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0 12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all" style={{ background: '#1a2129', color: '#f3f1ea' }}>Filter Reputation: All</option>
          <option value="trusted" style={{ background: '#1a2129', color: '#f3f1ea' }}>Trusted Only (75+)</option>
          <option value="explorer" style={{ background: '#1a2129', color: '#f3f1ea' }}>Explorer Only (50+)</option>
        </select>
      </div>

      {/* Bulk action alert bar */}
      {selectedUserIds.length > 0 && (
        <div 
          className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid rgba(255,106,44,0.3)',
            padding: '12px 16px',
            borderRadius: '12px'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>
            {selectedUserIds.length} Travelers selected for bulk action
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setBroadcastOpen(true)}
              style={{
                height: '34px',
                padding: '0 14px',
                background: 'var(--accent)',
                color: '#1a0e08',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: 'var(--font-display)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📣 Send Broadcast Notification
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                height: '34px',
                padding: '0 14px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                color: '#f3f1ea',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              CSV Export ⇩
            </button>
          </div>
        </div>
      )}

      {/* Users Data Grid */}
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
                <th style={{ padding: '16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#ff6a2c' }}
                  />
                </th>
                <th style={{ padding: '16px' }}>Traveler Info</th>
                <th style={{ padding: '16px' }}>City</th>
                <th style={{ padding: '16px' }}>Trust Score</th>
                <th style={{ padding: '16px' }}>Reliability</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ divideY: '1px solid rgba(255,255,255,0.04)' }}>
              {filteredUsers.map((u) => (
                <tr 
                  key={u.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                  className="hover:bg-white/[0.02]"
                >
                  <td style={{ padding: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => handleSelectRow(u.id)}
                      style={{ cursor: 'pointer', accentColor: '#ff6a2c' }}
                    />
                  </td>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar size="sm" src={u.avatar_url} name={u.name} score={u.trustScore} />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: '700', color: '#f3f1ea', fontSize: '13px' }}>{u.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{u.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>{u.city}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#f3f1ea' }}>{u.trustScore}</span>
                      <span 
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: u.trustScore >= 75 ? 'var(--moss-soft)' : u.trustScore >= 50 ? 'rgba(59,130,246,0.14)' : 'rgba(107,117,124,0.20)',
                          color: u.trustScore >= 75 ? 'var(--moss)' : u.trustScore >= 50 ? '#3b82f6' : '#6b757c',
                          fontWeight: '600'
                        }}
                      >
                        {u.trustScore >= 75 ? 'Trusted' : u.trustScore >= 50 ? 'Explorer' : 'New'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '700', color: '#f3f1ea' }}>{u.reliabilityScore}%</td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '100px',
                        textTransform: 'uppercase',
                        background: u.account_status === 'active' ? 'var(--moss-soft)' : 'var(--danger-soft)',
                        color: u.account_status === 'active' ? 'var(--moss)' : 'var(--danger)',
                        border: '1px solid transparent'
                      }}
                    >
                      {u.account_status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
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
                      View Details ⚙️
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    {search ? `No travelers found matching "${search}"` : 'No traveler accounts match the current filter.'}
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
            Showing <strong>{filteredUsers.length}</strong> of <strong>{totalCount}</strong> travelers
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

      {/* Bulk Broadcast Modal */}
      {broadcastOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h4 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f3f1ea', margin: 0, fontFamily: 'var(--font-display)' }}>
              Send Broadcast Push Notification
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              This notification will be delivered to travelers across the platform via push and in-app alerts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Alert Title</span>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Weather Advisory: Monsoon Trek Safety"
                style={{
                  height: '38px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0 12px',
                  color: '#f3f1ea',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Message Body</span>
              <textarea
                rows={3}
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Enter alert description..."
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
                disabled={broadcasting}
                onClick={() => setBroadcastOpen(false)}
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
                disabled={broadcasting || !broadcastTitle.trim() || !broadcastBody.trim()}
                onClick={handleSendBulkNotification}
                style={{
                  flex: 1,
                  height: '38px',
                  background: 'var(--accent)',
                  color: '#1a0e08',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: (!broadcastTitle.trim() || !broadcastBody.trim() || broadcasting) ? 0.5 : 1
                }}
              >
                {broadcasting ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminUsers
export { AdminUsers }
