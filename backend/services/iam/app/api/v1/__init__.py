from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .roles import router as roles_router
from .mfa import router as mfa_router
from .invitations import router as invitations_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(roles_router, prefix="/roles", tags=["roles"])
router.include_router(mfa_router, prefix="/mfa", tags=["mfa"])
router.include_router(invitations_router, prefix="/invitations", tags=["invitations"])
