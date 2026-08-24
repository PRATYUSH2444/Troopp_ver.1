import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * IP Block list and ban override panel.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminIPBlocks = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [blocks, setBlocks] = useState([])
  
  // Form parameters
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')
  const [expiry, setExpiry] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchIPBlocks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/admin/ip-blocks')
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setBlocks(json.data)
      } else {
        throw new Error(json.message || 'Failed retrieving IP blocks')
      }
    } catch (err) {
      console.error('Failed retrieving IP blocks:', err)
      if (blocks.length === 0) {
        setError(err.message || 'Unable to connect to firewall service.')
      }
    } finally {
      setLoading(false)
    }
  }, [blocks.length])

  useEffect(() => {
    fetchIPBlocks()

    const handleLiveUpdate = () => {
      fetchIPBlocks(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchIPBlocks])

  const handleAddBlock = async (e) => {
    e.preventDefault()
    if (!ip.trim() || !reason.trim()) {
      toast.error('Please specify the IP address and ban justification.')
      return
    }

    setAdding(true)
    try {
      const res = await apiRequest('/admin/ip-blocks', {
        method: 'POST',
        body: JSON.stringify({ ip: ip.trim(), reason: reason.trim(), expiresAt: expiry || null })
      })

      if (!res.ok) throw new Error('Failed to block IP')

      toast.success(`IP address ${ip.trim()} blocked successfully.`)
      setIp('')
      setReason('')
      setExpiry('')
      fetchIPBlocks(true)
    } catch (err) {
      toast.error(err.message || 'Failed adding IP block.')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveBlock = async (blockId, ipAddr) => {
    if (!window.confirm(`Are you sure you want to unblock IP ${ipAddr || ''}?`)) return

    try {
      const res = await apiRequest(`/admin/ip-blocks/${blockId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove block')

      toast.success('IP address unblocked successfully.')
      setBlocks((prev) => prev.filter((b) => b.id !== blockId))
      fetchIPBlocks(true)
    } catch (err) {
      toast.error(err.message || 'Failed removing IP block.')
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
            IP Blacklist Management
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form to block IP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form 
            onSubmit={handleAddBlock} 
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
              Add IP Block
            </h4>

            {/* IP Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>IP Address</span>
              <input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 192.168.1.1"
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

            {/* Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Block Justification</span>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for blocking..."
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#f3f1ea',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Expiry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Block Expiry (Optional)</span>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
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
                background: 'var(--danger)',
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                borderRadius: '100px',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🚫 Block IP Address
            </button>
          </form>
        </div>

        {/* Right Columns: IP Blocks Grid */}
        <div className="lg:col-span-2 flex flex-col gap-5">
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
              Active IP blocks blacklist
            </h4>
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
                    <th style={{ padding: '12px 16px' }}>IP Address</th>
                    <th style={{ padding: '12px 16px' }}>Block Reason</th>
                    <th style={{ padding: '12px 16px' }}>Blocked By</th>
                    <th style={{ padding: '12px 16px' }}>Expires At</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ divideY: '1px solid rgba(255,255,255,0.04)' }}>
                  {blocks.map((b) => (
                    <tr 
                      key={b.id} 
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                      className="hover:bg-white/[0.02]"
                    >
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: '#f3f1ea' }}>{b.ip_address}</td>
                      <td style={{ padding: '14px 16px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.reason}>{b.reason}</td>
                      <td style={{ padding: '14px 16px' }}>{b.blocked_by}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : 'Permanent'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemoveBlock(b.id, b.ip_address)}
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
                          Unblock ⤬
                        </button>
                      </td>
                    </tr>
                  ))}
                  {blocks.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No blacklisted IP addresses. Platform firewall is clean.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default AdminIPBlocks
export { AdminIPBlocks }
