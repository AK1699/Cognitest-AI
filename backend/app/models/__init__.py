"""
Import all models here to ensure they are registered with SQLAlchemy.
This is important for Alembic migrations and for creating tables.
"""

from app.models.user import User
from app.models.organisation import Organisation
from app.models.project import Project, ProjectStatus
from app.models.test_plan import TestPlan
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase, TestCaseStatus, TestCasePriority
from app.models.approval_workflow import (
    ApprovalWorkflow,
    TestPlanApproval,
    ApprovalStage,
    ApprovalHistory,
    ApprovalStatus,
    ApprovalRole,
)
from app.models.group import Group, user_groups
from app.models.role import (
    ProjectRole,
    Permission,
    UserProjectRole,
    GroupProjectRole,
    ProjectRoleType,
    PermissionAction,
    PermissionResource,
    role_permissions,
)
from app.models.password_reset import PasswordResetCode
from app.models.oauth_account import OAuthAccount
from app.models.group_type import GroupType, GroupTypeRole, GroupTypeAccess
# from app.models.issue import Issue, IssueStatus  # TODO: Fix metadata column name conflict
# from app.models.api_collection import ApiCollection  # Not needed for RBAC

__all__ = [
    "User",
    "Organisation",
    "Project",
    "ProjectStatus",
    "TestPlan",
    "TestSuite",
    "TestCase",
    "TestCaseStatus",
    "TestCasePriority",
    "ApprovalWorkflow",
    "TestPlanApproval",
    "ApprovalStage",
    "ApprovalHistory",
    "ApprovalStatus",
    "ApprovalRole",
    "Group",
    "user_groups",
    "ProjectRole",
    "Permission",
    "UserProjectRole",
    "GroupProjectRole",
    "ProjectRoleType",
    "PermissionAction",
    "PermissionResource",
    "role_permissions",
    "PasswordResetCode",
    "OAuthAccount",
    "GroupType",
    "GroupTypeRole",
    "GroupTypeAccess",
    # "Issue",
    # "IssueStatus",
    # "ApiCollection",
]
