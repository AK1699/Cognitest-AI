import sys
from unittest.mock import MagicMock

# Mock AI service and langchain modules to avoid pydantic/langchain issues
# This must be done before importing app modules that might trigger these imports
sys.modules["app.services.ai_service"] = MagicMock()
sys.modules["app.services.prompt_to_steps"] = MagicMock()
sys.modules["langchain_openai"] = MagicMock()
sys.modules["langsmith"] = MagicMock()
sys.modules["langsmith.schemas"] = MagicMock()

import pytest
from unittest.mock import AsyncMock, patch
from fastapi import Response, HTTPException, status
from app.schemas.user import UserLogin
from app.models.user import User

# Need to set up python path for this to work, handled in execution step

@pytest.mark.asyncio
async def test_login_timing_attack_mitigation():
    """
    Test that verify_password is called even when user is not found,
    to mitigate timing attacks.
    """
    # Import login inside test to avoid early import issues if environment is not set
    from app.api.v1.auth import login

    # Mock DB session
    mock_db = AsyncMock()

    # Mock result for user not found
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    # Mock credentials
    credentials = UserLogin(email="nonexistent@example.com", password="password")
    response = Response()

    # Patch verify_password in app.api.v1.auth
    with patch("app.api.v1.auth.verify_password") as mock_verify_password:
        mock_verify_password.return_value = False

        # Call login
        with pytest.raises(HTTPException) as exc_info:
            await login(credentials, response, mock_db)

        # Verify 401 Unauthorized
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Incorrect email or password"

        # Verify verify_password was called
        # This confirms the timing attack mitigation is in place
        mock_verify_password.assert_called_once()

        # Check arguments
        args, _ = mock_verify_password.call_args
        assert args[0] == "password"
        # The second argument should be the dummy hash
        assert args[1] is not None
        assert len(args[1]) > 0

@pytest.mark.asyncio
async def test_login_valid_user_invalid_password():
    """
    Test that verify_password is called when user exists but password is wrong.
    """
    from app.api.v1.auth import login

    # Mock DB session
    mock_db = AsyncMock()

    # Mock user
    mock_user = MagicMock(spec=User)
    mock_user.hashed_password = "real_hashed_password"
    mock_user.is_active = True

    # Mock result for user found
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user
    mock_db.execute.return_value = mock_result

    # Mock credentials
    credentials = UserLogin(email="user@example.com", password="wrong_password")
    response = Response()

    with patch("app.api.v1.auth.verify_password") as mock_verify_password:
        mock_verify_password.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await login(credentials, response, mock_db)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        mock_verify_password.assert_called_once()
        args, _ = mock_verify_password.call_args
        assert args[0] == "wrong_password"
        assert args[1] == "real_hashed_password"
