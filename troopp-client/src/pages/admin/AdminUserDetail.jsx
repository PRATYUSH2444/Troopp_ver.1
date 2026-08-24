import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * Detailed administration view for specific traveler profiles.
 * Executes bans, suspensions, unsuspensions, and manual trust override inputs.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminUserDetail = () => {
  const { id: userId } = useParams()
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState(null)
  
  // Modals state
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspendDays, setSuspendDays] = useState('30')
  const [suspendReason, setSuspendReason] = useState('')

  const [banOpen, setBanOpen] = useState(false)
  const [banReason, setBanReason] = useState('')

  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideScore, setOverrideScore] = useState('50')
  const [overrideReason, setOverrideReason] = useState('')

  const [actionLoading, setActionLoading] = useState(false)

  const fetchUserData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(`/admin/users/${userId}`)
      if (!res.ok) throw new Error(`User not found (Status: ${res.status})`)
      const json = await res.json()
      if (json.success && json.data) {
        setUserData(json.data)
      } else {
        throw new Error(json.message || 'Failed retrieving user profile')
      }
    } catch (err) {
      console.error('Failed retrieving traveler detail profile:', err)
      if (!userData) {
        setError(err.message || 'Unable to load traveler account details.')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, userData])

  useEffect(() => {
    fetchUserData()

    const handleLiveUpdate = () => {
      fetchUserData(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchUserData])

  const handleSuspendSubmit = async () => {
    if (!suspendReason.trim()) {
      toast.error('Please enter a reason for suspension.')
      return
    }
    setActionLoading(true)
    try {
      const res = await apiRequest(`/admin/users/${userId}/suspend`, {
        method: 'PUT',
        body: JSON.stringify({ days: suspendDays, reason: suspendReason })
      })
      if (!res.ok) throw new Error('Failed to suspend user')
      toast.success(`User suspended for ${suspendDays} days.`)
      setSuspendOpen(false)
      setSuspendReason('')
      fetchUserData(true)
    } catch (err) {
      toast.error(err.message || 'Failed suspending user.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    if (!window.confirm('Are you sure you want to lift the suspension for this user?')) return
    setActionLoading(true)
    try {
      const res = await apiRequest(`/admin/users/${userId}/unsuspend`, { method: 'PUT' })
      if (!res.ok) throw new Error('Failed to restore user')
      toast.success('User suspension lifted successfully.')
      fetchUserData(true)
    } catch (err) {
      toast.error(err.message || 'Failed lifting suspension.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBanSubmit = async () => {
    if (!banReason.trim()) {
      toast.error('Please enter a justification for permanent ban.')
      return
    }
    setActionLoading(true)
    try {
      const res = await apiRequest(`/admin/users/${userId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ reason: banReason })
      })
      if (!res.ok) throw new Error('Failed to ban user')
      toast.success('User permanently banned.')
      setBanOpen(false)
      setBanReason('')
      fetchUserData(true)
    } catch (err) {
      toast.error(err.message || 'Failed banning user.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOverrideSubmit = async () => {
    if (!overrideReason.trim()) {
      toast.error('Please enter a reason for trust score override.')
      return
    }
    setActionLoading(true)
    try {
      const res = await apiRequest(`/admin/users/${userId}/override-trust`, {
        method: 'PUT',
        body: JSON.stringify({ newScore: overrideScore, reason: overrideReason })
      })
      if (!res.ok) throw new Error('Failed to override trust score')
      toast.success(`Trust score overridden to ${overrideScore} pts.`)
      setOverrideOpen(false)
      setOverrideReason('')
      fetchUserData(true)
    } catch (err) {
      toast.error(err.message || 'Failed overriding trust score.')
    } finally {
      setActionLoading(false)
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

  const { user, scoreHistory, trustLogs, trips, reportsReceived } = userData

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
      
      {/* Header back navigation */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '16px'
        }}
      >
        <button
          onClick={() => navigate('/admin/users')}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f3f1ea',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background 150ms'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-raised)' }}
        >
          ←
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Administrative Panel
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '4px 0 0 0', color: '#f3f1ea' }}>
            Traveler Profile Oversight
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Action Commands */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <Avatar size="lg" name={user.name} score={user.trustScore} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f3f1ea', margin: 0, fontFamily: 'var(--font-display)' }}>{user.name}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{user.email}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{user.phone}</span>
            </div>
            
            <p 
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                padding: '12px',
                borderRadius: '10px',
                width: '100%',
                margin: 0
              }}
            >
              "{user.bio || 'No traveler bio written yet.'}"
            </p>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Account status</span>
              <span style={{ fontWeight: '800', textTransform: 'uppercase', color: 'var(--moss)' }}>{user.account_status}</span>
            </div>
          </div>

          {/* Action triggers */}
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', margin: '0 0 6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
              Moderation Commands
            </h4>
            {user.account_status === 'suspended' ? (
              <button
                disabled={actionLoading}
                onClick={handleUnsuspend}
                style={{
                  height: '42px',
                  width: '100%',
                  background: 'var(--moss)',
                  color: '#1a0e08',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 150ms'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                ✅ Lift Account Suspension
              </button>
            ) : (
              <button
                disabled={actionLoading || user.account_status === 'banned'}
                onClick={() => setSuspendOpen(true)}
                style={{
                  height: '42px',
                  width: '100%',
                  background: 'var(--amber)',
                  color: '#1a0e08',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 150ms',
                  opacity: user.account_status === 'banned' ? 0.4 : 1
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                ⚠️ Temporarily Suspend User
              </button>
            )}
            {user.account_status !== 'banned' && (
              <button
                disabled={actionLoading}
                onClick={() => setBanOpen(true)}
                style={{
                  height: '42px',
                  width: '100%',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 150ms'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                🚫 Permanently Ban Account
              </button>
            )}
            <button
              onClick={() => {
                setOverrideScore(user.trustScore.toString())
                setOverrideOpen(true)
              }}
              style={{
                height: '42px',
                width: '100%',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                color: '#f3f1ea',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'background 150ms'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-raised)' }}
            >
              🛠️ Override Trust Score
            </button>
          </div>
        </div>

        {/* Center Column: Recharts Line plot and score history timeline */}
        <div className="lg:col-span-2 flex flex-col gap-5">
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
              Trust Score History Progress (Last 30 Days)
            </h4>
            <div style={{ height: '192px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreHistory}>
                  <XAxis dataKey="date" stroke="#9ba6ad" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ba6ad" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline of score log items */}
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
              Score Adjustment Logs (Timeline)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trustLogs.map((log) => (
                <div 
                  key={log.id} 
                  style={{
                    background: 'var(--surface-raised)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '700', color: '#f3f1ea', textTransform: 'capitalize' }}>{log.reason.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {new Date(log.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{ fontWeight: '800', color: log.delta >= 0 ? 'var(--moss)' : 'var(--danger)' }}>
                    {log.delta >= 0 ? `+${log.delta}` : log.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Trips list section & reports received */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
            Registered Trips ({trips.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trips.map((t) => (
              <div 
                key={t.id} 
                style={{
                  background: 'var(--surface-raised)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '700', color: '#f3f1ea' }}>{t.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', textTransform: 'capitalize' }}>
                    Role: {t.role} · Status: {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
            Grievance Reports Filed Against User ({reportsReceived.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reportsReceived.map((r) => (
              <div 
                key={r.id} 
                style={{
                  background: 'var(--danger-soft)',
                  border: '1px solid rgba(255,84,112,0.2)',
                  padding: '14px',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', color: 'var(--danger)' }}>Reason: {r.reason}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Filed by {r.reporterName}</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{r.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suspend Modal Dialog */}
      {suspendOpen && (
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
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--amber)', margin: 0, fontFamily: 'var(--font-display)' }}>Suspend Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Select Duration</span>
                <select
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value)}
                  style={{
                    height: '38px',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0 8px',
                    color: '#f3f1ea',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="7" style={{ background: '#1a2129', color: '#f3f1ea' }}>7 Days</option>
                  <option value="30" style={{ background: '#1a2129', color: '#f3f1ea' }}>30 Days</option>
                  <option value="90" style={{ background: '#1a2129', color: '#f3f1ea' }}>90 Days</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Reason for Suspension</span>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Guidelines violation details..."
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
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                onClick={() => setSuspendOpen(false)} 
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
                disabled={!suspendReason.trim()}
                onClick={handleSuspendSubmit}
                style={{
                  flex: 1,
                  height: '38px',
                  background: 'var(--amber)',
                  color: '#1a0e08',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: !suspendReason.trim() ? 0.4 : 1
                }}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal Dialog */}
      {banOpen && (
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
            <span style={{ fontSize: '36px', display: 'block', margin: '0 auto' }}>🚫</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', margin: 0, fontFamily: 'var(--font-display)' }}>Permanent Ban</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Are you sure you want to permanently ban {user.name}? This cannot be undone.
              </p>
            </div>
            <textarea
              rows={2}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Mandatory reason for ban..."
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
                onClick={() => setBanOpen(false)} 
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
                disabled={!banReason.trim()}
                onClick={handleBanSubmit}
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
                  opacity: !banReason.trim() ? 0.4 : 1
                }}
              >
                Yes, Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Score Override Modal Dialog */}
      {overrideOpen && (
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
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f3f1ea', margin: 0, fontFamily: 'var(--font-display)' }}>Override Trust Score</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Target Score (0-100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  style={{
                    height: '38px',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0 8px',
                    color: '#f3f1ea',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Justification for override</span>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Mandatory auditor note..."
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
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                onClick={() => setOverrideOpen(false)} 
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
                disabled={!overrideReason.trim()}
                onClick={handleOverrideSubmit}
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
                  opacity: !overrideReason.trim() ? 0.4 : 1
                }}
              >
                Override Score
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminUserDetail
export { AdminUserDetail }
