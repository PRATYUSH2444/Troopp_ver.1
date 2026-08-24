import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * Detailed Platform Analytics and Visualizations.
 * Connected directly to real PostgreSQL database and real-time WebSockets.
 */
const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [dateRange, setDateRange] = useState('30')

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(`/admin/analytics?days=${dateRange}`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const json = await res.json()

      if (json.success && json.data) {
        setAnalyticsData(json.data)
      } else {
        throw new Error(json.message || 'Failed fetching analytics data')
      }
    } catch (err) {
      console.error('Failed retrieving admin analytics:', err)
      if (!analyticsData) {
        setError(err.message || 'Unable to connect to analytics service.')
      }
    } finally {
      setLoading(false)
    }
  }, [dateRange, analyticsData])

  useEffect(() => {
    fetchAnalytics()

    const handleLiveUpdate = () => {
      fetchAnalytics(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)
    return () => window.removeEventListener('admin:live_update', handleLiveUpdate)
  }, [fetchAnalytics])

  if (loading && !analyticsData) {
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

  if (error && !analyticsData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-primary)' }}>
        <span style={{ fontSize: '36px' }}>📊</span>
        <h3 style={{ margin: '12px 0 6px', color: '#f3f1ea' }}>Failed to Load Analytics</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</p>
        <button
          onClick={() => fetchAnalytics()}
          style={{
            marginTop: '12px',
            height: '38px',
            padding: '0 20px',
            background: 'var(--accent)',
            color: '#1a0e08',
            fontWeight: '700',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const dauHistory = analyticsData?.dauHistory || []
  const tripsHistory = analyticsData?.tripsHistory || []
  const cityComparison = analyticsData?.cityComparison || []

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
            Platform Analytics Center
          </h2>
        </div>
        
        {/* Date Filter selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
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
          <option value="7" style={{ background: '#1a2129', color: '#f3f1ea' }}>Last 7 Days</option>
          <option value="30" style={{ background: '#1a2129', color: '#f3f1ea' }}>Last 30 Days</option>
          <option value="90" style={{ background: '#1a2129', color: '#f3f1ea' }}>Last 90 Days</option>
        </select>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* DAU Chart */}
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
            Daily Active Users (DAU)
          </h4>
          <div style={{ height: '256px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dauHistory}>
                <XAxis dataKey="date" stroke="#9ba6ad" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ba6ad" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="dau" stroke="var(--moss)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trips Created Chart */}
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
            Trips Created
          </h4>
          <div style={{ height: '256px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripsHistory}>
                <XAxis dataKey="date" stroke="#9ba6ad" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ba6ad" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* City Comparison Table */}
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
          City Comparative Metrics
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
                <th style={{ padding: '12px 16px' }}>City Name</th>
                <th style={{ padding: '12px 16px' }}>Total Signups</th>
                <th style={{ padding: '12px 16px' }}>Trips Posted</th>
                <th style={{ padding: '12px 16px' }}>Completion Rate</th>
              </tr>
            </thead>
            <tbody style={{ divideY: '1px solid rgba(255,255,255,0.04)' }}>
              {cityComparison.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                  className="hover:bg-white/[0.02]"
                >
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#f3f1ea' }}>{row.city}</td>
                  <td style={{ padding: '14px 16px' }}>{row.signups}</td>
                  <td style={{ padding: '14px 16px' }}>{row.trips}</td>
                  <td style={{ padding: '14px 16px', fontBold: '700', color: 'var(--moss)', fontWeight: '700' }}>{row.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default AdminAnalytics
export { AdminAnalytics }
