import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import Spinner from '../components/common/Spinner.jsx'

const ShareActivity = () => {
  const { id } = useParams()
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        // Fetch details (graceful error if unauthorized)
        const res = await apiRequest(`/activities/${id}`)
        if (res.ok) {
          const json = await res.json()
          const act = json.data.activity || json.data
          setActivity({
            ...act,
            category: act.type || act.category,
            cost_estimate: act.cost_per_person || act.cost_estimate,
            max_capacity: act.max_group_size || act.max_capacity
          })
        }
      } catch (err) {
        console.warn('Public invite fetch failed (unauthorized).')
      } finally {
        setLoading(false)
      }
    }
    fetchInviteDetails()
  }, [id])

  const copyInviteLink = () => {
    const link = `${window.location.origin}/activities/${id}`
    navigator.clipboard.writeText(link)
    toast.success('Invite link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12 flex items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/5 filter blur-[80px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-md border border-stone-200/60 rounded-3xl p-8 shadow-xl text-center flex flex-col gap-6"
      >
        <span className="text-5xl self-center">🎒</span>

        <div className="flex flex-col gap-1">
          <span className="bg-primary/10 text-primary-dark px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider self-center">
            Trip Invitation
          </span>
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight leading-tight mt-2">
            {activity ? activity.title : 'You are Invited!'}
          </h2>
          {activity && (
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">
              📅 {new Date(activity.date_time).toLocaleString()}
            </p>
          )}
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          Your friend invited you to join this trip on Troopp, the peer-to-peer travel co-coordination platform. Create a profile, verify your identity, and set off safely.
        </p>

        {activity && (
          <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl text-xs text-stone-600 flex flex-col gap-2 text-left">
            <div>📍 <strong>Category:</strong> {activity.category}</div>
            <div>💰 <strong>Cost Estimate:</strong> ₹{activity.cost_estimate}</div>
            <div>👥 <strong>Capacity limit:</strong> {activity.max_capacity} spots</div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={copyInviteLink}
            className="w-full h-11 bg-white border border-stone-200 hover:bg-stone-55 text-stone-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Copy Invitation Link
          </button>
          
          <Link
            to="/login"
            className="w-full h-11 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center hover:bg-stone-850 transition-all cursor-pointer shadow"
          >
            Sign In to Join Trip
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ShareActivity
