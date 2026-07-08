import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      return toast.error('Please enter your email address.')
    }

    setSubmitting(true)
    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to request reset.')
      }

      setSent(true)
      toast.success('Password reset email sent!')
    } catch (err) {
      toast.error(err.message || 'Forgot password request failed.')
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
            Recover Password
          </h2>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Request a password reset link to recover access
          </p>
        </div>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center flex flex-col gap-3">
            <span className="text-2xl">📧</span>
            <p className="text-xs font-semibold text-emerald-805 leading-relaxed">
              We have sent a secure password reset link to your email. Please check your inbox and follow the steps.
            </p>
            <Link
              to="/login"
              className="text-xs font-bold text-stone-900 hover:underline mt-2"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="explorer@email.com"
                className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 mt-2 bg-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow hover:bg-stone-850 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Requesting reset link...' : 'Send Reset Link'}
            </button>
            
            <Link
              to="/login"
              className="text-center text-xs font-bold text-stone-500 hover:underline mt-2"
            >
              Back to Login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default ForgotPassword
