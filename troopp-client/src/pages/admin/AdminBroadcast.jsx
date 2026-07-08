import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Administrative Push Broadcast Center. Sends targeted push alerts.
 */
const AdminBroadcast = () => {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  
  // Form parameters
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('all') // 'all' | 'city'
  const [selectedCity, setSelectedCity] = useState('')

  // Confirmation Modal
  const [confirmOpen, setConfirmOpen] = useState(false)

  const fetchHistory = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/broadcasts')
      await new Promise((r) => setTimeout(r, 400))

      setHistory([
        {
          id: 'bc-1',
          title: '🌧️ Monsoon Trek Safety Advisory',
          target: 'All Users',
          recipientsCount: 1420,
          sentBy: 'Admin Priya',
          sentAt: '2026-07-06T10:00:00Z'
        },
        {
          id: 'bc-2',
          title: '🚨 Mumbai Central Track Disruptions Warning',
          target: 'Mumbai City Only',
          recipientsCount: 620,
          sentBy: 'Admin Raj',
          sentAt: '2026-07-04T15:30:00Z'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving broadcasts history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleSendBroadcast = async () => {
    try {
      // Mock API post: axios.post('/api/v1/admin/broadcast', { title, body, target, cityId: selectedCity })
      await new Promise((r) => setTimeout(r, 450))

      alert('Broadcast push notifications sent successfully.')
      setConfirmOpen(false)
      setTitle('')
      setBody('')
      fetchHistory()
    } catch (err) {
      console.error('Failed sending broadcast:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-white">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 text-white bg-stone-950 min-h-screen flex flex-col gap-6 font-sans">
      
      {/* Header title */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Administrative Panel</span>
          <h2 className="text-xl font-black mt-0.5">Push Notification Broadcast Center</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Broadcast Form & Live Preview */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 pb-2 border-b border-white/5">
              Draft Message Campaign
            </h4>

            {/* Campaign title */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between font-bold text-stone-300">
                <span>Notification Title</span>
                <span className="text-stone-500">{title.length} / 100</span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Monsoon trail heavy rain alert..."
                className="h-10 bg-stone-900 border border-white/10 rounded-xl px-3 outline-none text-white focus:border-primary"
              />
            </div>

            {/* Campaign description */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between font-bold text-stone-300">
                <span>Notification Body Description</span>
                <span className="text-stone-500">{body.length} / 500</span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Alert text details..."
                className="bg-stone-900 border border-white/10 rounded-xl p-3 resize-none outline-none text-white focus:border-primary"
              />
            </div>

            {/* Target Audience radio options */}
            <div className="flex flex-col gap-2 text-xs">
              <span className="font-bold text-stone-300">Target Audience Scope</span>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="target"
                    checked={target === 'all'}
                    onChange={() => setTarget('all')}
                    className="accent-primary"
                  />
                  <span>All Registered Users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="target"
                    checked={target === 'city'}
                    onChange={() => setTarget('city')}
                    className="accent-primary"
                  />
                  <span>Specific City Target</span>
                </label>
              </div>

              {target === 'city' && (
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="mt-2 h-10 bg-stone-900 border border-white/10 rounded-xl px-2 outline-none text-white focus:border-primary w-full max-w-xs"
                >
                  <option value="">Select Target City</option>
                  <option value="city-1">Mumbai</option>
                  <option value="city-2">Pune</option>
                </select>
              )}
            </div>

            <button
              disabled={!title.trim() || !body.trim() || (target === 'city' && !selectedCity)}
              onClick={() => setConfirmOpen(true)}
              className="mt-3 h-11 bg-primary hover:bg-primary-dark disabled:bg-stone-850 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              📣 Schedule Broadcast push Alert
            </button>
          </div>
        </div>

        {/* Right Column: Live Mock Preview screen */}
        <div className="flex flex-col gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 pb-1 border-b border-white/5">
              Live Mock Preview
            </h4>
            
            {/* Phone Shell mock */}
            <div className="border border-white/10 bg-stone-900 rounded-3xl p-4 flex flex-col gap-3 max-w-[240px] mx-auto shadow-inner text-xs">
              <span className="text-[8px] text-stone-500 font-bold block text-center uppercase tracking-widest">Smartphone Notification</span>
              
              <div className="bg-stone-950 border border-white/5 p-3 rounded-2xl flex gap-2.5 items-start">
                <span className="text-lg">⛺</span>
                <div className="flex flex-col gap-0.5 truncate">
                  <span className="font-extrabold text-white text-[10px] truncate">{title || 'Monsoon rain alerts'}</span>
                  <p className="text-[8px] text-stone-400 leading-snug break-words">
                    {body || 'Description details will be rendered here for user previews.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Campaign Broadcast logs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Campaign Broadcast Dispatch Logs
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10">
              <tr>
                <th className="pb-3">Send Date</th>
                <th className="pb-3">Campaign Title</th>
                <th className="pb-3">Audience Target</th>
                <th className="pb-3">Recipients Count</th>
                <th className="pb-3">Sent By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5">
                    {new Date(h.sentAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-3.5 font-bold text-white">{h.title}</td>
                  <td className="py-3.5 font-bold">{h.target}</td>
                  <td className="py-3.5 font-extrabold text-primary">{h.recipientsCount} Users</td>
                  <td className="py-3.5 text-stone-400">{h.sentBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-xl flex flex-col gap-4 text-center">
            <span className="text-3xl text-primary block">📣</span>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Dispatch Broadcast Alert</h4>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Are you sure you want to send this push notification broadcast to the selected audience? This dispatch cannot be cancelled.
              </p>
            </div>
            <div className="flex gap-2 border-t border-white/10 pt-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 h-10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                className="flex-1 h-10 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all"
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
