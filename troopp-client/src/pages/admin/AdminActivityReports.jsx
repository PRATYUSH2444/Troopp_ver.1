import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Trip Activities Content Oversight Queue. Checks inappropriate descriptions.
 */
const AdminActivityReports = () => {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  
  // Modals state
  const [activeReport, setActiveReport] = useState(null)
  const [actionType, setActionType] = useState('') // 'resolve' | 'dismiss'
  const [resolutionNote, setResolutionNote] = useState('')

  const fetchReports = async () => {
    try {
      // Mock API: axios.get('/api/v1/admin/activity-reports')
      await new Promise((r) => setTimeout(r, 400))

      setReports([
        {
          id: 'act-rep-1',
          activityId: 'act-1',
          activityTitle: 'Secret Wild Forest Drinking Party',
          creatorName: 'Vikram Malhotra',
          reporterName: 'Priya Sharma',
          reason: 'Inappropriate Content / Safety Violation',
          details: 'Description promotes drinking inside reserved forest areas without permits. Violates safety bylaws.',
          createdAt: '2026-07-06T12:00:00Z',
          status: 'pending'
        }
      ])
    } catch (err) {
      console.error('Failed retrieving activity reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleActionSubmit = async () => {
    if (!activeReport || !resolutionNote.trim()) return

    try {
      // Mock API dispatch: axios.put(`/api/v1/admin/activity-reports/${activeReport.id}/resolve`, { status: actionType === 'resolve' ? 'resolved' : 'dismissed', resolutionNote })
      await new Promise((r) => setTimeout(r, 350))

      setReports((prev) =>
        prev.map((r) =>
          r.id === activeReport.id
            ? { ...r, status: actionType === 'resolve' ? 'resolved' : 'dismissed' }
            : r
        )
      )

      alert(`Activity report resolved. status updated to ${actionType === 'resolve' ? 'Resolved' : 'Dismissed'}.`)
      setActiveReport(null)
      setResolutionNote('')
    } catch (err) {
      console.error('Failed resolving activity report:', err)
    }
  }

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true
    return r.status === statusFilter
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
          <h2 className="text-xl font-black mt-0.5">Activities Content Oversight Queue</h2>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex gap-4">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'pending' ? 'bg-primary text-white shadow' : 'bg-white/5 text-stone-400 hover:text-white'
          }`}
        >
          📥 Pending Queue ({reports.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'resolved' ? 'bg-emerald-700 text-white shadow' : 'bg-white/5 text-stone-400 hover:text-white'
          }`}
        >
          ✓ Resolved Queue
        </button>
        <button
          onClick={() => setStatusFilter('dismissed')}
          className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'dismissed' ? 'bg-stone-700 text-white shadow' : 'bg-white/5 text-stone-400 hover:text-white'
          }`}
        >
          🚫 Dismissed Queue
        </button>
      </div>

      {/* Grid details list */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4">Reporter</th>
                <th className="p-4">Activity Title</th>
                <th className="p-4">Creator / Host</th>
                <th className="p-4">Flag Reason</th>
                <th className="p-4 font-bold">Details Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReports.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{r.reporterName}</td>
                  <td className="p-4 font-extrabold text-stone-200">{r.activityTitle}</td>
                  <td className="p-4">{r.creatorName}</td>
                  <td className="p-4">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-rose-950/20 text-rose-400 border border-rose-500/20 font-bold uppercase">
                      {r.reason}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate" title={r.details}>{r.details}</td>
                  <td className="p-4 text-right">
                    {r.status === 'pending' ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setActiveReport(r)
                            setActionType('resolve')
                          }}
                          className="h-8 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                        >
                          Cancel Trip
                        </button>
                        <button
                          onClick={() => {
                            setActiveReport(r)
                            setActionType('dismiss')
                          }}
                          className="h-8 px-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-[10px] font-bold transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-500 italic">No action needed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Note modal overlay */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-xl flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {actionType === 'resolve' ? 'Confirm Cancellation' : 'Confirm Dismiss Report'}
            </h4>
            
            <p className="text-[10px] text-stone-400 leading-relaxed">
              {actionType === 'resolve'
                ? 'Cancelling this activity will alert all members, delete group access and issue trust score strikes on the host.'
                : 'Dismissing this report files it as invalid. No action will be taken.'}
            </p>

            <div className="flex flex-col gap-2 text-xs">
              <span className="font-bold text-stone-300">Auditor Action Notes</span>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Write resolution notes..."
                className="w-full bg-stone-950 border border-white/10 rounded-xl p-2.5 resize-none outline-none text-white focus:border-primary"
              />
            </div>
            
            <div className="flex gap-2 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setActiveReport(null)
                  setResolutionNote('')
                }}
                className="flex-1 h-10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!resolutionNote.trim()}
                onClick={handleActionSubmit}
                className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                  actionType === 'resolve'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-stone-700 hover:bg-stone-850 text-white'
                }`}
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminActivityReports
export { AdminActivityReports }
