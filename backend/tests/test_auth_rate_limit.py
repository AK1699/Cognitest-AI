
import sys
from unittest.mock import MagicMock

# Mock modules to avoid Pydantic/Langchain version conflicts
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["app.services.web_automation_service"] = MagicMock()

# Mock cognitest_common package
mock_common = MagicMock()
mock_common.__path__ = []
sys.modules["cognitest_common"] = mock_common


# Mock GeminiService as a class
class MockGeminiService:
    pass


mock_gemini_module = MagicMock()
mock_gemini_module.GeminiService = MockGeminiService
sys.modules["cognitest_common.gemini_service"] = mock_gemini_module

import pytest  # noqa: E402
from httpx import AsyncClient, ASGITransport  # noqa: E402
from app.main import app  # noqa: E402


# Mock dependencies to avoid DB calls
@pytest.fixture
def override_dependency():
    from app.core.deps import get_db
    mock_db = MagicMock()

    async def mock_execute(*args, **kwargs):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_db] = lambda: mock_db
    yield
    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_login_rate_limit(override_dependency):
    # We use app object directly with ASGITransport
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:

        # First 5 requests should pass (return 401 because mock DB returns no user)
        for i in range(5):
            response = await ac.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "wrongpassword"}
            )
            assert response.status_code == 401, (
                f"Request {i+1} failed with status {response.status_code}"
            )

        # Subsequent requests should fail with 429 Too Many Requests
        # We try a few times to be sure
        rate_limited = False
        for i in range(5):
            response = await ac.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "wrongpassword"}
            )
            if response.status_code == 429:
                rate_limited = True
                break

        assert rate_limited, "Rate limit was not triggered after >5 requests"
