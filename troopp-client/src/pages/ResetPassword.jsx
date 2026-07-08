import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      toast.error('Reset token is invalid or missing.')
      navigate('/login')
    }
  }, [token, navigate])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.')
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters long.')
    }

    setSubmitting(true)
    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to reset password.')
      }

      toast.success('Password successfully reset! Please login with your new password.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Reset password request failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-md border border-stone-200/60 rounded-3xl p-8 shadow-2xl shadow-stone-200/50 flex flex-col gap-6"
      >
        <div className="text-center flex flex-col gap-1.5">
          <h2 className="font-heading font-black text-3xl text-stone-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 mt-2 bg-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow hover:bg-stone-850 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Resetting Password...' : 'Save New Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default ResetPassword
