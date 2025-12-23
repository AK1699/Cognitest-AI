import axios from 'axios'

// Use relative URLs so Next.js rewrites can proxy to the backend and avoid CORS issues
const api = axios.create({
  baseURL: '',
  withCredentials: true,
})

// Request interceptor - cookies are automatically sent via withCredentials: true
api.interceptors.request.use(
  (config) => {
    // Prefer httpOnly cookies, but attach Bearer token if available as fallback
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token && !config.headers?.Authorization) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

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
      } catch (refreshError) {
        // Refresh failed, redirect to login only if not already on signin page
        // httpOnly cookies are managed by the server
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
          window.location.href = '/auth/signin'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
