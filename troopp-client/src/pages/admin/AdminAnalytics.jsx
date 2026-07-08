import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Detailed Platform Analytics and Visualizations.
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
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-white">
        <Spinner size="lg" />
      </div>
    )
  }

  const { dauHistory, tripsHistory, cityComparison } = analyticsData

  return (
    <div className="p-6 text-white bg-stone-950 min-h-screen flex flex-col gap-6 font-sans">
      
      {/* Header title */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Administrative Panel</span>
          <h2 className="text-xl font-black mt-0.5">Platform Analytics Center</h2>
        </div>
        
        {/* Date Filter selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="h-10 bg-stone-900 border border-white/10 rounded-xl px-2 outline-none text-xs text-white"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* DAU Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Daily Active Users (DAU)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dauHistory}>
                <XAxis dataKey="date" stroke="#A8A29E" fontSize={10} tickLine={false} />
                <YAxis stroke="#A8A29E" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', border: '1px solid #444', color: '#fff' }} />
                <Line type="monotone" dataKey="dau" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trips Created Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Trips Created
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripsHistory}>
                <XAxis dataKey="date" stroke="#A8A29E" fontSize={10} tickLine={false} />
                <YAxis stroke="#A8A29E" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', border: '1px solid #444', color: '#fff' }} />
                <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* City Comparison Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          City Comparative Metrics
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10">
              <tr>
                <th className="pb-3">City Name</th>
                <th className="pb-3">Total Signups</th>
                <th className="pb-3">Trips Posted</th>
                <th className="pb-3">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cityComparison.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 font-bold text-white">{row.city}</td>
                  <td className="py-3.5">{row.signups}</td>
                  <td className="py-3.5">{row.trips}</td>
                  <td className="py-3.5 font-bold text-emerald-400">{row.completionRate}%</td>
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
