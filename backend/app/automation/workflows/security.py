"""
Credential Encryption Utility
Secure encryption/decryption for workflow credentials using Fernet
"""
import os
import json
import base64
import logging
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

from app.core.config import settings

logger = logging.getLogger(__name__)


class CredentialEncryption:
    """
    Handles encryption and decryption of workflow credentials.
    Uses Fernet symmetric encryption with a derived key from the secret.
    """
    
    _instance: Optional['CredentialEncryption'] = None
    _fernet: Optional[Fernet] = None
    
    def __init__(self):
        self._initialize_encryption()
    
    @classmethod
    def get_instance(cls) -> 'CredentialEncryption':
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def _initialize_encryption(self):
        """Initialize Fernet encryption with derived key"""
        # Get secret key from settings
        secret_key = getattr(settings, 'CREDENTIAL_ENCRYPTION_KEY', None)
        
        if not secret_key:
            # Fall back to SECRET_KEY if no specific key is set
            secret_key = getattr(settings, 'SECRET_KEY', 'default-dev-key-change-in-production')
            logger.warning("Using fallback SECRET_KEY for credential encryption. Set CREDENTIAL_ENCRYPTION_KEY in production.")
        
        # Derive a Fernet-compatible key using PBKDF2
        # Salt should be consistent for the same installation
        salt = getattr(settings, 'CREDENTIAL_SALT', b'cognitest-workflow-creds').encode() if isinstance(
            getattr(settings, 'CREDENTIAL_SALT', b'cognitest-workflow-creds'), str
        ) else getattr(settings, 'CREDENTIAL_SALT', b'cognitest-workflow-creds')
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(secret_key.encode()))
        self._fernet = Fernet(key)
    
    def encrypt(self, data: Dict[str, Any]) -> bytes:
        """
        Encrypt credential data.
        
        Args:
            data: Dictionary containing credential fields
            
        Returns:
            Encrypted bytes
        """
        if not self._fernet:
            raise RuntimeError("Encryption not initialized")
        
        try:
            # Convert to JSON string
            json_data = json.dumps(data, default=str)
            
            # Encrypt
            encrypted = self._fernet.encrypt(json_data.encode('utf-8'))
            
            return encrypted
        
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt(self, encrypted_data: bytes) -> Dict[str, Any]:
        """
        Decrypt credential data.
        
        Args:
            encrypted_data: Encrypted bytes
            
        Returns:
            Decrypted dictionary
        """
        if not self._fernet:
            raise RuntimeError("Encryption not initialized")
        
        try:
            # Decrypt
            decrypted = self._fernet.decrypt(encrypted_data)
            
            # Parse JSON
            data = json.loads(decrypted.decode('utf-8'))
            
            return data
        
        except InvalidToken:
            logger.error("Decryption failed: Invalid token")
            raise ValueError("Failed to decrypt credentials: Invalid encryption key or corrupted data")
        
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def rotate_key(self, old_key: str, new_key: str, encrypted_data: bytes) -> bytes:
        """
        Rotate encryption key - decrypt with old, encrypt with new.
        
        Args:
            old_key: Previous encryption key
            new_key: New encryption key
            encrypted_data: Data encrypted with old key
            
        Returns:
            Data encrypted with new key
        """
        # Create Fernet with old key
        old_salt = getattr(settings, 'CREDENTIAL_SALT', b'cognitest-workflow-creds')
        if isinstance(old_salt, str):
            old_salt = old_salt.encode()
        
        old_kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=old_salt,
            iterations=100000,
            backend=default_backend()
        )
        old_fernet_key = base64.urlsafe_b64encode(old_kdf.derive(old_key.encode()))
        old_fernet = Fernet(old_fernet_key)
        
        # Decrypt with old key
        decrypted = old_fernet.decrypt(encrypted_data)
        data = json.loads(decrypted.decode('utf-8'))
        
        # Create Fernet with new key
        new_kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=old_salt,
            iterations=100000,
            backend=default_backend()
        )
        new_fernet_key = base64.urlsafe_b64encode(new_kdf.derive(new_key.encode()))
        new_fernet = Fernet(new_fernet_key)
        
        # Encrypt with new key
        json_data = json.dumps(data, default=str)
        encrypted = new_fernet.encrypt(json_data.encode('utf-8'))
        
        return encrypted
    
    @staticmethod
    def generate_key() -> str:
        """Generate a new random encryption key"""
        return Fernet.generate_key().decode()
    
    @staticmethod
    def mask_sensitive(data: Dict[str, Any], mask_fields: list[str] = None) -> Dict[str, Any]:
        """
        Mask sensitive fields in credential data for display.
        
        Args:
            data: Credential data
            mask_fields: List of field names to mask (defaults to common sensitive fields)
            
        Returns:
            Copy of data with masked fields
        """
        if mask_fields is None:
            mask_fields = [
                'password', 'secret', 'token', 'api_key', 'apikey', 
                'access_token', 'refresh_token', 'private_key', 'key',
                'smtp_password', 'api_token', 'bearer_token'
            ]
        
        masked = {}
        for key, value in data.items():
            if any(field in key.lower() for field in mask_fields):
                if isinstance(value, str) and len(value) > 4:
                    masked[key] = f"{value[:2]}{'*' * (len(value) - 4)}{value[-2:]}"
                else:
                    masked[key] = "****"
            else:
                masked[key] = value
        
        return masked


# Global instance
credential_encryption = CredentialEncryption.get_instance()


def encrypt_credentials(data: Dict[str, Any]) -> bytes:
    """Convenience function to encrypt credentials"""
    return credential_encryption.encrypt(data)


def decrypt_credentials(encrypted_data: bytes) -> Dict[str, Any]:
    """Convenience function to decrypt credentials"""
    return credential_encryption.decrypt(encrypted_data)
