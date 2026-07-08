import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * IP Block list and ban override panel.
 */
const AdminIPBlocks = () => {
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState([])
  
  // Form parameters
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')
  const [expiry, setExpiry] = useState('')

  const fetchIPBlocks = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/ip-blocks')
      await new Promise((r) => setTimeout(r, 400))

      setBlocks([
        {
          id: 'block-1',
          ip_address: '192.168.1.120',
          reason: 'DDoS attempts and socket request spamming.',
          blocked_by: 'Admin Priya',
          expires_at: null,
          createdAt: '2026-07-06T11:00:00Z'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving IP blocks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIPBlocks()
  }, [])

  const handleAddBlock = async (e) => {
    e.preventDefault()
    if (!ip.trim() || !reason.trim()) return

    try {
      // Mock API add: axios.post('/api/v1/admin/ip-blocks', { ip, reason, expiresAt: expiry || null })
      await new Promise((r) => setTimeout(r, 350))

      alert('IP blocked successfully.')
      setIp('')
      setReason('')
      setExpiry('')
      fetchIPBlocks()
    } catch (err) {
      console.error('Failed adding IP block:', err)
    }
  }

  const handleRemoveBlock = async (blockId) => {
    try {
      // Mock API remove: axios.delete(`/api/v1/admin/ip-blocks/${blockId}`)
      await new Promise((r) => setTimeout(r, 300))

      alert('IP block removed.')
      setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    } catch (err) {
      console.error('Failed removing IP block:', err)
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
          <h2 className="text-xl font-black mt-0.5">IP Blacklist Management</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form to block IP */}
        <div className="flex flex-col gap-5">
          <form onSubmit={handleAddBlock} className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 pb-2 border-b border-white/5">
              Add IP Block
            </h4>

            {/* IP Address */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-stone-300">IP Address</span>
              <input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 192.168.1.1"
                className="h-10 bg-stone-900 border border-white/10 rounded-xl px-3 outline-none text-white focus:border-rose-500"
              />
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-stone-300">Block Justification</span>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for blocking..."
                className="bg-stone-900 border border-white/10 rounded-xl p-2.5 resize-none outline-none text-white focus:border-rose-500"
              />
            </div>

            {/* Expiry */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-stone-300">Block Expiry (Optional)</span>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="h-10 bg-stone-900 border border-white/10 rounded-xl px-3 outline-none text-white focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              className="mt-2 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              🚫 Block IP Address
            </button>
          </form>
        </div>

        {/* Right Columns: IP Blocks Grid */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Active IP blocks blacklist
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10">
                  <tr>
                    <th className="pb-3">IP Address</th>
                    <th className="pb-3">Block Reason</th>
                    <th className="pb-3">Blocked By</th>
                    <th className="pb-3">Expires At</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {blocks.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-bold text-white">{b.ip_address}</td>
                      <td className="py-3.5" title={b.reason}>{b.reason}</td>
                      <td className="py-3.5">{b.blocked_by}</td>
                      <td className="py-3.5">
                        {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : 'Permanent'}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleRemoveBlock(b.id)}
                          className="h-8 px-3.5 bg-white/10 hover:bg-white/20 border border-white/10 text-rose-500 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Remove Block
                        </button>
                      </td>
                    </tr>
                  ))}
                  {blocks.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-stone-500 font-bold">
                        No active IP blocks blacklists.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default AdminIPBlocks
export { AdminIPBlocks }
