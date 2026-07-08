import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Administrative KPI and Analytics Dashboard.
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
          verifiedPct: 68.4,
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
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-white">
        <Spinner size="lg" />
      </div>
    )
  }

  const { kpis, signupHistory, trustScoreHistory, cityBreakdown } = dashboardData

  return (
    <div className="p-6 text-white bg-stone-950 min-h-screen flex flex-col gap-6 font-sans">
      
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Administrative Panel</span>
          <h2 className="text-xl font-black mt-0.5">Control Center Overview</h2>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            fetchDashboardData()
          }}
          className="h-10 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold transition-all shadow"
        >
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* KPI: Total Users */}
        <div className="glass-card bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Total Users</span>
          <span className="text-2xl font-black mt-2">{kpis.totalUsers}</span>
          <span className="text-[9px] text-emerald-400 font-bold mt-1">↑ 12% Month</span>
        </div>

        {/* KPI: ID Verified % */}
        <div className="glass-card bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">KYC Verified</span>
          <span className="text-2xl font-black mt-2">{kpis.verifiedPct}%</span>
          <span className="text-[9px] text-emerald-400 font-bold mt-1">↑ 4.2% Week</span>
        </div>

        {/* KPI: Active Trips */}
        <div className="glass-card bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Active Trips</span>
          <span className="text-2xl font-black mt-2">{kpis.activeTrips}</span>
          <span className="text-[9px] text-emerald-400 font-bold mt-1">↑ 8% Today</span>
        </div>

        {/* KPI: Pending Reports */}
        <div className="glass-card bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Pending Reports</span>
          <span className="text-2xl font-black mt-2 text-rose-500">{kpis.pendingReports}</span>
          <span className="text-[9px] text-rose-400 font-bold mt-1">🚨 Needs review</span>
        </div>

        {/* KPI: New Signups Today */}
        <div className="glass-card bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Signups Today</span>
          <span className="text-2xl font-black mt-2">{kpis.newSignupsToday}</span>
          <span className="text-[9px] text-emerald-400 font-bold mt-1">↑ 22% Peak</span>
        </div>

        {/* KPI: Average Trust Score */}
        <div className="glass-card bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Avg Trust Score</span>
          <span className="text-2xl font-black mt-2">{kpis.avgTrustScore}</span>
          <span className="text-[9px] text-emerald-400 font-bold mt-1">✓ Stable score</span>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Signups Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            User Registration Trends (Last 30 Days)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupHistory}>
                <XAxis dataKey="date" stroke="#A8A29E" fontSize={10} tickLine={false} />
                <YAxis stroke="#A8A29E" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', border: '1px solid #444', color: '#fff' }} />
                <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trust Score over time Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Average Platform Trust Score Over Time
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trustScoreHistory}>
                <XAxis dataKey="date" stroke="#A8A29E" fontSize={10} tickLine={false} />
                <YAxis stroke="#A8A29E" fontSize={10} tickLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', border: '1px solid #444', color: '#fff' }} />
                <Line type="monotone" dataKey="avgScore" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* City Breakdown Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          City breakdown breakdown metrics
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10">
              <tr>
                <th className="pb-3">City Name</th>
                <th className="pb-3">Total Users</th>
                <th className="pb-3">Active Trips</th>
                <th className="pb-3">Completed Trips</th>
                <th className="pb-3">Reported Users Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cityBreakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 font-bold text-white">{row.city}</td>
                  <td className="py-3.5">{row.users}</td>
                  <td className="py-3.5">{row.activeTrips}</td>
                  <td className="py-3.5">{row.completedTrips}</td>
                  <td className="py-3.5 text-rose-400 font-bold">{row.reportedUsersPct}%</td>
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
