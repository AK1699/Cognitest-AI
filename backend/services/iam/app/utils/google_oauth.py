"""
Google OAuth 2.0 utilities for authentication.
"""

import json
import httpx
from typing import Dict, Optional
from datetime import datetime, timedelta
from ..core.config import settings
import secrets
import base64

class GoogleOAuthError(Exception):
    """Exception raised for Google OAuth errors."""
    pass

async def get_google_authorization_url(state: str) -> str:
    """
    Generate the Google OAuth authorization URL.

    Args:
        state: A random string used to prevent CSRF attacks

    Returns:
        The authorization URL to redirect the user to
    """
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }

    param_str = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"https://accounts.google.com/o/oauth2/v2/auth?{param_str}"

async def exchange_code_for_token(code: str) -> Dict:
    """
    Exchange the authorization code for an access token.

    Args:
        code: The authorization code from Google

    Returns:
        Dictionary containing access_token, id_token, etc.

    Raises:
        GoogleOAuthError: If token exchange fails
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
                timeout=10.0,
            )

            if response.status_code != 200:
                raise GoogleOAuthError(f"Failed to exchange code for token: {response.text}")

            return response.json()
        except httpx.RequestError as e:
            raise GoogleOAuthError(f"Failed to reach Google OAuth endpoint: {str(e)}")
        except Exception as e:
            raise GoogleOAuthError(f"Unexpected error during token exchange: {str(e)}")

async def get_user_info_from_id_token(id_token: str) -> Dict:
    """
    Decode and verify the ID token to get user information.

    Note: This is a simplified version. In production, you should verify the token signature.

    Args:
        id_token: The ID token from Google

    Returns:
        Dictionary containing user information (sub, email, name, picture, etc.)

    Raises:
        GoogleOAuthError: If token decoding fails
    """
    try:
        # Split the JWT into parts
        parts = id_token.split('.')
        if len(parts) != 3:
            raise GoogleOAuthError("Invalid token format")

        # Decode the payload (second part)
        # Add padding if necessary
        payload = parts[1]
        padding = 4 - (len(payload) % 4)
        if padding != 4:
            payload += '=' * padding

        decoded = base64.urlsafe_b64decode(payload)
        user_info = json.loads(decoded)

        return user_info
    except Exception as e:
        raise GoogleOAuthError(f"Failed to decode ID token: {str(e)}")

async def get_user_info_from_access_token(access_token: str) -> Dict:
    """
    Get user information using the access token.

    Args:
        access_token: The access token from Google

    Returns:
        Dictionary containing user information

    Raises:
        GoogleOAuthError: If API call fails
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0,
            )

            if response.status_code != 200:
                raise GoogleOAuthError(f"Failed to get user info: {response.text}")

            return response.json()
        except httpx.RequestError as e:
            raise GoogleOAuthError(f"Failed to reach Google API: {str(e)}")
        except Exception as e:
            raise GoogleOAuthError(f"Unexpected error getting user info: {str(e)}")

def generate_oauth_state() -> str:
    """Generate a random state string for OAuth flow."""
    return secrets.token_urlsafe(32)

def get_google_client_id() -> str:
    """Get the Google client ID from settings."""
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleOAuthError("GOOGLE_CLIENT_ID not configured")
    return settings.GOOGLE_CLIENT_ID
