import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Spinner from '../common/Spinner.jsx'

/**
 * Route protection HOC. Redirects to login if user is unauthenticated.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
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
