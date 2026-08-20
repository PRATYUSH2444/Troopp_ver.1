import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Administrative KPI and Analytics Dashboard.
 * Overhauled to match the premium dark moody theme.
 */
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)

  const fetchDashboardData = async () => {
    try {
      // Mock API dispatch: axios.get('/api/v1/admin/dashboard')
      await new Promise((r) => setTimeout(r, 400)) // Latency simulation

      setDashboardData({
        kpis: {
          totalUsers: 1420,
          activeTrips: 45,
          pendingReports: 3,
          newSignupsToday: 18,
          avgTrustScore: 78.2
        },
        signupHistory: [
          { date: '06/20', count: 8 },
          { date: '06/25', count: 12 },
          { date: '06/30', count: 15 },
          { date: '07/05', count: 18 }
        ],
        trustScoreHistory: [
          { date: '06/20', avgScore: 74.5 },
          { date: '06/25', avgScore: 75.8 },
          { date: '06/30', avgScore: 77.1 },
          { date: '07/05', avgScore: 78.2 }
        ],
        cityBreakdown: [
          { city: 'Mumbai', users: 620, activeTrips: 18, completedTrips: 84, reportedUsersPct: 1.2 },
          { city: 'Pune', users: 480, activeTrips: 15, completedTrips: 62, reportedUsersPct: 0.8 },
          { city: 'Bangalore', users: 320, activeTrips: 12, completedTrips: 41, reportedUsersPct: 2.1 }
        ]
      })
    } catch (err) {
      console.error('Failed retrieving admin dashboard metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh metrics every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

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

  const { kpis, signupHistory, trustScoreHistory, cityBreakdown } = dashboardData

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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
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
          <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
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
