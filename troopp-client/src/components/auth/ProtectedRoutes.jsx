import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Spinner from '../common/Spinner.jsx'

/**
 * Route protection HOC. Redirects to login if user is unauthenticated.
 */
export const ProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If user has not completed onboarding and is trying to access a protected app route
  if (!user?.onboardingCompleted && !['/onboarding', '/suspended', '/banned'].includes(location.pathname)) {
    return <Navigate to="/onboarding" replace />
  }

  // If user has completed onboarding and is trying to access the onboarding route
  if (user?.onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/feed" replace />
  }

  return <Outlet />
}

/**
 * Admin route protection HOC. Redirects standard members back to main feed.
 */
export const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const isAdmin = isAuthenticated && user?.role === 'admin'

  return isAdmin ? <Outlet /> : <Navigate to="/feed" replace />
}

/**
 * Public only route HOC. Prevents authenticated users from viewing login/signup endpoints.
 */
export const PublicOnlyRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/feed" replace />
}

export default ProtectedRoute
