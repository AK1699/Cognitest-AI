
import pytest
import os
import sys
from unittest.mock import MagicMock, AsyncMock, patch

# Set environment to use memory for rate limiting before importing app
os.environ["REDIS_URL"] = "memory://"
os.environ["RATE_LIMIT_ENABLED"] = "true"

# Mock dependencies to avoid import errors and Pydantic conflicts
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()
sys.modules["app.services.web_automation_service"] = MagicMock()

# Mock cognitest_common
mock_common = MagicMock()
mock_common.__path__ = []
sys.modules["cognitest_common"] = mock_common

# Create a mock module for gemini_service with a class attribute
mock_gemini_service_module = MagicMock()
class MockGeminiService:
    pass
mock_gemini_service_module.GeminiService = MockGeminiService
sys.modules["cognitest_common.gemini_service"] = mock_gemini_service_module

from fastapi.testclient import TestClient
from app.main import app
from app.core.deps import get_db

# Create a clean client for this test
client = TestClient(app)

@pytest.fixture
def mock_db_session():
    session = AsyncMock()
    # Mock execute result for user query
    result = MagicMock()
    user = MagicMock()
    user.id = "123e4567-e89b-12d3-a456-426614174000"
    user.email = "test@example.com"
    user.hashed_password = "hashed_secret"
    user.is_active = True
    user.mfa_enabled = False

    result.scalar_one_or_none.return_value = user
    session.execute.return_value = result
    return session

@pytest.fixture
def override_get_db(mock_db_session):
    async def _get_db():
        yield mock_db_session
    return _get_db

@pytest.mark.asyncio
async def test_login_rate_limiting(override_get_db):
    """
    Test that the login endpoint is rate limited.
    """
    # Override the dependency
    app.dependency_overrides[get_db] = override_get_db

    # Mock verify_password to always return True
    with patch("app.api.v1.auth.verify_password", return_value=True):

        # Make requests up to the expected limit + 1
        # We expect the limit to be 5/minute (if implemented)
        # So 6th request should fail with 429

        url = "/api/v1/auth/login"
        payload = {
            "email": "test@example.com",
            "password": "secret_password",
            "remember_me": False
        }

        # Reset limiter for this test
        # Note: In-memory limiter reset is tricky, but since we use a unique IP (client fixture),
        # it should be fine if we assume a fresh start or use different IPs.
        # However, TestClient uses "testclient" as host/ip usually.

        # We'll rely on the fact that this is a fresh run or we can mock the remote address if needed.

        responses = []
        for i in range(10):
            # Using X-Forwarded-For to simulate a specific IP for this test sequence
            headers = {"X-Forwarded-For": "192.168.1.100"}
            response = client.post(url, json=payload, headers=headers)
            responses.append(response)

            if response.status_code == 429:
                break

        # Check if we hit the rate limit
        rate_limited = any(r.status_code == 429 for r in responses)

        # For reproduction, we EXPECT this to be False (because it's not implemented yet)
        # But assert True to verify failure
        if not rate_limited:
            pytest.fail("Rate limiting not active on login endpoint! All requests succeeded.")

        # Clean up overrides
        app.dependency_overrides = {}
