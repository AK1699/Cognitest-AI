from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from cognitest_common import get_redis_client, close_redis
from .core.config import settings
from .api.v1.organisations import router as organisations_router
from .api.v1.projects import router as projects_router
from .api.v1.groups import router as groups_router

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
app.include_router(organisations_router, prefix=f"{settings.API_V1_STR}/organisations", tags=["organisations"])
app.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(groups_router, prefix=f"{settings.API_V1_STR}/groups", tags=["groups"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.SERVICE_NAME}
