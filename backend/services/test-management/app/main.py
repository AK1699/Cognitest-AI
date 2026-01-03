from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from cognitest_common import get_redis_client, close_redis
from .core.config import settings
from .api.v1.test_plans import router as test_plans_router
from .api.v1.test_suites import router as test_suites_router
from .api.v1.test_cases import router as test_cases_router
from .api.v1.issues import router as issues_router
from .api.v1.approvals import router as approvals_router
from .api.v1.snippets import router as snippets_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Starting {settings.SERVICE_NAME}...")
    # Initialize Redis for caching if needed (shared with common)
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
app.include_router(test_plans_router, prefix=f"{settings.API_V1_STR}/test-plans", tags=["test-plans"])
app.include_router(test_suites_router, prefix=f"{settings.API_V1_STR}/test-suites", tags=["test-suites"])
app.include_router(test_cases_router, prefix=f"{settings.API_V1_STR}/test-cases", tags=["test-cases"])
app.include_router(issues_router, prefix=f"{settings.API_V1_STR}/issues", tags=["issues"])
app.include_router(approvals_router, prefix=f"{settings.API_V1_STR}/approvals", tags=["approvals"])
app.include_router(snippets_router, prefix=f"{settings.API_V1_STR}/snippets", tags=["snippets"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.SERVICE_NAME}
