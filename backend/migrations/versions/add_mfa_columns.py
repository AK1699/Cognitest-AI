"""Add MFA columns to users table

Revision ID: add_mfa_columns
Revises: c22c105dde5c
Create Date: 2025-12-07 21:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_mfa_columns'
down_revision: Union[str, None] = 'c22c105dde5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add MFA columns to users table
    op.add_column('users', sa.Column('mfa_secret', sa.String(32), nullable=True))
    op.add_column('users', sa.Column('mfa_enabled', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('users', sa.Column('mfa_backup_codes', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove MFA columns from users table
    op.drop_column('users', 'mfa_backup_codes')
    op.drop_column('users', 'mfa_enabled')
    op.drop_column('users', 'mfa_secret')
