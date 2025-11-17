"""Merge migration heads

Revision ID: 87e0c3a06ef3
Revises: 6b50eb0df38a, add_organisation_memory
Create Date: 2025-11-16 20:01:24.842711

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87e0c3a06ef3'
down_revision: Union[str, Sequence[str], None] = ('6b50eb0df38a', 'add_organisation_memory')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
