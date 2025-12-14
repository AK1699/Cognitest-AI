"""add organization_roles table

Revision ID: a7e8f9c0d1b2
Revises: 
Create Date: 2024-12-14 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a7e8f9c0d1b2'
down_revision: Union[str, None] = 'add_snippets_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create organization_roles table
    op.create_table(
        'organization_roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('role_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('is_system_role', sa.Boolean, default=False),
        sa.Column('is_default', sa.Boolean, default=False),
        sa.Column('permissions', postgresql.JSON, default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Add role_id column to user_organisations if it doesn't exist
    # (it may already exist as a nullable FK)
    try:
        op.add_column(
            'user_organisations',
            sa.Column('role_id', postgresql.UUID(as_uuid=True), 
                      sa.ForeignKey('organization_roles.id', ondelete='SET NULL'), nullable=True)
        )
    except Exception:
        # Column may already exist
        pass


def downgrade() -> None:
    # Remove role_id column from user_organisations
    try:
        op.drop_column('user_organisations', 'role_id')
    except Exception:
        pass
    
    # Drop organization_roles table
    op.drop_table('organization_roles')
