import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Administrative Audit Logs. Immutable records of administrative actions.
 */
const AdminLogs = () => {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [actionFilter, setActionFilter] = useState('all')

  const fetchLogs = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/logs')
      await new Promise((r) => setTimeout(r, 450))

      setLogs([
        {
          id: 'log-1',
          createdAt: '2026-07-06T11:00:00Z',
          adminName: 'Admin Priya',
          action: 'add_ip_block',
          target_type: 'ip_block',
          target_id: 'block-1',
          details: 'IP: 192.168.1.120. Reason: DDoS attempts and socket request spamming.'
        },
        {
          id: 'log-2',
          createdAt: '2026-07-06T10:00:00Z',
          adminName: 'Admin Priya',
          action: 'approve_verification',
          target_type: 'user',
          target_id: 'user-3',
          details: 'KYC approved for Vikram Malhotra.'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving administrative audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((l) => {
    if (actionFilter === 'all') return true
    return l.action === actionFilter
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
          <h2 className="text-xl font-black mt-0.5">Administrative Audit Logs</h2>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex gap-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-10 bg-stone-900 border border-white/10 rounded-xl px-2 outline-none text-xs text-white max-w-xs"
        >
          <option value="all">Filter Action: All Audit Logs</option>
          <option value="add_ip_block">IP Blocked</option>
          <option value="approve_verification">Approve KYC</option>
          <option value="suspend_user">Suspend Traveler</option>
          <option value="ban_user">Ban Traveler</option>
        </select>
      </div>

      {/* Logs Data Grid */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Administrator</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Target Class</th>
                <th className="p-4 font-bold">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-stone-400">
                    {new Date(l.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 font-bold text-white">{l.adminName}</td>
                  <td className="p-4">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-white font-bold uppercase tracking-wide">
                      {l.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-stone-400 font-bold capitalize">{l.target_type}</td>
                  <td className="p-4 max-w-md break-words text-stone-200">{l.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-stone-500 font-bold">
                    No matching audit log records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default AdminLogs
export { AdminLogs }
