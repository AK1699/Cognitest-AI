import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token using httpOnly cookies
        // The refresh endpoint will use the httpOnly refresh_token cookie automatically
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, {
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

        // Only redirect if we're not already on the signin page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/signin')) {
          window.location.href = '/auth/signin'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
