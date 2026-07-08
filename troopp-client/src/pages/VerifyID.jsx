import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'

const VerifyID = () => {
  const [docType, setDocType] = useState('aadhaar')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        return toast.error('File size must be under 5MB.')
      }
      setFile(selected)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      return toast.error('Please select an ID document file to upload.')
    }

    const formData = new FormData()
    formData.append('document', file)
    formData.append('docType', docType)

    setUploading(true)
    try {
      // Direct raw fetch because of FormData boundaries
      const token = localStorage.getItem('troopp_session_flag') // Retrieve token handle
      // Wait, api.js has setAccessToken in-memory. Let's get the access token dynamically!
      const { getAccessToken, BASE_URL } = await import('../utils/api.js')
      const accessToken = getAccessToken()

      const res = await fetch(`${BASE_URL}/kyc/upload-id`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'KYC Upload failed.')
      }

      toast.success('Government ID uploaded and verified successfully!')
      
      // Update local state if verified immediately
      if (data.data?.status === 'verified') {
        setUser((prev) => ({ ...prev, idVerified: true }))
      }

      // Auto route to face verification next
      navigate('/profile/me/verify-face')
    } catch (err) {
      toast.error(err.message || 'ID Upload failed. Check formats.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-6"
      >
        <div className="text-center flex flex-col gap-1.5">
          <h2 className="font-heading font-black text-2xl text-white tracking-tight">
            Verify Government ID
          </h2>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Step 1 of 2: Upload government document
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Document Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">
              Select ID Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full h-11 px-4 cursor-pointer"
            >
              <option value="aadhaar" className="bg-surface text-white">Aadhaar Card (India)</option>
              <option value="pan" className="bg-surface text-white">PAN Card (India)</option>
              <option value="passport" className="bg-surface text-white">International Passport</option>
            </select>
          </div>

          {/* Document File Uploader */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">
              Upload Document File (PNG, JPG, PDF - Max 5MB)
            </label>
            <div className="border-2 border-dashed border-white/10 hover:border-primary/30 rounded-2xl p-6 text-center cursor-pointer relative bg-white/5 flex flex-col items-center gap-2">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="text-3xl">📄</span>
              <span className="text-xs font-bold text-white">
                {file ? file.name : 'Select or drop document file here'}
              </span>
              <span className="text-[9px] text-stone-400 font-bold uppercase">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'No file selected'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate('/profile/me')}
              className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 h-11 bg-stone-900 border border-white/5 text-white hover:bg-stone-850 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? 'Uploading ID...' : 'Upload & Verify'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default VerifyID
