"""
Apple OAuth 2.0 utilities for authentication.
Supports Sign in with Apple.
"""

import json
import httpx
from jose import jwt
from typing import Dict, Optional
from datetime import datetime, timedelta
from ..core.config import settings
import secrets

class AppleOAuthError(Exception):
    """Exception raised for Apple OAuth errors."""
    pass

async def get_apple_authorization_url(state: str) -> str:
    """
    Generate the Apple OAuth authorization URL.

    Args:
        state: A random string used to prevent CSRF attacks

    Returns:
        The authorization URL to redirect the user to
    """
    if not settings.APPLE_CLIENT_ID:
        raise AppleOAuthError("APPLE_CLIENT_ID not configured")

    params = {
        "client_id": settings.APPLE_CLIENT_ID,
        "redirect_uri": settings.APPLE_REDIRECT_URI,
        "response_type": "code id_token",
        "scope": "name email",
        "state": state,
        "response_mode": "form_post",
        "use_popup": "true",
    }

    param_str = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"https://appleid.apple.com/auth/authorize?{param_str}"

async def exchange_code_for_token(code: str) -> Dict:
    """
    Exchange the authorization code for an access token.

    Args:
        code: The authorization code from Apple

    Returns:
        Dictionary containing access_token, id_token, etc.

    Raises:
        AppleOAuthError: If token exchange fails
    """
    if not settings.APPLE_CLIENT_ID or not settings.APPLE_CLIENT_SECRET:
        raise AppleOAuthError("Apple OAuth credentials not configured")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://appleid.apple.com/auth/token",
                data={
                    "code": code,
                    "client_id": settings.APPLE_CLIENT_ID,
                    "client_secret": settings.APPLE_CLIENT_SECRET,
                    "redirect_uri": settings.APPLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
                timeout=10.0,
            )

            if response.status_code != 200:
                raise AppleOAuthError(f"Failed to exchange code for token: {response.text}")

            return response.json()
        except httpx.RequestError as e:
            raise AppleOAuthError(f"Failed to reach Apple OAuth endpoint: {str(e)}")
        except Exception as e:
            raise AppleOAuthError(f"Unexpected error during token exchange: {str(e)}")

async def get_user_info_from_id_token(id_token: str) -> Dict:
    """
    Decode and verify the ID token to get user information.

    Note: This is a simplified version. In production, you should verify the token signature
    using Apple's public keys from: https://appleid.apple.com/auth/keys

    Args:
        id_token: The ID token from Apple

    Returns:
        Dictionary containing user information (sub, email, name, etc.)

    Raises:
        AppleOAuthError: If token decoding fails
    """
    try:
        # Decode without verification (simplified)
        # In production, verify signature using Apple's JWKS endpoint
        decoded = jwt.get_unverified_claims(id_token)

        # Apple returns user info differently
        # User details might be in the authorization response body, not just the token
        return {
            "sub": decoded.get("sub"),
            "email": decoded.get("email"),
            "name": None,  # Apple doesn't include name in ID token
            "picture": None,
        }
    except Exception as e:
        raise AppleOAuthError(f"Failed to decode ID token: {str(e)}")

def parse_apple_user_response(user_json: Optional[str]) -> Dict:
    """
    Parse user information from Apple's response body.

    Apple returns user info in the POST body, not in the token.
    The user object is only sent on first sign-in.

    Args:
        user_json: JSON string containing user information

    Returns:
        Dictionary with user details
    """
    if not user_json:
        return {}

    try:
        user_data = json.loads(user_json)
        return {
            "name": user_data.get("name", {}).get("firstName", "")
                   + " " + user_data.get("name", {}).get("lastName", ""),
            "email": user_data.get("email"),
        }
    except Exception as e:
        raise AppleOAuthError(f"Failed to parse Apple user response: {str(e)}")

def generate_oauth_state() -> str:
    """Generate a random state string for OAuth flow."""
    return secrets.token_urlsafe(32)

def get_apple_client_id() -> str:
    """Get the Apple client ID from settings."""
    if not settings.APPLE_CLIENT_ID:
        raise AppleOAuthError("APPLE_CLIENT_ID not configured")
    return settings.APPLE_CLIENT_ID

def generate_apple_client_secret() -> str:
    """
    Generate Apple client secret (JWT).

    Apple requires generating a JWT as the client secret.
    In production, you should cache this and refresh it periodically.

    This is a simplified placeholder. Full implementation requires:
    - Private key file (from Apple Developer account)
    - Team ID and Key ID from Apple
    """
    if not all([settings.APPLE_CLIENT_ID, settings.APPLE_TEAM_ID, settings.APPLE_KEY_ID]):
        raise AppleOAuthError("Apple configuration incomplete (missing TEAM_ID or KEY_ID)")

    # This requires the private key to be available in settings
    # For now, return the static secret if configured
    if settings.APPLE_CLIENT_SECRET:
        return settings.APPLE_CLIENT_SECRET

    raise AppleOAuthError("Apple client secret not configured")
