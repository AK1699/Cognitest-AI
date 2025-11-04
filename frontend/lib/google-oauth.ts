/**
 * Google OAuth utilities for frontend
 */

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function getGoogleClientId(): Promise<string> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/auth/google/client-id`)
    return response.data.client_id
  } catch (error) {
    console.error('Failed to get Google Client ID:', error)
    throw new Error('Failed to initialize Google OAuth')
  }
}

export async function handleGoogleCallback(code: string, state: string): Promise<any> {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/google/callback`, {
      code,
      state
    })
    return response.data
  } catch (error) {
    console.error('Google callback failed:', error)
    throw error
  }
}

export async function handleGoogleSignIn(idToken: string, accessToken?: string): Promise<any> {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/google/signin`, {
      id_token: idToken,
      access_token: accessToken
    })
    return response.data
  } catch (error) {
    console.error('Google sign in failed:', error)
    throw error
  }
}

export async function handleGoogleSignUp(idToken: string, username?: string, accessToken?: string): Promise<any> {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/google/signup`, {
      id_token: idToken,
      username,
      access_token: accessToken
    })
    return response.data
  } catch (error) {
    console.error('Google sign up failed:', error)
    throw error
  }
}

// Microsoft OAuth utilities
export async function handleMicrosoftSignIn(idToken: string, accessToken?: string): Promise<any> {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/microsoft/signin`, {
      id_token: idToken,
      access_token: accessToken
    })
    return response.data
  } catch (error) {
    console.error('Microsoft sign in failed:', error)
    throw error
  }
}

// Apple OAuth utilities
export async function handleAppleSignIn(idToken: string, accessToken?: string): Promise<any> {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/apple/signin`, {
      id_token: idToken,
      access_token: accessToken
    })
    return response.data
  } catch (error) {
    console.error('Apple sign in failed:', error)
    throw error
  }
}

export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      reject(new Error('Failed to load Google Sign-In script'))
    }
    document.head.appendChild(script)
  })
}

export function initializeGoogleSignIn(clientId: string, callback: (response: any) => void): void {
  if (!(window as any).google) {
    console.error('Google Sign-In script not loaded')
    return
  }

  (window as any).google.accounts.id.initialize({
    client_id: clientId,
    callback: callback,
    auto_select: false,
    ux_mode: 'popup'
  })
}

export function renderGoogleSignInButton(elementId: string, options?: any): void {
  if (!(window as any).google) {
    console.error('Google Sign-In script not loaded')
    return
  }

  const defaultOptions = {
    theme: 'outline',
    size: 'large',
    width: '100%'
  }

  (window as any).google.accounts.id.renderButton(
    document.getElementById(elementId),
    { ...defaultOptions, ...options }
  )
}

export function promptGoogleSignIn(): void {
  if (!(window as any).google) {
    console.error('Google Sign-In script not loaded')
    return
  }

  (window as any).google.accounts.id.prompt()
}
