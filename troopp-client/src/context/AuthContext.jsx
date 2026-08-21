import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { apiRequest, setAccessToken, BASE_URL } from '../utils/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const checkInProgress = useRef(false)

  // On page load: Silent check if session cookie exists
  useEffect(() => {
    if (checkInProgress.current) return
    checkInProgress.current = true

    const checkSession = async () => {
      try {
        const res = await apiRequest('/auth/refresh', { method: 'POST' })

        if (res.ok) {
          const data = await res.json()
          if (data.success && data.accessToken) {
            setAccessToken(data.accessToken)

            const parts = data.accessToken.split('.')
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]))
              setUser({
                id: payload.id,
                email: payload.email,
                role: payload.role,
                name: payload.name,
                trustScore: payload.trust_score,
                onboardingCompleted: payload.onboarding_completed || false
              })
              setIsAuthenticated(true)
            }
          }
        }
      } catch (err) {
        // Timeout or network error — not logged in, just continue
        if (!err.isTimeout) {
          console.error('Silent session check failed:', err)
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
      setUser(data.user)
      setIsAuthenticated(true)
      return { success: true }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout request failed:', err)
    } finally {
      setAccessToken('')
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        setUser,
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
