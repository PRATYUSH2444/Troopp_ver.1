import React, { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { setAccessToken } from '../utils/api.js'
import Spinner from '../components/common/Spinner.jsx'

const GoogleCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser, setIsAuthenticated } = useAuth()
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const token = searchParams.get('token')
    const onboarded = searchParams.get('onboarded') === 'true'

    if (token) {
      try {
        setAccessToken(token)
        
        // Decode token payload
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          setUser({
            id: payload.id,
            email: payload.email,
            role: payload.role,
            name: payload.name,
            trustScore: payload.trust_score
          })
          setIsAuthenticated(true)
          toast.success('Successfully authenticated with Google!')
          
          if (onboarded) {
            navigate('/feed')
          } else {
            navigate('/onboarding') // Direct to onboarding setup if incomplete
          }
        }
      } catch (err) {
        console.error('Failed to parse Google login token:', err)
        toast.error('Google Sign-in failed. Please try again.')
        navigate('/login')
      }
    } else {
      toast.error('Authentication token missing from callback.')
      navigate('/login')
    }
  }, [searchParams, navigate, setUser, setIsAuthenticated])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
      <Spinner size="lg" />
      <span className="text-xs font-bold uppercase tracking-widest text-stone-500 animate-pulse">
        Completing Secure Handshake...
      </span>
    </div>
  )
}

export default GoogleCallback
