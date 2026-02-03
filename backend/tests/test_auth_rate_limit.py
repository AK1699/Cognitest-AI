import sys
import types
import os
from unittest.mock import MagicMock, AsyncMock

# Set REDIS_URL to memory to use in-memory rate limiting
os.environ["REDIS_URL"] = "memory://"

# Apply mocks as per memory instructions
try:
    # Mock app.core.database BEFORE app.main import
    database = types.ModuleType("app.core.database")
    database.AsyncSessionLocal = MagicMock()
    # Mock context manager for AsyncSessionLocal
    database.AsyncSessionLocal.return_value.__aenter__ = AsyncMock()
    database.AsyncSessionLocal.return_value.__aexit__ = AsyncMock()

    async def mock_get_db():
        db = MagicMock()
        db.execute = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute.return_value = mock_result
        db.commit = AsyncMock()
        db.refresh = AsyncMock()
        yield db

    database.get_db = mock_get_db

    from sqlalchemy.orm import declarative_base

    database.Base = declarative_base()
    sys.modules["app.core.database"] = database

    # Other mocks
    sys.modules["app.services.ai_service"] = MagicMock()
    sys.modules["langchain_openai"] = MagicMock()
    sys.modules["langsmith"] = MagicMock()
    sys.modules["app.services.web_automation_service"] = MagicMock()

    # Mock cognitest_common as a package
    cognitest_common = types.ModuleType("cognitest_common")
    cognitest_common.__path__ = []
    sys.modules["cognitest_common"] = cognitest_common

    # Mock cognitest_common.gemini_service with a real class for GeminiService
    gemini_service = types.ModuleType("cognitest_common.gemini_service")

    class SharedGeminiService:
        pass

    gemini_service.GeminiService = SharedGeminiService
    sys.modules["cognitest_common.gemini_service"] = gemini_service
    cognitest_common.gemini_service = gemini_service

except Exception as e:
    print(f"Warning during mocking: {e}")

import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_auth_rate_limiting():
    """
    Test that authentication endpoints are rate limited.
    We expect a limit of 5 requests per minute.
    """
    # Create a unique IP for this test to avoid conflicts if limiter is global/shared
    headers = {"X-Forwarded-For": "10.0.0.1"}

    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Try to login 10 times
        for i in range(10):
            # We need to expect that the DB call might fail or return mock
            # But the rate limiter should run BEFORE the DB call.
            # If we get 500 because of DB mock issues, it's fine as long as it's not 429.
            # But wait, slowapi might run after some other middleware.

            try:
                response = await ac.post(
                    "/api/v1/auth/login",
                    json={
                        "email": "test@example.com",
                        "password": "WrongPassword123!",
                        "remember_me": False,
                    },
                    headers=headers,
                )

                print(f"Request {i+1}: Status {response.status_code}")

                # The first 5 should be processed (likely 500 because of mocked DB, or 401/404)
                if i < 5:
                    # We expect normal processing failure, not rate limit
                    assert (
                        response.status_code != 429
                    ), f"Request {i+1} was rate limited prematurely"
                else:
                    # If rate limiting is working, this should be 429
                    # Note: Since we are in the "reproduction" phase, we expect this assertion to FAIL
                    # because currently there is NO rate limiting.
                    assert (
                        response.status_code == 429
                    ), f"Request {i+1} was not rate limited. Status: {response.status_code}"

            except Exception as e:
                print(f"Request {i+1} raised exception: {e}")
                if i >= 5:
                    # If we are expecting 429 but got an exception, it's a failure of rate limiting (unless exception is 429)
                    pytest.fail(
                        f"Request {i+1} failed with exception instead of 429: {e}"
                    )
