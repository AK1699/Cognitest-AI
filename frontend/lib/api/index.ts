import axios from 'axios'

// Use relative URLs so Next.js rewrites can proxy to the backend and avoid CORS issues
const api = axios.create({
  baseURL: '',
  withCredentials: true,
})

// Request interceptor - cookies are automatically sent via withCredentials: true
api.interceptors.request.use(
  (config) => {
    // With httpOnly cookies, authorization is handled automatically
    // No need to manually add Bearer token
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Add detailed error information for debugging
    if (error.response) {
      // Server responded with error status
      error.isServerError = true
      error.statusCode = error.response.status
    } else if (error.request) {
      // Request was made but no response received
      error.isNetworkError = true
    } else {
      // Error in request configuration
      error.isConfigError = true
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token using httpOnly cookies
        // The refresh endpoint will use the httpOnly refresh_token cookie automatically
        const response = await axios.post(`/api/v1/auth/refresh`, {}, {
          withCredentials: true,
        })

        // The server will set new httpOnly cookies automatically
        // Just retry the original request
        return api(originalRequest)
      } catch (refreshError: any) {
        // Refresh failed - clear state and redirect to login
        // Clear any stale localStorage tokens for backward compatibility
        if (localStorage.getItem('access_token')) {
          localStorage.removeItem('access_token')
        }
        if (localStorage.getItem('refresh_token')) {
          localStorage.removeItem('refresh_token')
        }

        // Only redirect if we're not already on a public auth page
        const publicAuthPaths = ['/auth/signin', '/auth/signup', '/auth/accept-invitation', '/auth/forgot-password']
        const currentPath = window.location.pathname
        const isPublicAuthPage = publicAuthPaths.some(path => currentPath.includes(path))
        if (typeof window !== 'undefined' && !isPublicAuthPage) {
          console.warn('Session expired. Redirecting to login...')
          window.location.href = '/auth/signin'
        }

        // Return a more specific error for the caller
        const authError = new Error('Session expired. Please sign in again.')
          ; (authError as any).isAuthError = true
          ; (authError as any).response = { status: 401, data: { detail: 'Session expired' } }
        return Promise.reject(authError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
