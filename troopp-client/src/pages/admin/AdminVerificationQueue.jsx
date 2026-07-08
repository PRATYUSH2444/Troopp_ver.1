import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Manual KYC Identity Document Verification Queue.
 */
const AdminVerificationQueue = () => {
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  
  // Rejection modal
  const [rejectUser, setRejectUser] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchSubmissions = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/verifications')
      await new Promise((r) => setTimeout(r, 450))

      setSubmissions([
        {
          id: 'user-3',
          name: 'Vikram Malhotra',
          email: 'vikram@gmail.com',
          docType: 'Aadhaar Card',
          docUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
          submittedAt: '2026-07-06T10:00:00Z',
          status: 'manual_review'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving verification queue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleApprove = async (userId) => {
    try {
      // Mock API approve: axios.put(`/api/v1/admin/verifications/${userId}/approve`)
      await new Promise((r) => setTimeout(r, 300))
      alert('KYC verification approved successfully. Traveler awarded +30 Trust points.')
      setSubmissions((prev) => prev.filter((s) => s.id !== userId))
    } catch (err) {
      console.error('Failed approving KYC:', err)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectUser || !rejectReason.trim()) return

    try {
      // Mock API reject: axios.put(`/api/v1/admin/verifications/${rejectUser.id}/reject`, { reason: rejectReason })
      await new Promise((r) => setTimeout(r, 350))
      alert('Verification rejected. Traveler notified with reason.')
      setSubmissions((prev) => prev.filter((s) => s.id !== rejectUser.id))
      setRejectUser(null)
      setRejectReason('')
    } catch (err) {
      console.error('Failed rejecting verification:', err)
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
    <div className="p-6 text-white bg-stone-950 min-h-screen flex flex-col gap-5 font-sans">
      
      {/* Header title */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Administrative Panel</span>
          <h2 className="text-xl font-black mt-0.5">KYC Manual Verification Queue</h2>
        </div>
      </div>

      {/* Grid details list */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4">Traveler Name</th>
                <th className="p-4">Submission Date</th>
                <th className="p-4">Document Type</th>
                <th className="p-4">Oversight Document</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-xs">{s.name}</span>
                      <span className="text-[9px] text-stone-400 mt-0.5">{s.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {new Date(s.submittedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="p-4 font-bold">{s.docType}</td>
                  <td className="p-4">
                    <a
                      href={s.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold"
                    >
                      View Uploaded Document ↗
                    </a>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleApprove(s.id)}
                        className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                      >
                        Approve KYC
                      </button>
                      <button
                        onClick={() => setRejectUser(s)}
                        className="h-8 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-stone-400 font-bold">
                    🎉 Verification queue is empty!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal Dialog */}
      {rejectUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-xl flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Reject KYC Document</h4>
            
            <div className="flex flex-col gap-2 text-xs">
              <span className="font-bold text-stone-300">Auditor Rejection Reason</span>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Details why document was rejected (e.g. Blurry photo, mismatched names)..."
                className="w-full bg-stone-950 border border-white/10 rounded-xl p-2.5 resize-none outline-none text-white focus:border-rose-500"
              />
            </div>
            
            <div className="flex gap-2 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setRejectUser(null)
                  setRejectReason('')
                }}
                className="flex-1 h-10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim()}
                onClick={handleRejectSubmit}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminVerificationQueue
export { AdminVerificationQueue }
