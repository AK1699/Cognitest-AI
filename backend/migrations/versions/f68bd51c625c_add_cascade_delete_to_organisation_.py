"""Add CASCADE delete to organisation foreign keys

Revision ID: f68bd51c625c
Revises: 106876d1fc6b
Create Date: 2025-11-04 12:20:01.379290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f68bd51c625c'
down_revision: Union[str, Sequence[str], None] = '106876d1fc6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add CASCADE delete to organisation foreign keys."""

    # Fix group_type_access constraint
    op.drop_constraint('group_type_access_organization_id_fkey', 'group_type_access', type_='foreignkey')
    op.create_foreign_key(
        'group_type_access_organization_id_fkey',
        'group_type_access', 'organisations',
        ['organization_id'], ['id'],
        ondelete='CASCADE'
    )

    # Fix group_types constraint
    op.drop_constraint('group_types_organization_id_fkey', 'group_types', type_='foreignkey')
    op.create_foreign_key(
        'group_types_organization_id_fkey',
        'group_types', 'organisations',
        ['organization_id'], ['id'],
        ondelete='CASCADE'
    )

    # Fix projects constraint
    op.drop_constraint('projects_organisation_id_fkey', 'projects', type_='foreignkey')
    op.create_foreign_key(
        'projects_organisation_id_fkey',
        'projects', 'organisations',
        ['organisation_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """Downgrade schema - Remove CASCADE delete from organisation foreign keys."""

    # Revert group_type_access constraint
    op.drop_constraint('group_type_access_organization_id_fkey', 'group_type_access', type_='foreignkey')
    op.create_foreign_key(
        'group_type_access_organization_id_fkey',
        'group_type_access', 'organisations',
        ['organization_id'], ['id']
    )

    # Revert group_types constraint
    op.drop_constraint('group_types_organization_id_fkey', 'group_types', type_='foreignkey')
    op.create_foreign_key(
        'group_types_organization_id_fkey',
        'group_types', 'organisations',
        ['organization_id'], ['id']
    )

    # Revert projects constraint
    op.drop_constraint('projects_organisation_id_fkey', 'projects', type_='foreignkey')
    op.create_foreign_key(
        'projects_organisation_id_fkey',
        'projects', 'organisations',
        ['organisation_id'], ['id']
    )
