import sys
from unittest.mock import MagicMock, AsyncMock, patch
import os
import pytest
from httpx import AsyncClient

# Mock AI service and langchain modules to avoid Pydantic version conflicts
# as per AGENTS.md / repository guidelines
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()
sys.modules["langchain_core"] = MagicMock()
sys.modules["langchain_core.callbacks"] = MagicMock()
sys.modules["langchain_core.callbacks.manager"] = MagicMock()

# Ensure rate limiting is enabled for tests, but use memory storage
os.environ["RATE_LIMIT_ENABLED"] = "true"
os.environ["REDIS_URL"] = "memory://"

# Mock Database and Redis before importing app to avoid connection errors during tests
with patch("app.core.database.AsyncSessionLocal", new=MagicMock()) as mock_db, \
     patch("app.core.cache.get_redis_client", new=AsyncMock()) as mock_redis, \
     patch("app.main.initialize_permissions", new=AsyncMock()):

    # Mock get_db dependency
    mock_session = AsyncMock()

    # Configure execute to return a result that behaves like SQLAlchemy result
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None # User not found
    mock_session.execute.return_value = mock_result

    mock_db.return_value = mock_session

    from app.main import app
    from app.core.deps import get_db

    # Override the dependency
    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def api_client():
    return AsyncClient(app=app, base_url="http://test")

@pytest.mark.asyncio
async def test_auth_rate_limiting(api_client):
    """
    Test that authentication endpoints are rate limited.
    """
    # We'll use a unique email to avoid conflicting with other tests/db state
    login_data = {
        "email": "rate_limit_test@example.com",
        "password": "wrongpassword",
        "remember_me": False
    }

    # The limit we expect to set is 5/minute
    limit = 5

    # Make requests up to the limit
    for i in range(limit):
        response = await api_client.post("/api/v1/auth/login", json=login_data)

        # We expect 401 because we mocked user not found
        assert response.status_code != 429, f"Request {i+1} was rate limited prematurely"
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    # The next request should be rate limited
    response = await api_client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 429, f"Rate limiting failed. Status: {response.status_code}"
    # Verify we get the standard 429 response structure if available
    # or just the status code is enough.
