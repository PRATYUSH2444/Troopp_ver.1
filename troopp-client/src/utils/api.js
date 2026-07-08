export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

let accessTokenInMemory = ''

export const setAccessToken = (token) => {
  accessTokenInMemory = token
}

export const getAccessToken = () => {
  return accessTokenInMemory
}

let refreshPromise = null

const executeRefresh = async () => {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken)
        return data.accessToken
      }
    }
    return null
  } catch (err) {
    console.error('Silent token rotation failed:', err)
    return null
  }
}

/**
 * Base API Request wrapper with silent token refresh handler.
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (accessTokenInMemory) {
    headers['Authorization'] = `Bearer ${accessTokenInMemory}`
  }
  
  const config = {
    ...options,
    headers,
    credentials: 'include' // Send cookies automatically
  }
  
  let response
  try {
    response = await fetch(url, config)
  } catch (error) {
    if (!navigator.onLine) {
      try {
        const { toast } = await import('react-hot-toast')
        toast.error('Network disconnected. Offline mode activated.')
      } catch (err) {
        console.error('Offline toast display failure:', err)
      }
      
      const path = window.location.pathname
      const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/offline', '/landing', '/']
      const requiresNetwork = !publicPaths.some((p) => path === p || path.startsWith(p))
      if (requiresNetwork) {
        window.location.href = '/offline'
      }
    }
    throw error
  }

  // If 401 Unauthorized, attempt to run Silent Refresh
  if (response && response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    if (!refreshPromise) {
      refreshPromise = executeRefresh().finally(() => {
        refreshPromise = null
      })
    }

    const newAccessToken = await refreshPromise
    if (newAccessToken) {
      config.headers['Authorization'] = `Bearer ${newAccessToken}`
      response = await fetch(url, config)
    }
  }

  return response
}

export default apiRequest
