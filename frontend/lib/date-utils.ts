/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Format date to human-readable format: "01 Nov 2025"
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "01 Nov 2025")
 */
export function formatDateHumanReadable(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }

    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = dateObj.toLocaleString('en-US', { month: 'short' }).charAt(0).toUpperCase() + dateObj.toLocaleString('en-US', { month: 'short' }).slice(1)
    const year = dateObj.getFullYear()

    return `${day} ${month} ${year}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Format date with time: "01 Nov 2025, 10:30 AM"
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateWithTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }

    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = dateObj.toLocaleString('en-US', { month: 'short' }).charAt(0).toUpperCase() + dateObj.toLocaleString('en-US', { month: 'short' }).slice(1)
    const year = dateObj.getFullYear()
    const time = dateObj.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    return `${day} ${month} ${year}, ${time}`
  } catch (error) {
    console.error('Error formatting date with time:', error)
    return 'Invalid date'
  }
}

/**
 * Format relative time: "2 days ago", "3 minutes ago"
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'Invalid date'
  }
}

/**
 * Format date for API/database: "2025-01-01"
 * @param date - Date object or string
 * @returns ISO date string (YYYY-MM-DD)
 */
export function formatDateForAPI(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return ''
    }

    return dateObj.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error formatting date for API:', error)
    return ''
  }
}
