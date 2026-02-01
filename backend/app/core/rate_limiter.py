"""
Rate Limiting Configuration for Security API
Uses slowapi with Redis backend for distributed rate limiting
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from typing import Callable, Optional
import os
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# Configuration
# ============================================================================

# Rate limiting configuration
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

# Default rate limits
DEFAULT_RATE_LIMIT = "100/minute"  # General endpoints
SCAN_RATE_LIMIT = "10/minute"      # Security scan endpoints (more restrictive)
REPORT_RATE_LIMIT = "30/minute"    # Report generation
AUTH_RATE_LIMIT = "5/minute"       # Authentication endpoints (very restrictive)


# ============================================================================
# Key Functions
# ============================================================================

def get_user_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting
    Uses user ID from auth token if available, falls back to IP address
    """
    # Try to get user ID from request state (set by auth middleware)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"
    
    # Try to get from authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # Use first 16 chars of token as identifier (not full token for security)
        token_prefix = auth_header[7:23]
        return f"token:{token_prefix}"
    
    # Fall back to IP address
    return get_remote_address(request)


def get_scan_key(request: Request) -> str:
    """Get rate limiting key for scan endpoints - more restrictive"""
    base_key = get_user_identifier(request)
    return f"scan:{base_key}"


# ============================================================================
# Limiter Setup
# ============================================================================

def create_limiter() -> Limiter:
    """Create and configure the rate limiter"""
    if not RATE_LIMIT_ENABLED:
        logger.info("Rate limiting is disabled")
        return Limiter(
            key_func=get_user_identifier,
            enabled=False
        )
    
    try:
        # Try to use Redis for distributed rate limiting
        limiter = Limiter(
            key_func=get_user_identifier,
            storage_uri=REDIS_URL,
            strategy="fixed-window",
            headers_enabled=True
        )
        logger.info(f"Rate limiter initialized with Redis: {REDIS_URL}")
        return limiter
    except Exception as e:
        logger.warning(f"Failed to connect to Redis for rate limiting: {e}")
        logger.info("Falling back to in-memory rate limiting")
        
        # Fall back to in-memory storage
        return Limiter(
            key_func=get_user_identifier,
            storage_uri="memory://",
            strategy="fixed-window",
            headers_enabled=True
        )


# Global limiter instance
limiter = create_limiter()


# ============================================================================
# Rate Limit Decorators
# ============================================================================

def limit_scan_requests() -> Callable:
    """Rate limit decorator for scan endpoints"""
    return limiter.limit(SCAN_RATE_LIMIT, key_func=get_scan_key)


def limit_report_requests() -> Callable:
    """Rate limit decorator for report endpoints"""
    return limiter.limit(REPORT_RATE_LIMIT)


def limit_default() -> Callable:
    """Default rate limit decorator"""
    return limiter.limit(DEFAULT_RATE_LIMIT)


# ============================================================================
# FastAPI Integration
# ============================================================================

def setup_rate_limiting(app: FastAPI):
    """
    Set up rate limiting for a FastAPI application
    
    Usage:
        from app.core.rate_limiter import setup_rate_limiting
        app = FastAPI()
        setup_rate_limiting(app)
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("Rate limiting middleware configured")


# ============================================================================
# Rate Limit Info
# ============================================================================

class RateLimitInfo:
    """Helper class to get rate limit information"""
    
    @staticmethod
    def get_limits() -> dict:
        """Get current rate limit configuration"""
        return {
            "enabled": RATE_LIMIT_ENABLED,
            "default_limit": DEFAULT_RATE_LIMIT,
            "scan_limit": SCAN_RATE_LIMIT,
            "report_limit": REPORT_RATE_LIMIT,
            "auth_limit": AUTH_RATE_LIMIT,
            "storage": REDIS_URL if RATE_LIMIT_ENABLED else "memory"
        }
    
    @staticmethod
    def get_remaining(request: Request) -> Optional[dict]:
        """Get remaining rate limit for current request"""
        if not RATE_LIMIT_ENABLED:
            return None
        
        # Headers are set by slowapi
        return {
            "limit": request.headers.get("X-RateLimit-Limit"),
            "remaining": request.headers.get("X-RateLimit-Remaining"),
            "reset": request.headers.get("X-RateLimit-Reset")
        }


# Export all
__all__ = [
    "limiter",
    "limit_scan_requests",
    "limit_report_requests", 
    "limit_default",
    "setup_rate_limiting",
    "RateLimitInfo",
    "SCAN_RATE_LIMIT",
    "REPORT_RATE_LIMIT",
    "DEFAULT_RATE_LIMIT",
    "AUTH_RATE_LIMIT"
]
