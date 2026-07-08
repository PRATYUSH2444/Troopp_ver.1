import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Platform Activities oversight and cancellation panel.
 */
const AdminActivities = () => {
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  
  // Filters parameters
  const [statusFilter, setStatusFilter] = useState('all')

  // Cancellation Modal
  const [cancelTrip, setCancelTrip] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const fetchActivities = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/activities')
      await new Promise((r) => setTimeout(r, 450))

      setActivities([
        {
          id: 'act-1',
          title: 'Secret Wild Forest Drinking Party',
          creatorName: 'Vikram Malhotra',
          city: 'Pune',
          type: 'Adventure',
          status: 'active',
          membersCount: 4,
          maxMembers: 8,
          dateTime: '2026-07-22T06:00:00Z'
        },
        {
          id: 'act-2',
          title: 'Stargazing Camp & Lake BBQ Pune',
          creatorName: 'Priya Sharma',
          city: 'Pune',
          type: 'Camping',
          status: 'completed',
          membersCount: 8,
          maxMembers: 10,
          dateTime: '2026-06-12T14:00:00Z'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving activities oversight:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleCancelSubmit = async () => {
    if (!cancelTrip || !cancelReason.trim()) return

    try {
      // Mock API cancel: axios.put(`/api/v1/admin/activities/${cancelTrip.id}/cancel`, { reason: cancelReason })
      await new Promise((r) => setTimeout(r, 400))

      setActivities((prev) =>
        prev.map((a) => (a.id === cancelTrip.id ? { ...a, status: 'cancelled' } : a))
      )

      alert('Activity successfully cancelled. Members notified.')
      setCancelTrip(null)
      setCancelReason('')
    } catch (err) {
      console.error('Failed cancelling activity:', err)
    }
  }

  const filteredActivities = activities.filter((a) => {
    if (statusFilter === 'all') return true
    return a.status === statusFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-white">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 text-white bg-stone-950 min-h-screen flex flex-col gap-5 font-sans">
      
      {/* Header title */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Administrative Panel</span>
          <h2 className="text-xl font-black mt-0.5">Platform Activities Oversight</h2>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'all' ? 'bg-primary text-white shadow' : 'bg-white/5 text-stone-400 hover:text-white'
          }`}
        >
          All Trips
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'active' ? 'bg-emerald-700 text-white shadow' : 'bg-white/5 text-stone-400 hover:text-white'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'completed' ? 'bg-stone-700 text-white shadow' : 'bg-white/5 text-stone-400 hover:text-white'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Grid details list */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4">Trip Title</th>
                <th className="p-4">Host / Creator</th>
                <th className="p-4">City</th>
                <th className="p-4">Type</th>
                <th className="p-4">Members</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredActivities.map((a) => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{a.title}</td>
                  <td className="p-4">{a.creatorName}</td>
                  <td className="p-4">{a.city}</td>
                  <td className="p-4">{a.type}</td>
                  <td className="p-4 font-bold">
                    {a.membersCount} / {a.maxMembers}
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      a.status === 'active' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' :
                      a.status === 'completed' ? 'bg-blue-950/20 text-blue-400 border border-blue-500/20' :
                      'bg-stone-800 text-stone-400'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/trip-rooms/${a.id}`)}
                        className="h-8 px-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                      >
                        Enter Room 💬
                      </button>
                      {a.status === 'active' && (
                        <button
                          onClick={() => setCancelTrip(a)}
                          className="h-8 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel confirm modal */}
      {cancelTrip && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-xl flex flex-col gap-4 text-center">
            <span className="text-3xl text-rose-500 block">🛑</span>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Cancel Activity</h4>
              <p className="text-[11px] text-stone-400">
                Are you sure you want to cancel the activity "{cancelTrip.title}"?
              </p>
            </div>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Mandatory cancellation reason..."
              className="w-full bg-stone-950 border border-white/10 rounded-xl p-2 text-xs resize-none outline-none text-white focus:border-rose-500 text-left"
            />
            <div className="flex gap-2 border-t border-white/10 pt-3">
              <button onClick={() => setCancelTrip(null)} className="flex-1 h-10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors">
                Close
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={handleCancelSubmit}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminActivities
export { AdminActivities }
