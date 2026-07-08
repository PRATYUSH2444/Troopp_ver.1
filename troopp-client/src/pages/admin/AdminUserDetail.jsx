import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'

/**
 * Detailed administration view for specific traveler profiles.
 * Executes bans, suspensions, and manual trust override inputs.
 */
const AdminUserDetail = () => {
  const { id: userId } = useParams()
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
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

  const fetchUserData = async () => {
    try {
      // Mock API detail: axios.get(`/api/v1/admin/users/${userId}`)
      await new Promise((r) => setTimeout(r, 500))

      setUserData({
        user: {
          id: userId,
          name: 'Raj Malhotra',
          email: 'raj@gmail.com',
          phone: '+91 9876543210',
          city: 'Mumbai',
          trustScore: 80,
          reliabilityScore: 98,
          account_status: 'active',
          is_id_verified: true,
          bio: 'Avid monsoon trekker and campfire enthusiast.'
        },
        scoreHistory: [
          { date: '06/01', score: 50 },
          { date: '06/10', score: 65 },
          { date: '06/20', score: 77 },
          { date: '07/01', score: 80 }
        ],
        trustLogs: [
          { id: '1', reason: 'id_verified', delta: 30, createdAt: '2026-06-10T10:00:00Z' },
          { id: '2', reason: 'rating_positive', delta: 3, createdAt: '2026-06-20T18:00:00Z' },
          { id: '3', reason: 'rating_positive', delta: 3, createdAt: '2026-07-01T15:30:00Z' }
        ],
        trips: [
          { id: 'trip-1', title: 'Harishchandragad Monsoon Trek', date: '2026-07-15T06:00:00Z', role: 'creator', status: 'upcoming' },
          { id: 'trip-2', title: 'Rajmachi Stargazing Camp', date: '2026-06-12T14:00:00Z', role: 'member', status: 'completed' }
        ],
        reportsFiled: [],
        reportsReceived: [
          { id: 'rep-1', reporterName: 'Anon Traveler', reason: 'Late arrival', details: 'Arrived 1 hour late at the railway station.', status: 'resolved' }
        ]
      })
    } catch (err) {
      console.error('Failed retrieving traveler detail profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const handleSuspendSubmit = async () => {
    try {
      // Mock API suspend: axios.put(`/api/v1/admin/users/${userId}/suspend`, { days: suspendDays, reason: suspendReason })
      await new Promise((r) => setTimeout(r, 400))
      setSuspendOpen(false)
      alert(`User suspended for ${suspendDays} days.`)
      fetchUserData()
    } catch (err) {
      console.error('Failed suspending user:', err)
    }
  }

  const handleBanSubmit = async () => {
    try {
      // Mock API ban: axios.put(`/api/v1/admin/users/${userId}/ban`, { reason: banReason })
      await new Promise((r) => setTimeout(r, 400))
      setBanOpen(false)
      alert('User permanently banned.')
      navigate('/admin/users')
    } catch (err) {
      console.error('Failed banning user:', err)
    }
  }

  const handleOverrideSubmit = async () => {
    try {
      // Mock API override: axios.put(`/api/v1/admin/users/${userId}/override-trust`, { newScore: overrideScore, reason: overrideReason })
      await new Promise((r) => setTimeout(r, 400))
      setOverrideOpen(false)
      alert('Trust score updated successfully.')
      fetchUserData()
    } catch (err) {
      console.error('Failed overriding trust score:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-white">
        <Spinner size="lg" />
      </div>
    )
  }

  const { user, scoreHistory, trustLogs, trips, reportsReceived } = userData

  return (
    <div className="p-6 text-white bg-stone-950 min-h-screen flex flex-col gap-6 font-sans">
      
      {/* Header back navigation */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white text-xs font-bold transition-all"
        >
          ←
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Administrative Panel</span>
          <h2 className="text-xl font-black mt-0.5">Traveler Profile Oversight</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Action Commands */}
        <div className="flex flex-col gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-lg items-center text-center">
            <Avatar size="lg" name={user.name} score={user.trustScore} />
            <div className="flex flex-col mt-2">
              <h3 className="text-sm font-black text-white">{user.name}</h3>
              <span className="text-[10px] text-stone-400 mt-0.5">{user.email}</span>
              <span className="text-[10px] text-stone-400 mt-0.5">{user.phone}</span>
            </div>
            
            <p className="text-[10px] text-stone-300 leading-relaxed font-medium bg-white/5 p-3 rounded-xl w-full">
              "{user.bio || 'No traveler bio written yet.'}"
            </p>

            <div className="w-full flex justify-between items-center border-t border-white/10 pt-4 text-xs">
              <span className="text-stone-400">Account status</span>
              <span className="font-extrabold uppercase text-emerald-400">{user.account_status}</span>
            </div>
          </div>

          {/* Action triggers */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 pb-2 border-b border-white/5">
              Moderation Commands
            </h4>
            <button
              onClick={() => setSuspendOpen(true)}
              className="h-10 w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              ⚠️ Temporarily Suspend User
            </button>
            <button
              onClick={() => setBanOpen(true)}
              className="h-10 w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              🚫 Permanently Ban Account
            </button>
            <button
              onClick={() => {
                setOverrideScore(user.trustScore.toString())
                setOverrideOpen(true)
              }}
              className="h-10 w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold transition-all"
            >
              🛠️ Override Trust Score
            </button>
          </div>
        </div>

        {/* Center Column: Recharts Line plot and score history timeline */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Trust Score History Progress (Last 30 Days)
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreHistory}>
                  <XAxis dataKey="date" stroke="#A8A29E" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A8A29E" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1C1917', border: '1px solid #444', color: '#fff' }} />
                  <Line type="monotone" dataKey="score" stroke="#F97316" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline of score log items */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Score Adjustment Logs (Timeline)
            </h4>
            <div className="flex flex-col gap-3">
              {trustLogs.map((log) => (
                <div key={log.id} className="bg-white/5 p-3 rounded-xl flex items-center justify-between text-xs border border-white/5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-white capitalize">{log.reason.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] text-stone-400">
                      {new Date(log.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`font-extrabold text-xs ${log.delta >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {log.delta >= 0 ? `+${log.delta}` : log.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Trips list section & reports received */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Registered Trips ({trips.length})
          </h4>
          <div className="flex flex-col gap-2.5">
            {trips.map((t) => (
              <div key={t.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-white">{t.title}</span>
                  <span className="text-[9px] text-stone-400 mt-0.5 capitalize">Role: {t.role} · Status: {t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Grievance Reports Filed Against User ({reportsReceived.length})
          </h4>
          <div className="flex flex-col gap-2.5">
            {reportsReceived.map((r) => (
              <div key={r.id} className="bg-rose-950/10 border border-rose-900/30 p-3.5 rounded-xl flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-rose-400">Reason: {r.reason}</span>
                  <span className="text-[9px] text-stone-400">Filed by {r.reporterName}</span>
                </div>
                <p className="text-[10px] text-stone-300 leading-snug">{r.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suspend Modal Dialog */}
      {suspendOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-xl flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Suspend Account</h4>
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-stone-300">Select Suspension Duration</span>
              <select
                value={suspendDays}
                onChange={(e) => setSuspendDays(e.target.value)}
                className="w-full h-10 bg-stone-950 border border-white/10 rounded-xl px-2 outline-none text-white"
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
              </select>

              <span className="font-bold text-stone-300 mt-2">Reason for Suspension</span>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Guidelines violation details..."
                className="w-full bg-stone-950 border border-white/10 rounded-xl p-2.5 resize-none outline-none text-white focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2 border-t border-white/10 pt-4">
              <button onClick={() => setSuspendOpen(false)} className="flex-1 h-10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                disabled={!suspendReason.trim()}
                onClick={handleSuspendSubmit}
                className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal Dialog */}
      {banOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-xl flex flex-col gap-4 text-center">
            <span className="text-4xl text-rose-500 block">🚫</span>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Permanent Ban</h4>
              <p className="text-[11px] text-stone-400">
                Are you sure you want to permanently ban {user.name}? This cannot be undone.
              </p>
            </div>
            <textarea
              rows={2}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Mandatory reason for ban..."
              className="w-full bg-stone-950 border border-white/10 rounded-xl p-2 text-xs resize-none outline-none text-white focus:border-rose-500 text-left"
            />
            <div className="flex gap-2 border-t border-white/10 pt-3">
              <button onClick={() => setBanOpen(false)} className="flex-1 h-10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                disabled={!banReason.trim()}
                onClick={handleBanSubmit}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Yes, Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Score Override Modal Dialog */}
      {overrideOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-xl flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Override Trust Score</h4>
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-stone-300">Target Score (0-100)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
                className="w-full h-10 bg-stone-950 border border-white/10 rounded-xl px-2 outline-none text-white"
              />

              <span className="font-bold text-stone-300 mt-2">Justification for override</span>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Mandatory auditor note..."
                className="w-full bg-stone-950 border border-white/10 rounded-xl p-2.5 resize-none outline-none text-white focus:border-primary"
              />
            </div>
            <div className="flex gap-2 border-t border-white/10 pt-4">
              <button onClick={() => setOverrideOpen(false)} className="flex-1 h-10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                disabled={!overrideReason.trim()}
                onClick={handleOverrideSubmit}
                className="flex-1 h-10 bg-primary hover:bg-primary-dark disabled:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
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
