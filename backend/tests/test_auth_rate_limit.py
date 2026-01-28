
import sys
from unittest.mock import MagicMock, AsyncMock

# Mock problematic modules to avoid Pydantic/Langchain conflicts
# as per memory instructions
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()

# Also mock internal services that might trigger these imports via web_automation
sys.modules["app.services.web_automation_service"] = MagicMock()
sys.modules["app.services.gemini_service"] = MagicMock()
sys.modules["app.services.prompt_to_steps"] = MagicMock()
# Mocking cognitest_common as it was missing too
sys.modules["cognitest_common"] = MagicMock()
sys.modules["cognitest_common.gemini_service"] = MagicMock()

import pytest
import os
from httpx import AsyncClient

# We need to set this before importing app.main if we want to ensure memory backend
os.environ["REDIS_URL"] = "memory://"

from app.main import app
from app.core.deps import get_db
from sqlalchemy.ext.asyncio import AsyncSession

# Mock DB dependency logic
async def override_get_db():
    mock_session = AsyncMock(spec=AsyncSession)
    # Mock execute result for user lookup to return None (user not found)
    # This ensures 401 Unauthorized which is what we want for invalid creds
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    yield mock_session

# Fixture to apply and cleanup dependency override
@pytest.fixture
def mock_db_dependency():
    app.dependency_overrides[get_db] = override_get_db
    yield
    # Clean up
    if get_db in app.dependency_overrides:
        del app.dependency_overrides[get_db]

@pytest.mark.asyncio
async def test_login_rate_limit(mock_db_dependency):
    """
    Test rate limiting on login endpoint.
    Expect 429 after 5 requests (limit is 5/minute).
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        status_codes = []
        for i in range(10):
            response = await ac.post(
                "/api/v1/auth/login",
                json={"email": "rate_limit_test@example.com", "password": "WrongPassword123!"}
            )
            status_codes.append(response.status_code)

        print(f"Status codes: {status_codes}")

        # Verify we got 10 responses
        assert len(status_codes) == 10

        # Verify first 5 are 401 (Allowed)
        for i, code in enumerate(status_codes[:5]):
            assert code == 401, f"Request {i+1}: Expected 401, got {code}"

        # Verify subsequent requests are 429 (Blocked)
        for i, code in enumerate(status_codes[5:]):
            assert code == 429, f"Request {i+6}: Expected 429, got {code}"
