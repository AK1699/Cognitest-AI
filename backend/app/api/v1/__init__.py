from fastapi import APIRouter
from app.api.v1 import auth, organisations, projects, test_plans, test_suites, test_cases, approvals, groups, roles, invitations, group_types, issues, integrations, documents, automation, users, web_automation, mfa, subscription, org_roles, artifacts, snippets
from app.api.v1.endpoints import organisation_memory, test_plans_multimodal, search_by_id

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(mfa.router, prefix="/mfa", tags=["mfa"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organisations.router, prefix="/organisations", tags=["organisations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(test_plans.router, prefix="/test-plans", tags=["test-plans"])
api_router.include_router(test_suites.router, prefix="/test-suites", tags=["test-suites"])
api_router.include_router(test_cases.router, prefix="/test-cases", tags=["test-cases"])
api_router.include_router(issues.router, prefix="/issues", tags=["issues"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(automation.router, prefix="/automation", tags=["automation"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
api_router.include_router(group_types.router, prefix="/group-types", tags=["group-types"])
api_router.include_router(subscription.router, prefix="/subscription", tags=["subscription"])
api_router.include_router(org_roles.router, prefix="/organisations", tags=["org-roles"])

# New endpoints for multimodal test plan generation
api_router.include_router(organisation_memory.router, tags=["organisation-memory"])
api_router.include_router(test_plans_multimodal.router, tags=["test-plans-multimodal"])
api_router.include_router(search_by_id.router)

# Web Automation Module
api_router.include_router(web_automation.router, prefix="/web-automation", tags=["web-automation"])

# Artifacts
api_router.include_router(artifacts.router, prefix="/projects", tags=["artifacts"])

# Snippets - Reusable parameterized test steps
api_router.include_router(snippets.router, prefix="/snippets", tags=["snippets"])

# Workflow Automation Module - n8n-style visual workflow builder
from app.api.v1 import workflow, webhooks
api_router.include_router(workflow.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

# Security Testing Module - Enterprise security scanning and compliance
from app.api.v1 import security
api_router.include_router(security.router, prefix="/security", tags=["security"])
