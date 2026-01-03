"""
MFA (Multi-Factor Authentication) utilities for TOTP-based 2FA.

This module provides functions for:
- Generating TOTP secrets
- Creating QR code URIs for authenticator apps
- Verifying TOTP tokens
- Managing backup codes
"""

import secrets
import hashlib
from typing import Optional, List, Tuple
import pyotp
import qrcode
import qrcode.image.svg
from io import BytesIO
import base64


def generate_mfa_secret() -> str:
    """
    Generate a new MFA secret for TOTP.
    
    Returns:
        A base32-encoded secret key (32 characters)
    """
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "Cognitest") -> str:
    """
    Generate a TOTP provisioning URI for use with authenticator apps.
    
    Args:
        secret: The base32-encoded secret key
        email: User's email address (used as the account name)
        issuer: The issuer name (displayed in authenticator app)
    
    Returns:
        A otpauth:// URI string
    """
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def generate_qr_code_base64(uri: str) -> str:
    """
    Generate a QR code image for the given URI and return it as base64.
    
    Args:
        uri: The otpauth:// URI to encode
    
    Returns:
        Base64-encoded PNG image data
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def verify_totp(secret: str, token: str, window: int = 1) -> bool:
    """
    Verify a TOTP token against the secret.
    
    Args:
        secret: The base32-encoded secret key
        token: The 6-digit token to verify
        window: Number of time windows to check before/after current time
                (default: 1, meaning ±30 seconds tolerance)
    
    Returns:
        True if the token is valid, False otherwise
    """
    if not secret or not token:
        return False
    
    # Normalize token (remove spaces, ensure 6 digits)
    token = token.replace(" ", "").strip()
    if len(token) != 6 or not token.isdigit():
        return False
    
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=window)


def generate_backup_codes(count: int = 10) -> Tuple[List[str], List[str]]:
    """
    Generate a set of backup codes for MFA recovery.
    
    Args:
        count: Number of backup codes to generate (default: 10)
    
    Returns:
        A tuple of (plain_codes, hashed_codes)
        - plain_codes: The plaintext codes to show to the user (once)
        - hashed_codes: The hashed codes to store in the database
    """
    plain_codes = []
    hashed_codes = []
    
    for _ in range(count):
        # Generate an 8-character alphanumeric code
        code = secrets.token_hex(4).upper()  # 8 hex characters
        formatted_code = f"{code[:4]}-{code[4:]}"  # Format as XXXX-XXXX
        
        plain_codes.append(formatted_code)
        hashed_codes.append(hash_backup_code(formatted_code))
    
    return plain_codes, hashed_codes


def hash_backup_code(code: str) -> str:
    """
    Hash a backup code for secure storage.
    
    Args:
        code: The plaintext backup code
    
    Returns:
        SHA-256 hash of the code
    """
    # Normalize: remove dashes and uppercase
    normalized = code.replace("-", "").upper()
    return hashlib.sha256(normalized.encode()).hexdigest()


def verify_backup_code(code: str, hashed_codes: List[str]) -> Optional[int]:
    """
    Verify a backup code against the stored hashed codes.
    
    Args:
        code: The plaintext backup code to verify
        hashed_codes: List of hashed backup codes from the database
    
    Returns:
        The index of the matching code if found, None otherwise.
        The caller should remove the used code from the list.
    """
    if not code or not hashed_codes:
        return None
    
    hashed_input = hash_backup_code(code)
    
    for i, stored_hash in enumerate(hashed_codes):
        if stored_hash == hashed_input:
            return i
    
    return None
