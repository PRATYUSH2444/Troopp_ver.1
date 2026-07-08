import React, { useState, useEffect } from 'react'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * System and Admin Settings Panel. Handles administrator rosters and Grievance Officer details.
 */
const AdminSettings = () => {
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState([])
  const [promoteEmail, setPromoteEmail] = useState('')
  
  // Grievance Officer State
  const [officerName, setOfficerName] = useState('Prakash Joshi')
  const [officerEmail, setOfficerEmail] = useState('grievance.officer@troopp.com')
  const [officerDesignation, setOfficerDesignation] = useState('Chief Compliance Officer')

  const fetchAdmins = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/list')
      await new Promise((r) => setTimeout(r, 400))

      setAdmins([
        { id: 'admin-101', name: 'Admin Priya', email: 'priya.admin@troopp.com' },
        { id: 'admin-102', name: 'Admin Raj', email: 'raj.admin@troopp.com' }
      ])
    } catch (err) {
      console.error('Failed retrieving administrative settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handlePromoteSubmit = async (e) => {
    e.preventDefault()
    if (!promoteEmail.trim()) return

    try {
      // Mock API promote: axios.post('/api/v1/admin/promote', { email: promoteEmail })
      await new Promise((r) => setTimeout(r, 350))

      alert('Traveler successfully promoted to administrator.')
      setPromoteEmail('')
      fetchAdmins()
    } catch (err) {
      console.error('Failed promoting user to admin:', err)
    }
  }

  const handleDemote = async (userId) => {
    try {
      // Mock API demote: axios.post('/api/v1/admin/demote', { userId })
      await new Promise((r) => setTimeout(r, 350))

      alert('Administrator successfully demoted to member status.')
      setAdmins((prev) => prev.filter((a) => a.id !== userId))
    } catch (err) {
      console.error('Failed demoting administrator:', err)
    }
  }

  const handleSaveOfficer = async (e) => {
    e.preventDefault()
    try {
      // Mock API update: axios.put('/api/v1/admin/settings/grievance-officer', { name: officerName, email: officerEmail, designation: officerDesignation })
      await new Promise((r) => setTimeout(r, 300))
      alert('Grievance Officer settings updated successfully.')
    } catch (err) {
      console.error('Failed saving Grievance Officer details:', err)
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
          <h2 className="text-xl font-black mt-0.5">Control Center Settings</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Administrators Roster */}
        <div className="flex flex-col gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 pb-2 border-b border-white/5">
              Administrators Roster
            </h4>

            <div className="flex flex-col gap-3">
              {admins.map((a) => (
                <div key={a.id} className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{a.name}</span>
                    <span className="text-[9px] text-stone-400 mt-0.5">{a.email}</span>
                  </div>
                  <button
                    onClick={() => handleDemote(a.id)}
                    className="h-8 px-3 bg-white/10 hover:bg-white/20 border border-white/10 text-rose-500 rounded-lg text-[9px] font-bold transition-colors"
                  >
                    Demote back
                  </button>
                </div>
              ))}
            </div>

            {/* Promote Form */}
            <form onSubmit={handlePromoteSubmit} className="mt-2 border-t border-white/5 pt-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-stone-300">Promote Traveler to Admin</span>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  placeholder="Enter traveler email..."
                  className="flex-1 h-10 bg-stone-900 border border-white/10 rounded-xl px-3 outline-none text-xs text-white focus:border-primary"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow transition-all"
                >
                  Promote
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Grievance Officer Settings */}
        <div className="flex flex-col gap-5">
          <form onSubmit={handleSaveOfficer} className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 pb-2 border-b border-white/5">
              Public Grievance Officer details
            </h4>

            {/* Officer Name */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-stone-300">Compliance Officer Name</span>
              <input
                type="text"
                required
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="Prakash Joshi..."
                className="h-10 bg-stone-900 border border-white/10 rounded-xl px-3 outline-none text-white focus:border-primary"
              />
            </div>

            {/* Officer Email */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-stone-300">Official Compliance Email</span>
              <input
                type="email"
                required
                value={officerEmail}
                onChange={(e) => setOfficerEmail(e.target.value)}
                placeholder="grievance.officer@troopp.com..."
                className="h-10 bg-stone-900 border border-white/10 rounded-xl px-3 outline-none text-white focus:border-primary"
              />
            </div>

            {/* Officer Designation */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-stone-300">Corporate Designation</span>
              <input
                type="text"
                required
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
                placeholder="Chief Compliance Officer..."
                className="h-10 bg-stone-900 border border-white/10 rounded-xl px-3 outline-none text-white focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="mt-2 h-11 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow transition-all"
            >
              💾 Save Compliance settings
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}

export default AdminSettings
export { AdminSettings }
