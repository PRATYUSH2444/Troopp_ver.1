import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Detailed Platform Analytics and Visualizations.
 * Overhauled to match the premium dark moody theme.
 */
const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [dateRange, setDateRange] = useState('30')

  const fetchAnalytics = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/analytics')
      await new Promise((r) => setTimeout(r, 450))

      setAnalyticsData({
        dauHistory: [
          { date: '06/20', dau: 180 },
          { date: '06/25', dau: 210 },
          { date: '06/30', dau: 240 },
          { date: '07/05', dau: 310 }
        ],
        tripsHistory: [
          { date: '06/20', count: 5 },
          { date: '06/25', count: 8 },
          { date: '06/30', count: 12 },
          { date: '07/05', count: 18 }
        ],
        cityComparison: [
          { city: 'Mumbai', signups: 120, trips: 18, completionRate: 94 },
          { city: 'Pune', signups: 98, trips: 15, completionRate: 91 },
          { city: 'Bangalore', signups: 84, trips: 12, completionRate: 88 }
        ]
      })
    } catch (err) {
      console.error('Failed retrieving admin analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

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

  const { dauHistory, tripsHistory, cityComparison } = analyticsData

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
