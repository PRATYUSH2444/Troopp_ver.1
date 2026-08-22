import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { apiRequest, setAccessToken, setLoggingOut, BASE_URL } from '../utils/api.js'

const AuthContext = createContext(null)

/**
 * Normalizes user and token payload data into a consistent, safe object structure.
 */
export const normalizeUser = (u, payload = {}) => {
  if (!u && !payload.id) return null
  const id = u?.id || payload.id
  const email = u?.email || payload.email
  const role = u?.role || payload.role || 'user'
  const name = u?.name || u?.Profile?.name || payload.name || 'Explorer'
  const trustScore = u?.trustScore ?? u?.trust_score ?? payload.trust_score ?? 60

  // Safe evaluation of onboardingCompleted:
  // If explicitly false (boolean false), then false. Otherwise true.
  const rawOnboarded = u?.onboardingCompleted ?? u?.onboarding_completed ?? payload?.onboarding_completed ?? payload?.onboardingCompleted
  const onboardingCompleted = rawOnboarded === false ? false : true

  return {
    id,
    email,
    role,
    name,
    trustScore,
    onboardingCompleted
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const checkInProgress = useRef(false)

  // On page load: Hydrate immediately from stored token, then verify/refresh
  useEffect(() => {
    if (checkInProgress.current) return
    checkInProgress.current = true

    const checkSession = async () => {
      // 1. Immediate sync hydration from token
      const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('troopp_token') : null
      if (storedToken) {
        try {
          const parts = storedToken.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            if (!payload.exp || payload.exp * 1000 > Date.now()) {
              setAccessToken(storedToken)
              const normalized = normalizeUser(null, payload)
              if (normalized) {
                setUser(normalized)
                setIsAuthenticated(true)
              }
            }
          }
        } catch (e) {
          console.warn('Session hydration note:', e.message)
        }
      }

      // 2. Refresh verification in background & sync profile state
      try {
        const res = await apiRequest('/auth/refresh', { method: 'POST' })

        if (res && res.ok) {
          const data = await res.json()
          if (data.success && data.accessToken) {
            setAccessToken(data.accessToken)

            const parts = data.accessToken.split('.')
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]))
              const normalized = normalizeUser(data.user, payload)
              if (normalized) {
                setUser(normalized)
                setIsAuthenticated(true)
              }
            }
          }
        }
      } catch (err) {
        if (!err.isTimeout) {
          console.warn('Background session refresh note:', err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed')
      }

      setAccessToken(data.accessToken)
      const parts = data.accessToken ? data.accessToken.split('.') : []
      const payload = parts.length === 3 ? JSON.parse(atob(parts[1])) : {}
      const normalized = normalizeUser(data.user, payload)
      
      setUser(normalized)
      setIsAuthenticated(true)
      return { success: true }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setLoggingOut(true)
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (err) {
      console.warn('Logout request finished with note:', err.message)
    } finally {
      setAccessToken('')
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
      setLoggingOut(false)
      sessionStorage.removeItem('chunk_reload_attempted')
    }
  }

  const updateUser = (updater) => {
    setUser((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      return normalizeUser(updated)
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        setUser: updateUser,
        setIsAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
