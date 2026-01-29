import sys
from unittest.mock import MagicMock
from sqlalchemy.orm import declarative_base

# Mock dependencies to avoid Pydantic conflicts and external dependencies
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()
sys.modules["app.services.web_automation_service"] = MagicMock()
sys.modules["cognitest_common"] = MagicMock()

# Improve mocking for GeminiService to avoid typing issues
mock_gemini_module = MagicMock()
class MockGeminiService:
    def __init__(self, *args, **kwargs): pass
    async def generate_completion(self, *args, **kwargs): return "mocked"
    async def create_embedding(self, *args, **kwargs): return [0.1]

mock_gemini_module.GeminiService = MockGeminiService
sys.modules["cognitest_common.gemini_service"] = mock_gemini_module

# Mock database to prevent connection attempts
mock_db_module = MagicMock()
class MockSession:
    async def __aenter__(self): return MagicMock()
    async def __aexit__(self, *args): pass
    async def execute(self, *args):
        m = MagicMock()
        m.scalar_one_or_none.return_value = None # No user found, triggers 401
        return m
    def add(self, *args): pass
    async def commit(self): pass
    async def close(self): pass
    async def refresh(self, *args): pass

# Use real declarative base for models to work with select()
MockBase = declarative_base()

mock_db_module.Base = MockBase
mock_db_module.AsyncSessionLocal = MagicMock(return_value=MockSession())
sys.modules["app.core.database"] = mock_db_module

import pytest
from httpx import AsyncClient
from app.main import app
from app.core.rate_limiter import limiter
from app.core.deps import get_db

@pytest.mark.asyncio
async def test_login_rate_limit():
    """
    Test that the login endpoint is rate limited to 5 requests per minute.
    """
    # Force the limiter to be enabled for this test
    limiter.enabled = True

    # Override get_db dependency to use our MockSession
    async def mock_get_db():
        yield MockSession()
    app.dependency_overrides[get_db] = mock_get_db

    # Use a unique IP for this test to avoid conflicts with other tests if any
    headers = {"X-Forwarded-For": "192.168.1.200"}

    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Hit the login endpoint 5 times (allowed)
        for i in range(5):
            # We don't care about the credentials being valid, just the rate limit
            # Invalid credentials return 401
            response = await ac.post("/api/v1/auth/login", json={
                "email": "test@example.com",
                "password": "wrongpassword",
                "remember_me": False
            }, headers=headers)

            # If the rate limit is already triggered (e.g. from previous runs), wait or assert 429 is possible
            if response.status_code == 429:
                pytest.skip("Rate limit already active from previous tests")

            assert response.status_code == 401, f"Request {i+1} failed with {response.status_code}"

        # 2. Hit the login endpoint one more time (should be blocked)
        response = await ac.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword",
            "remember_me": False
        }, headers=headers)

        assert response.status_code == 429, f"Rate limit not enforced. Status: {response.status_code}, Body: {response.text}"

    # Cleanup
    app.dependency_overrides = {}
