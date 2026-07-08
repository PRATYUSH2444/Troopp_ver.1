import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'

/**
 * Traveler Administration Console. Filters, paginates, bans, suspends, and exports traveler accounts logs.
 */
const AdminUsers = () => {
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  
  // Filters parameters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifyFilter, setVerifyFilter] = useState('all')

  const fetchUsers = async () => {
    try {
      // Mock API list: axios.get('/api/v1/admin/users')
      await new Promise((r) => setTimeout(r, 450))

      setUsers([
        {
          id: 'user-1',
          name: 'Raj Malhotra',
          email: 'raj@gmail.com',
          city: 'Mumbai',
          trustScore: 80,
          reliabilityScore: 98,
          account_status: 'active',
          is_id_verified: true
        },
        {
          id: 'user-2',
          name: 'Priya Sharma',
          email: 'priya@gmail.com',
          city: 'Pune',
          trustScore: 72,
          reliabilityScore: 95,
          account_status: 'active',
          is_id_verified: true
        },
        {
          id: 'user-3',
          name: 'Vikram Malhotra',
          email: 'vikram@gmail.com',
          city: 'Bangalore',
          trustScore: 55,
          reliabilityScore: 80,
          account_status: 'suspended',
          is_id_verified: false
        }
      ])
    } catch (err) {
      console.error('Failed retrieving travelers list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSelectRow = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map((u) => u.id))
    }
  }

  const handleExportCSV = () => {
    const selectedRows = users.filter((u) => selectedUserIds.includes(u.id))
    const headers = ['ID', 'Name', 'Email', 'City', 'Trust Score', 'Reliability', 'Status']
    const rows = selectedRows.map((u) => [u.id, u.name, u.email, u.city, u.trustScore, u.reliabilityScore, u.account_status])
    
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'troopp_travelers_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter local rows
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter
    const matchesVerify =
      verifyFilter === 'all' ||
      (verifyFilter === 'verified' && u.is_id_verified) ||
      (verifyFilter === 'unverified' && !u.is_id_verified)

    return matchesSearch && matchesStatus && matchesVerify
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
          <h2 className="text-xl font-black mt-0.5">Travelers Administration</h2>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search name or email..."
          className="h-10 bg-white/5 border border-white/10 rounded-xl px-3 outline-none text-xs focus:border-primary text-white"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 bg-stone-900 border border-white/10 rounded-xl px-2 outline-none text-xs text-white"
        >
          <option value="all">Filter Status: All Accounts</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>

        <select
          value={verifyFilter}
          onChange={(e) => setVerifyFilter(e.target.value)}
          className="h-10 bg-stone-900 border border-white/10 rounded-xl px-2 outline-none text-xs text-white"
        >
          <option value="all">Filter Verification: All</option>
          <option value="verified">KYC Verified Only</option>
          <option value="unverified">KYC Unverified</option>
        </select>
      </div>

      {/* Bulk action alert bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 p-3 rounded-xl flex items-center justify-between animate-fade-in">
          <span className="text-xs font-bold text-primary">
            {selectedUserIds.length} Travelers selected for bulk action
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => alert(`Bulk Notification sent to ${selectedUserIds.length} users.`)}
              className="h-8 px-3 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold transition-all shadow"
            >
              📣 Send Broadcast Notification
            </button>
            <button
              onClick={handleExportCSV}
              className="h-8 px-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-[10px] font-bold transition-all"
            >
              CSV Export ⇩
            </button>
          </div>
        </div>
      )}

      {/* Users Data Grid */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="text-[10px] font-bold text-stone-400 uppercase border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="p-4">Traveler Info</th>
                <th className="p-4">City</th>
                <th className="p-4">Trust Score</th>
                <th className="p-4">Reliability</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => handleSelectRow(u.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="p-4 flex items-center gap-3">
                    <Avatar size="sm" name={u.name} score={u.trustScore} />
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-xs">{u.name}</span>
                      <span className="text-[9px] text-stone-400 mt-0.5">{u.email}</span>
                    </div>
                  </td>
                  <td className="p-4">{u.city}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{u.trustScore}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-400">
                        Verified
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-bold">{u.reliabilityScore}%</td>
                  <td className="p-4">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.account_status === 'active'
                          ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-950/20 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {u.account_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="h-8 px-3.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                    >
                      View Details ⚙️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default AdminUsers
export { AdminUsers }
