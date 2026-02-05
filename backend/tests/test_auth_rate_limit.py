
import os
import sys
from unittest.mock import MagicMock, AsyncMock, patch
import pytest

# Set env vars BEFORE importing app
os.environ["REDIS_URL"] = "memory://"
os.environ["RATE_LIMIT_ENABLED"] = "true"
os.environ["SECRET_KEY"] = "test-secret-key"

# Create a dummy class for SharedGeminiService to avoid ForwardRef issues
class SharedGeminiService:
    def generate_content(self, *args, **kwargs):
        pass

# Mock complex dependencies
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()
sys.modules["app.services.web_automation_service"] = MagicMock()

# Mock cognitest_common package structure
cognitest_common = MagicMock()
cognitest_common.__path__ = []
cognitest_common.gemini_service.GeminiService = SharedGeminiService
sys.modules["cognitest_common"] = cognitest_common

# Also mock the submodule specifically
gemini_service_module = MagicMock()
gemini_service_module.GeminiService = SharedGeminiService
sys.modules["cognitest_common.gemini_service"] = gemini_service_module

# Mock database imports
with patch("app.core.database.AsyncSessionLocal", MagicMock()):
    from app.main import app
    from app.core.database import get_db

from fastapi.testclient import TestClient

client = TestClient(app)

def test_login_rate_limit():
    # Override dependency
    async def mock_get_db():
        session = MagicMock()
        # session.execute must be async
        session.execute = AsyncMock()
        result = MagicMock()
        # Return None so we get 401/404 for login, but rate limit should still increment
        result.scalar_one_or_none.return_value = None
        session.execute.return_value = result
        yield session

    app.dependency_overrides[get_db] = mock_get_db

    payload = {"email": "test@example.com", "password": "password", "remember_me": False}

    # We assume clean state because "memory://" storage is used.
    # However, since TestClient keeps the app alive, previous tests might affect state if running in same process.
    # But here we are running just this test file usually.

    for i in range(5):
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code != 429, f"Request {i+1} was rate limited unexpectedly"

    # 6th request
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 429, "Rate limit did not kick in on 6th request"
