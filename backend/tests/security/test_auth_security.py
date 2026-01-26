import sys
import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Mock problematic modules BEFORE importing app modules
# These mocks are necessary to bypass Pydantic/Langchain conflicts during import
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()
sys.modules["app.services.web_automation_service"] = MagicMock()

# Ensure we use memory storage for rate limiting in tests
os.environ["RATE_LIMIT_ENABLED"] = "true"
os.environ["REDIS_URL"] = "memory://"

def test_auth_rate_limiting():
    """Test that auth endpoints are rate limited."""
    # Import inside test to ensure mocks are active
    from app.api.v1.auth import router as auth_router
    from app.core.rate_limiter import setup_rate_limiting, limiter
    from app.core.deps import get_db
    from sqlalchemy.ext.asyncio import AsyncSession

    # Create app
    app = FastAPI()
    setup_rate_limiting(app)
    app.include_router(auth_router, prefix="/auth")

    # Mock database dependency
    async def override_get_db():
        session = MagicMock(spec=AsyncSession)
        # Mock execute result for user lookup
        result = MagicMock()
        result.scalar_one_or_none.return_value = None # No user found
        session.execute.return_value = result
        yield session

    app.dependency_overrides[get_db] = override_get_db

    client = TestClient(app)

    # Test Login Rate Limit (10/minute)
    print("\nTesting Login Rate Limit...")
    blocked = False
    for i in range(15):
        response = client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "password", "remember_me": False}
        )
        if response.status_code == 429:
            blocked = True
            print(f"Blocked at request {i+1}")
            break

    assert blocked, "Login endpoint should be rate limited after 10 requests"

    # Reset limiter (slowapi keeps state in memory)
    # Ideally we would reset the limiter, but it's complex.
    # Instead, we test another endpoint with a different key/limit

    # Test Forgot Password Rate Limit (3/minute)
    print("Testing Forgot Password Rate Limit...")
    blocked = False
    for i in range(10):
        # Using a different IP or user ID effectively if we could, but here same client
        response = client.post(
            "/auth/forgot-password",
            json={"email": "test@example.com"}
        )
        if response.status_code == 429:
            blocked = True
            print(f"Blocked at request {i+1}")
            break

    assert blocked, "Forgot Password endpoint should be rate limited after 3 requests"

def test_secrets_usage():
    """Verify that secrets module is used instead of random."""
    from app.api.v1 import auth
    import secrets
    import inspect

    # Verify secrets module is imported
    assert auth.secrets is secrets

    # Inspect source code of forgot_password
    source = inspect.getsource(auth.forgot_password)

    # Check for usage of secrets.choice
    assert "secrets.choice" in source
    assert "random.choices" not in source

    print("\nSecrets module usage verified.")

if __name__ == "__main__":
    test_auth_rate_limiting()
    test_secrets_usage()
