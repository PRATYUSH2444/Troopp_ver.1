import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'

/**
 * Traveler Administration Console. Filters, paginates, bans, suspends, and exports traveler accounts logs.
 * Overhauled to match the premium dark moody theme.
 */
const AdminUsers = () => {
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  
  // Filters parameters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifyFilter, setVerifyFilter] = useState('all')

  const fetchUsers = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/users')
      await new Promise((r) => setTimeout(r, 450))

      setUsers([
        {
          id: 'user-1',
          name: 'Raj Malhotra',
          email: 'raj@gmail.com',
          city: 'Mumbai',
          trustScore: 80,
          reliabilityScore: 98,
          account_status: 'active'
        },
        {
          id: 'user-2',
          name: 'Priya Sharma',
          email: 'priya@gmail.com',
          city: 'Pune',
          trustScore: 72,
          reliabilityScore: 95,
          account_status: 'active'
        },
        {
          id: 'user-3',
          name: 'Vikram Malhotra',
          email: 'vikram@gmail.com',
          city: 'Bangalore',
          trustScore: 55,
          reliabilityScore: 80,
          account_status: 'suspended'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving travelers list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSelectRow = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map((u) => u.id))
    }
  }

  const handleExportCSV = () => {
    const selectedRows = users.filter((u) => selectedUserIds.includes(u.id))
    const headers = ['ID', 'Name', 'Email', 'City', 'Trust Score', 'Reliability', 'Status']
    const rows = selectedRows.map((u) => [u.id, u.name, u.email, u.city, u.trustScore, u.reliabilityScore, u.account_status])
    
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'troopp_travelers_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter local rows
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter
    const matchesVerify =
      verifyFilter === 'all' ||
      (verifyFilter === 'trusted' && u.trustScore >= 75) ||
      (verifyFilter === 'explorer' && u.trustScore >= 50)

    return matchesSearch && matchesStatus && matchesVerify
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
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid rgba(255,106,44,0.3)',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>
            {selectedUserIds.length} Travelers selected for bulk action
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => alert(`Bulk Notification sent to ${selectedUserIds.length} users.`)}
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
                    <Avatar size="sm" name={u.name} score={u.trustScore} />
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
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default AdminUsers
export { AdminUsers }
