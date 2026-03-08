from fastapi import APIRouter
# Keep only core modules that are required for basic functionality
from app.api.v1 import auth, organisations, users

api_router = APIRouter()

# Core routers - required for basic functionality
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organisations.router, prefix="/organisations", tags=["organisations"])

# All other modules have been temporarily disabled due to unmet dependencies
# They will be re-enabled after resolving dependency issues
