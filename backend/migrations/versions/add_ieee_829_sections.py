"""add_ieee_829_comprehensive_sections

Revision ID: ieee829_001
Revises: e7a337c8078b
Create Date: 2025-01-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ieee829_001'
down_revision: Union[str, Sequence[str], None] = 'e7a337c8078b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add IEEE 829 comprehensive sections to test_plans."""

    # Add IEEE 829 comprehensive sections as JSON columns
    # These store structured data following IEEE 829 standard

    # 1. Test Objectives (detailed objectives with success criteria)
    op.add_column('test_plans', sa.Column(
        'test_objectives_ieee',
        sa.JSON(),
        nullable=True,
        server_default='[]',
        comment='IEEE 829 Test Objectives with success criteria and quality goals'
    ))

    # 2. Scope of Testing (comprehensive scope definition)
    op.add_column('test_plans', sa.Column(
        'scope_of_testing_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Scope of Testing with in-scope, out-of-scope, features, systems, environments'
    ))

    # 3. Test Approach (testing approach and methodology)
    op.add_column('test_plans', sa.Column(
        'test_approach_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Test Approach with methodology, testing types, techniques, automation approach'
    ))

    # 4. Assumptions and Constraints
    op.add_column('test_plans', sa.Column(
        'assumptions_constraints_ieee',
        sa.JSON(),
        nullable=True,
        server_default='[]',
        comment='IEEE 829 Assumptions and Constraints with type, description, impact, mitigation'
    ))

    # 5. Test Schedule (detailed schedule with phases and milestones)
    op.add_column('test_plans', sa.Column(
        'test_schedule_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Test Schedule with phases, milestones, dependencies, critical path'
    ))

    # 6. Resources and Roles (resource allocation and roles)
    op.add_column('test_plans', sa.Column(
        'resources_roles_ieee',
        sa.JSON(),
        nullable=True,
        server_default='[]',
        comment='IEEE 829 Resources and Roles with responsibilities, skills, allocation'
    ))

    # 7. Test Environment (environment specifications)
    op.add_column('test_plans', sa.Column(
        'test_environment_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Test Environment with environments, hardware, software, network, test data'
    ))

    # 8. Entry/Exit Criteria
    op.add_column('test_plans', sa.Column(
        'entry_exit_criteria_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Entry/Exit Criteria with entry, exit, suspension, resumption criteria'
    ))

    # 9. Risk Management (risk management with matrix)
    op.add_column('test_plans', sa.Column(
        'risk_management_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Risk Management with risks, mitigation, contingency plans, risk matrix'
    ))

    # 10. Deliverables and Reporting
    op.add_column('test_plans', sa.Column(
        'deliverables_reporting_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Deliverables and Reporting with deliverables, reporting structure, communication plan, metrics'
    ))

    # 11. Approval and Sign-off
    op.add_column('test_plans', sa.Column(
        'approval_signoff_ieee',
        sa.JSON(),
        nullable=True,
        server_default='{}',
        comment='IEEE 829 Approval and Sign-off with approvers, criteria, process, escalation matrix'
    ))


def downgrade() -> None:
    """Downgrade schema - Remove IEEE 829 comprehensive sections."""

    # Remove all IEEE 829 specific columns
    op.drop_column('test_plans', 'approval_signoff_ieee')
    op.drop_column('test_plans', 'deliverables_reporting_ieee')
    op.drop_column('test_plans', 'risk_management_ieee')
    op.drop_column('test_plans', 'entry_exit_criteria_ieee')
    op.drop_column('test_plans', 'test_environment_ieee')
    op.drop_column('test_plans', 'resources_roles_ieee')
    op.drop_column('test_plans', 'test_schedule_ieee')
    op.drop_column('test_plans', 'assumptions_constraints_ieee')
    op.drop_column('test_plans', 'test_approach_ieee')
    op.drop_column('test_plans', 'scope_of_testing_ieee')
    op.drop_column('test_plans', 'test_objectives_ieee')
