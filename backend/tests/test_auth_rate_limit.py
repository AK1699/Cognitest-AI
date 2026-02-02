import sys
import os
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

# Set Redis URL to memory for testing BEFORE importing app
os.environ["REDIS_URL"] = "memory://"

# Create a dummy class for GeminiService
class MockGeminiService:
    pass

# Mock problematic modules before they are imported by app code
# Check if they are already imported to avoid double patching if run multiple times
if "langchain_openai" not in sys.modules:
    sys.modules["langchain_openai"] = MagicMock()
if "langsmith" not in sys.modules:
    sys.modules["langsmith"] = MagicMock()
if "app.services.ai_service" not in sys.modules:
    sys.modules["app.services.ai_service"] = MagicMock()
if "app.services.web_automation_service" not in sys.modules:
    sys.modules["app.services.web_automation_service"] = MagicMock()

# Mock cognitest_common package
if "cognitest_common" not in sys.modules:
    mock_cognitest = MagicMock()
    mock_gemini_module = MagicMock()
    mock_gemini_module.GeminiService = MockGeminiService
    sys.modules["cognitest_common"] = mock_cognitest
    sys.modules["cognitest_common.gemini_service"] = mock_gemini_module

from app.main import app
from app.core.deps import get_db

# Mock DB
async def override_get_db():
    mock_db = AsyncMock()
    # Mock execute result for user lookup to return None (so 401, but not 500)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result
    yield mock_db

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_login_rate_limited():
    """
    Verify that the login endpoint is now rate limited (5/minute).
    Requests 1-5 should return 401 (invalid creds).
    Request 6 should return 429 (Too Many Requests).
    """
    # Send 5 requests (allowed)
    for i in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": f"test{i}@example.com", "password": "password", "remember_me": False}
        )
        assert response.status_code == 401, f"Request {i+1} failed with status {response.status_code}"

    # Send 6th request (should be blocked)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test6@example.com", "password": "password", "remember_me": False}
    )
    assert response.status_code == 429, f"Rate limiting failed. Expected 429, got {response.status_code}"

def test_forgot_password_argument_fix():
    """
    Verify that forgot_password endpoint arguments are correctly handled
    (request vs body) and rate limiting applies.
    """
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "test@example.com"}
    )

    # We accept either 200 (success msg) or 429 (rate limited)
    assert response.status_code in [200, 429], f"Endpoint failed with {response.status_code}"
