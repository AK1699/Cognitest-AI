from fastapi import APIRouter
from app.api.v1 import auth, organisations, users, projects

api_router = APIRouter()

# Core routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organisations.router, prefix="/organisations", tags=["organisations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])

# WebRTC router - try to import, but don't fail if dependencies missing
try:
    from app.api.v1 import webrtc
    api_router.include_router(webrtc.router, prefix="/webrtc", tags=["webrtc"])
except ImportError as e:
    print(f"⚠️  WebRTC disabled: {e}")

# Additional routers can be enabled here after verifying dependencies
# api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
# ...
