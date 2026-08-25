import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * Administrative Push Broadcast Center. Sends targeted push alerts.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminBroadcast = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [cities, setCities] = useState([])
  
  // Form parameters
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('all') // 'all' | 'city'
  const [selectedCity, setSelectedCity] = useState('')
  const [sending, setSending] = useState(false)

  // Confirmation Modal
  const [confirmOpen, setConfirmOpen] = useState(false)

  const fetchHistory = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const [histRes, citiesRes] = await Promise.all([
        apiRequest('/admin/broadcasts'),
        apiRequest('/cities')
      ])

      if (histRes.ok) {
        const histJson = await histRes.json()
        if (histJson.success && Array.isArray(histJson.data)) {
          setHistory(histJson.data)
        }
      }

      if (citiesRes.ok) {
        const citiesJson = await citiesRes.json()
        if (citiesJson.success && Array.isArray(citiesJson.data)) {
          setCities(citiesJson.data)
        }
      }
    } catch (err) {
      console.error('Failed retrieving broadcasts data:', err)
      setError(err.message || 'Unable to load broadcast records.')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()

    const handleLiveUpdate = () => {
      fetchHistory(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchHistory])

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in both title and message body.')
      return
    }

    if (target === 'city' && !selectedCity) {
      toast.error('Please choose a target city.')
      return
    }

    setSending(true)
    try {
      const res = await apiRequest('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          target,
          cityId: selectedCity || null
        })
      })

      if (!res.ok) throw new Error('Broadcast delivery failed')

      toast.success('Broadcast push notifications dispatched successfully!')
      setConfirmOpen(false)
      setTitle('')
      setBody('')
      setSelectedCity('')
      fetchHistory(true)
    } catch (err) {
      toast.error(err.message || 'Failed sending broadcast.')
    } finally {
      setSending(false)
    }
  }

  if (loading && history.length === 0) {
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

  if (error && history.length === 0) {
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f3f1ea' }}>Failed to Load Broadcast Data</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>{error}</p>
        <button
          onClick={() => fetchHistory()}
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
        gap: '24px',
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
            Push Notification Broadcast Center
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Broadcast Form & Live Preview */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h4 style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: '0 0 8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', fontFamily: 'var(--font-display)' }}>
              Draft Message Campaign
            </h4>

            {/* Campaign title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: 'var(--text-secondary)' }}>
                <span>Notification Title</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{title.length} / 100</span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Monsoon trail heavy rain alert..."
                style={{
                  height: '42px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '100px',
                  padding: '0 18px',
                  fontSize: '13px',
                  color: '#f3f1ea',
                  outline: 'none'
                }}
              />
            </div>

            {/* Campaign description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: 'var(--text-secondary)' }}>
                <span>Notification Body Description</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{body.length} / 500</span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Alert text details..."
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#f3f1ea',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Target Audience radio options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Target Audience Scope</span>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', color: '#f3f1ea' }}>
                  <input
                    type="radio"
                    name="target"
                    checked={target === 'all'}
                    onChange={() => setTarget('all')}
                    style={{ accentColor: '#ff6a2c' }}
                  />
                  <span>All Registered Users</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', color: '#f3f1ea' }}>
                  <input
                    type="radio"
                    name="target"
                    checked={target === 'city'}
                    onChange={() => setTarget('city')}
                    style={{ accentColor: '#ff6a2c' }}
                  />
                  <span>Specific City Target</span>
                </label>
              </div>

              {target === 'city' && (
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={{
                    marginTop: '8px',
                    height: '42px',
                    background: 'var(--surface-raised)',
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
                  <option value="" style={{ background: '#1a2129', color: '#f3f1ea' }}>Select Target City</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#1a2129', color: '#f3f1ea' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              disabled={!title.trim() || !body.trim() || (target === 'city' && !selectedCity)}
              onClick={() => setConfirmOpen(true)}
              style={{
                marginTop: '12px',
                height: '46px',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                color: '#1a0e08',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                borderRadius: '100px',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255,106,44,0.20)',
                opacity: (!title.trim() || !body.trim() || (target === 'city' && !selectedCity)) ? 0.4 : 1,
                transition: 'opacity 150ms'
              }}
            >
              📣 Schedule Broadcast push Alert
            </button>
          </div>
        </div>

        {/* Right Column: Live Mock Preview screen */}
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
              gap: '12px'
            }}
          >
            <h4 style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: '0 0 8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', fontFamily: 'var(--font-display)' }}>
              Live Mock Preview
            </h4>
            
            {/* Phone Shell mock */}
            <div 
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                borderRadius: '24px',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                maxWidth: '240px',
                margin: '0 auto',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
              }}
            >
              <span style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontWeight: '700', display: 'block', textAlign: 'center', uppercase: 'true', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Smartphone Notification</span>
              
              <div 
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  padding: '12px',
                  borderRadius: '14px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <span style={{ fontSize: '18px' }}>⛺</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                  <span style={{ fontWeight: '700', color: '#f3f1ea', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {title || 'Monsoon rain alerts'}
                  </span>
                  <p style={{ fontSize: '9px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.3', wordBreak: 'break-words' }}>
                    {body || 'Description details will be rendered here for user previews.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Campaign Broadcast logs */}
      <div 
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <h4 style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: '0 0 16px 0', fontFamily: 'var(--font-display)' }}>
          Campaign Broadcast Dispatch Logs
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-[600px]" style={{ width: '100%', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
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
                <th style={{ padding: '12px 16px' }}>Send Date</th>
                <th style={{ padding: '12px 16px' }}>Campaign Title</th>
                <th style={{ padding: '12px 16px' }}>Audience Target</th>
                <th style={{ padding: '12px 16px' }}>Recipients Count</th>
                <th style={{ padding: '12px 16px' }}>Sent By</th>
              </tr>
            </thead>
            <tbody style={{ divideY: '1px solid rgba(255,255,255,0.04)' }}>
              {history.map((h) => (
                <tr 
                  key={h.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                  className="hover:bg-white/[0.02]"
                >
                  <td style={{ padding: '14px 16px' }}>
                    {new Date(h.sentAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#f3f1ea' }}>{h.title}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#f3f1ea' }}>{h.target}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--accent)' }}>{h.recipientsCount} Users</td>
                  <td style={{ padding: '14px 16px' }}>{h.sentBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
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
            <span style={{ fontSize: '36px', display: 'block', margin: '0 auto' }}>📣</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f3f1ea', margin: 0, fontFamily: 'var(--font-display)' }}>Dispatch Broadcast Alert</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Are you sure you want to send this push notification broadcast to the selected audience? This dispatch cannot be cancelled.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                onClick={() => setConfirmOpen(false)} 
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
                onClick={handleSendBroadcast}
                style={{
                  flex: 1,
                  height: '38px',
                  background: 'var(--accent)',
                  color: '#1a0e08',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Yes, Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminBroadcast
export { AdminBroadcast }
