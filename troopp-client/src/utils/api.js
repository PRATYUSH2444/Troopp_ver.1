export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

let accessTokenInMemory = (typeof window !== 'undefined' && sessionStorage.getItem('troopp_token')) || ''

export const setAccessToken = (token) => {
  accessTokenInMemory = token || ''
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('troopp_token', token)
    } else {
      sessionStorage.removeItem('troopp_token')
    }
  }
}

export const getAccessToken = () => {
  if (!accessTokenInMemory && typeof window !== 'undefined') {
    accessTokenInMemory = sessionStorage.getItem('troopp_token') || ''
  }
  return accessTokenInMemory
}

let refreshPromise = null

/**
 * fetch() wrapped with an AbortController timeout.
 * Throws AbortError after timeoutMs — prevents infinite hangs.
 */
const fetchWithTimeout = (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal })
    .then((res) => { clearTimeout(timer); return res })
    .catch((err) => { clearTimeout(timer); throw err })
}

const executeRefresh = async () => {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/auth/refresh`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      },
      15000 // 15s timeout for silent refresh
    )
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken)
        return data.accessToken
      }
    }
    return null
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Silent token rotation failed:', err)
    }
    return null
  }
}

let isLoggingOut = false

export const setLoggingOut = (status) => {
  isLoggingOut = status
}

export const getLoggingOut = () => isLoggingOut

/**
 * Base API Request wrapper with 30s timeout and silent token refresh on 401.
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
    credentials: 'include'
  }

  let response
  try {
    response = await fetchWithTimeout(url, config, 30000)
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. The server may be starting up — please try again in a moment.')
      timeoutError.isTimeout = true
      throw timeoutError
    }

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

  // If 401, attempt a single silent refresh then retry — but NEVER during logout or for auth endpoints
  const isAuthEndpoint =
    endpoint.startsWith('/auth/refresh') ||
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/signup') ||
    endpoint.startsWith('/auth/logout') ||
    endpoint.startsWith('/auth/forgot-password') ||
    endpoint.startsWith('/auth/reset-password')

  if (
    response &&
    response.status === 401 &&
    !isLoggingOut &&
    !isAuthEndpoint
  ) {
    if (!refreshPromise) {
      refreshPromise = executeRefresh().finally(() => {
        refreshPromise = null
      })
    }

    const newAccessToken = await refreshPromise
    if (newAccessToken) {
      config.headers['Authorization'] = `Bearer ${newAccessToken}`
      try {
        response = await fetchWithTimeout(url, config, 30000)
      } catch (retryErr) {
        console.warn('Retry request after token refresh failed:', retryErr?.message)
        // Return the original 401 response rather than throwing
      }
    }
  }

  return response
}

export default apiRequest
