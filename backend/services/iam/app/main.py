from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from cognitest_common import get_redis_client, close_redis
from .core.config import settings
from .api.v1.auth import router as auth_router
from .api.v1.users import router as users_router
from .api.v1.roles import router as roles_router
from .api.v1.mfa import router as mfa_router
from .api.v1.invitations import router as invitations_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Starting {settings.SERVICE_NAME}...")
    # Initialize Redis
    await get_redis_client(settings.REDIS_URL)
    yield
    # Shutdown
    await close_redis()
    print(f"👋 Shutting down {settings.SERVICE_NAME}...")

app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(roles_router, prefix=f"{settings.API_V1_STR}/roles", tags=["roles"])
app.include_router(mfa_router, prefix=f"{settings.API_V1_STR}/mfa", tags=["mfa"])
app.include_router(invitations_router, prefix=f"{settings.API_V1_STR}/invitations", tags=["invitations"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.SERVICE_NAME}
