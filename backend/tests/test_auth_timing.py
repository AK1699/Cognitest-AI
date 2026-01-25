import sys
from unittest.mock import MagicMock

# Mock problematic modules BEFORE importing app.api.v1.auth
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()

import pytest
from unittest.mock import patch, AsyncMock
from fastapi import HTTPException, status
from app.schemas.user import UserLogin
from app.api.v1.auth import login
from app.models.user import User


@pytest.mark.asyncio
async def test_login_user_not_found_fix():
    """
    Test that verify_password IS called even when user is not found.
    This confirms the fix for the timing attack vulnerability.
    """
    # Setup mocks
    mock_db = AsyncMock()
    mock_response = MagicMock()

    # Mock the database result to return None (user not found)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    credentials = UserLogin(email="nonexistent@example.com", password="password123")

    # Patch verify_password in app.api.v1.auth namespace
    with patch("app.api.v1.auth.verify_password") as mock_verify_password:
        mock_verify_password.return_value = False

        # Expect 401 Unauthorized
        with pytest.raises(HTTPException) as exc_info:
            await login(credentials, mock_response, mock_db)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Incorrect email or password"

        # ASSERTION: verify_password SHOULD be called now (with dummy hash)
        mock_verify_password.assert_called_once()


@pytest.mark.asyncio
async def test_login_user_found_wrong_password():
    """
    Test that verify_password IS called when user is found.
    """
    # Setup mocks
    mock_db = AsyncMock()
    mock_response = MagicMock()

    # Mock the database result to return a User
    mock_user = MagicMock(spec=User)
    mock_user.email = "exist@example.com"
    mock_user.hashed_password = "hashed_secret"
    mock_user.is_active = True

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user
    mock_db.execute.return_value = mock_result

    credentials = UserLogin(email="exist@example.com", password="wrongpassword")

    # Patch verify_password in app.api.v1.auth namespace
    with patch("app.api.v1.auth.verify_password") as mock_verify_password:
        mock_verify_password.return_value = False

        # Expect 401 Unauthorized
        with pytest.raises(HTTPException) as exc_info:
            await login(credentials, mock_response, mock_db)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

        # ASSERTION: verify_password SHOULD be called here
        mock_verify_password.assert_called_once()
