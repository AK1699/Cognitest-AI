from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.cache import close_redis, get_redis_client
from app.api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Cognitest Backend...")
    # Initialize Redis connection
    try:
        redis_client = await get_redis_client()
        await redis_client.ping()
        print("✅ Redis connected successfully")
    except Exception as e:
        print(f"⚠️  Redis connection failed: {e}")
    yield
    # Shutdown
    print("👋 Shutting down Cognitest Backend...")
    # Close Redis connection
    await close_redis()
    print("✅ Redis connection closed")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cognitest AI-Powered Testing Platform API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Cognitest API",
        "version": settings.VERSION,
        "docs": "/api/docs",
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
    }
