"""
Microsoft OAuth 2.0 utilities for authentication.
Supports Microsoft/Azure AD sign-in.
"""

import json
import httpx
from typing import Dict, Optional
from datetime import datetime, timedelta
from app.core.config import settings
import secrets
import base64
from jose import jwt

class MicrosoftOAuthError(Exception):
    """Exception raised for Microsoft OAuth errors."""
    pass

async def get_microsoft_authorization_url(state: str) -> str:
    """
    Generate the Microsoft OAuth authorization URL.

    Args:
        state: A random string used to prevent CSRF attacks

    Returns:
        The authorization URL to redirect the user to
    """
    if not settings.MICROSOFT_CLIENT_ID:
        raise MicrosoftOAuthError("MICROSOFT_CLIENT_ID not configured")

    params = {
        "client_id": settings.MICROSOFT_CLIENT_ID,
        "redirect_uri": settings.MICROSOFT_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "response_mode": "query",
        "prompt": "select_account",
    }

    param_str = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{param_str}"

async def exchange_code_for_token(code: str) -> Dict:
    """
    Exchange the authorization code for an access token.

    Args:
        code: The authorization code from Microsoft

    Returns:
        Dictionary containing access_token, id_token, etc.

    Raises:
        MicrosoftOAuthError: If token exchange fails
    """
    if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET:
        raise MicrosoftOAuthError("Microsoft OAuth credentials not configured")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                data={
                    "code": code,
                    "client_id": settings.MICROSOFT_CLIENT_ID,
                    "client_secret": settings.MICROSOFT_CLIENT_SECRET,
                    "redirect_uri": settings.MICROSOFT_REDIRECT_URI,
                    "grant_type": "authorization_code",
                    "scope": "openid email profile",
                },
                timeout=10.0,
            )

            if response.status_code != 200:
                raise MicrosoftOAuthError(f"Failed to exchange code for token: {response.text}")

            return response.json()
        except httpx.RequestError as e:
            raise MicrosoftOAuthError(f"Failed to reach Microsoft OAuth endpoint: {str(e)}")
        except Exception as e:
            raise MicrosoftOAuthError(f"Unexpected error during token exchange: {str(e)}")

async def get_user_info_from_id_token(id_token: str) -> Dict:
    """
    Decode and verify the ID token to get user information.

    Note: This is a simplified version. In production, you should verify the token signature
    using Microsoft's public keys from: https://login.microsoftonline.com/common/discovery/v2.0/keys

    Args:
        id_token: The ID token from Microsoft

    Returns:
        Dictionary containing user information (sub, email, name, picture, etc.)

    Raises:
        MicrosoftOAuthError: If token decoding fails
    """
    try:
        # Decode without verification (simplified)
        # In production, verify signature using Microsoft's JWKS endpoint
        decoded = jwt.get_unverified_claims(id_token)
        return decoded
    except Exception as e:
        raise MicrosoftOAuthError(f"Failed to decode ID token: {str(e)}")

async def get_user_info_from_access_token(access_token: str) -> Dict:
    """
    Get user information using the access token.

    Args:
        access_token: The access token from Microsoft

    Returns:
        Dictionary containing user information

    Raises:
        MicrosoftOAuthError: If API call fails
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0,
            )

            if response.status_code != 200:
                raise MicrosoftOAuthError(f"Failed to get user info: {response.text}")

            user_data = response.json()
            return {
                "sub": user_data.get("id"),
                "email": user_data.get("userPrincipalName") or user_data.get("mail"),
                "name": user_data.get("displayName"),
                "picture": None,  # Microsoft Graph doesn't return picture URL directly
            }
        except httpx.RequestError as e:
            raise MicrosoftOAuthError(f"Failed to reach Microsoft Graph API: {str(e)}")
        except Exception as e:
            raise MicrosoftOAuthError(f"Unexpected error getting user info: {str(e)}")

def generate_oauth_state() -> str:
    """Generate a random state string for OAuth flow."""
    return secrets.token_urlsafe(32)

def get_microsoft_client_id() -> str:
    """Get the Microsoft client ID from settings."""
    if not settings.MICROSOFT_CLIENT_ID:
        raise MicrosoftOAuthError("MICROSOFT_CLIENT_ID not configured")
    return settings.MICROSOFT_CLIENT_ID
