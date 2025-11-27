from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import select

from app.core.config import settings
from app.core.cache import close_redis, get_redis_client
from app.core.database import AsyncSessionLocal
from app.models.role import Permission
from app.api.v1 import api_router

# Module-based permission definitions
MODULE_PERMISSIONS = {
    "automation_hub": [
        ("read_automation_hub", "automation_hub", "read", "View automation hub dashboards, reports, and test results"),
        ("write_automation_hub", "automation_hub", "write", "Create and modify automation scripts, configurations, and test suites"),
        ("execute_automation_hub", "automation_hub", "execute", "Run automation pipelines, execute test suites, and trigger automation workflows"),
        ("manage_automation_hub", "automation_hub", "manage", "Approve automation releases, assign tasks, delete configurations, and manage team permissions"),
    ],
    "api_testing": [
        ("read_api_testing", "api_testing", "read", "View API test results, health metrics, and analytics dashboards"),
        ("write_api_testing", "api_testing", "write", "Create API test suites, configure endpoints, and modify test data"),
        ("execute_api_testing", "api_testing", "execute", "Run API tests, debug endpoints, and validate API responses"),
        ("manage_api_testing", "api_testing", "manage", "Review API metrics, approve test configurations, and manage API testing resources"),
    ],
    "test_management": [
        ("read_test_management", "test_management", "read", "View test cases, test plans, test cycles, and execution reports"),
        ("write_test_management", "test_management", "write", "Create and modify test cases, test plans, and test documentation"),
        ("execute_test_management", "test_management", "execute", "Execute assigned test cases, run test cycles, and log test results"),
        ("manage_test_management", "test_management", "manage", "Oversee test cycles, approve test plans, assign test cases, and manage test resources"),
    ],
    "security_testing": [
        ("read_security_testing", "security_testing", "read", "View security scan reports, vulnerability summaries, and compliance dashboards"),
        ("write_security_testing", "security_testing", "write", "Configure security scans, define test parameters, and document vulnerabilities"),
        ("execute_security_testing", "security_testing", "execute", "Run security scans, execute penetration tests, and validate security patches"),
        ("manage_security_testing", "security_testing", "manage", "Audit compliance reports, approve security configurations, and manage security testing workflows"),
    ],
    "performance_testing": [
        ("read_performance_testing", "performance_testing", "read", "View performance metrics, load test results, and performance dashboards"),
        ("write_performance_testing", "performance_testing", "write", "Configure load tests, define performance thresholds, and create test scenarios"),
        ("execute_performance_testing", "performance_testing", "execute", "Run performance tests, monitor system load, and analyze performance logs"),
        ("manage_performance_testing", "performance_testing", "manage", "Review performance KPIs, approve performance thresholds, and manage testing infrastructure"),
    ],
    "mobile_testing": [
        ("read_mobile_testing", "mobile_testing", "read", "View mobile test results, UX metrics, and device compatibility reports"),
        ("write_mobile_testing", "mobile_testing", "write", "Configure mobile test suites, define test devices, and create mobile test cases"),
        ("execute_mobile_testing", "mobile_testing", "execute", "Run mobile tests on devices, debug mobile apps, and validate UX flows"),
        ("manage_mobile_testing", "mobile_testing", "manage", "Review mobile releases, approve app builds, and manage mobile testing resources"),
    ],
}


async def initialize_permissions():
    """Initialize all module-based permissions on startup"""
    print("🔐 Initializing module permissions...")
    async with AsyncSessionLocal() as session:
        created_count = 0
        for module_key, permissions in MODULE_PERMISSIONS.items():
            for perm_name, resource, action, description in permissions:
                # Check if permission exists
                result = await session.execute(
                    select(Permission).where(Permission.name == perm_name)
                )
                existing = result.scalar_one_or_none()

                if not existing:
                    permission = Permission(
                        name=perm_name,
                        resource=resource,
                        action=action,
                        description=description,
                        is_system_permission=True
                    )
                    session.add(permission)
                    created_count += 1

        await session.commit()
        if created_count > 0:
            print(f"✅ Created {created_count} new permissions")
        else:
            print("✅ All permissions already initialized")


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

    # Initialize permissions
    try:
        await initialize_permissions()
    except Exception as e:
        print(f"⚠️  Permission initialization failed: {e}")

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

# CORS Middleware - Configured to handle all cross-origin requests
print(f"🌐 CORS Origins configured: {settings.CORS_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
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
