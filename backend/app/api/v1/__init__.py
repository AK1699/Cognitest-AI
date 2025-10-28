from fastapi import APIRouter
from app.api.v1 import auth, organisations, projects, test_plans, test_suites, test_cases, approvals

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(organisations.router, prefix="/organisations", tags=["organisations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(test_plans.router, prefix="/test-plans", tags=["test-plans"])
api_router.include_router(test_suites.router, prefix="/test-suites", tags=["test-suites"])
api_router.include_router(test_cases.router, prefix="/test-cases", tags=["test-cases"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
