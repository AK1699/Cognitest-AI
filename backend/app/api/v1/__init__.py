from fastapi import APIRouter
from app.api.v1 import auth, organisations, users, projects, webrtc

api_router = APIRouter()

# Core routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organisations.router, prefix="/organisations", tags=["organisations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(webrtc.router, prefix="/webrtc", tags=["webrtc"])

# Additional routers can be enabled here after verifying dependencies
# api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
# ...
