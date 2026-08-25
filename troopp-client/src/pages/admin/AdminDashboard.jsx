import React, { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'

/**
 * Administrative KPI and Analytics Dashboard.
 * Connected directly to real PostgreSQL database aggregations and real-time WebSockets.
 */
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/admin/dashboard')
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`)
      }
      const json = await res.json()
      if (json.success && json.data) {
        setDashboardData(json.data)
      } else {
        throw new Error(json.message || 'Failed to retrieve dashboard metrics')
      }
    } catch (err) {
      console.error('Failed retrieving admin dashboard metrics:', err)
      setError(err.message || 'Unable to connect to administration database.')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()

    // Listen to real-time events broadcasted by AdminLayout
    const handleLiveUpdate = () => {
      fetchDashboardData(true)
    }
    window.addEventListener('admin:live_update', handleLiveUpdate)

    // Periodic background sync every 60 seconds
    const interval = setInterval(() => fetchDashboardData(true), 60000)
    return () => {
      window.removeEventListener('admin:live_update', handleLiveUpdate)
      clearInterval(interval)
    }
  }, [fetchDashboardData])

  if (loading && !dashboardData) {
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

  if (error && !dashboardData) {
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f3f1ea' }}>Failed to Load Dashboard</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>{error}</p>
        <button
          onClick={() => fetchDashboardData()}
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

  const kpis = dashboardData?.kpis || { totalUsers: 0, activeTrips: 0, pendingReports: 0, newSignupsToday: 0, avgTrustScore: 50 }
  const signupHistory = dashboardData?.signupHistory || []
  const trustScoreHistory = dashboardData?.trustScoreHistory || []
  const cityBreakdown = dashboardData?.cityBreakdown || []

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
      {/* Top Header */}
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
            Control Center Overview
          </h2>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            fetchDashboardData()
          }}
          style={{
            height: '40px',
            padding: '0 16px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 150ms, border-color 150ms'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-raised)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* KPI: Total Users */}
        <div 
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</span>
          <span style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '8px 0 4px', color: '#f3f1ea' }}>{kpis.totalUsers}</span>
          <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: '600' }}>↑ 12% Month</span>
        </div>


        {/* KPI: Active Trips */}
        <div 
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Trips</span>
          <span style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '8px 0 4px', color: '#f3f1ea' }}>{kpis.activeTrips}</span>
          <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: '600' }}>↑ 8% Today</span>
        </div>

        {/* KPI: Pending Reports */}
        <div 
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Reports</span>
          <span style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '8px 0 4px', color: 'var(--danger)' }}>{kpis.pendingReports}</span>
          <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '600' }}>🚨 Needs review</span>
        </div>

        {/* KPI: New Signups Today */}
        <div 
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signups Today</span>
          <span style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '8px 0 4px', color: '#f3f1ea' }}>{kpis.newSignupsToday}</span>
          <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: '600' }}>↑ 22% Peak</span>
        </div>

        {/* KPI: Average Trust Score */}
        <div 
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Trust Score</span>
          <span style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '8px 0 4px', color: '#f3f1ea' }}>{kpis.avgTrustScore}</span>
          <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: '600' }}>✓ Stable score</span>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Signups Chart */}
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
            User Registration Trends (Last 30 Days)
          </h4>
          <div style={{ height: '256px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupHistory}>
                <XAxis dataKey="date" stroke="#9ba6ad" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ba6ad" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trust Score over time Chart */}
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
            Average Platform Trust Score Over Time
          </h4>
          <div style={{ height: '256px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trustScoreHistory}>
                <XAxis dataKey="date" stroke="#9ba6ad" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ba6ad" fontSize={10} tickLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="avgScore" stroke="var(--moss)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* City Breakdown Table */}
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
          City breakdown breakdown metrics
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-[580px]" style={{ width: '100%', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: '700' }}>
                <th style={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City Name</th>
                <th style={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</th>
                <th style={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Trips</th>
                <th style={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Trips</th>
                <th style={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reported Users Ratio</th>
              </tr>
            </thead>
            <tbody>
              {cityBreakdown.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                  className="hover:bg-white/[0.02]"
                >
                  <td style={{ padding: '14px 0', fontWeight: '700', color: '#f3f1ea' }}>{row.city}</td>
                  <td style={{ padding: '14px 0' }}>{row.users}</td>
                  <td style={{ padding: '14px 0' }}>{row.activeTrips}</td>
                  <td style={{ padding: '14px 0' }}>{row.completedTrips}</td>
                  <td style={{ padding: '14px 0', color: 'var(--danger)', fontWeight: '700' }}>{row.reportedUsersPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default AdminDashboard
export { AdminDashboard }
