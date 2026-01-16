"""add protocol to api_requests

Revision ID: bd946def97b5
Revises: add_api_environments
Create Date: 2026-01-16 14:19:39.164350

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd946def97b5'
down_revision: Union[str, Sequence[str], None] = 'add_api_environments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('api_requests', sa.Column('protocol', sa.String(length=20), nullable=False, server_default='http'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('api_requests', 'protocol')
