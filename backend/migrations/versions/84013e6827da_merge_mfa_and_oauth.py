"""merge_mfa_and_oauth

Revision ID: 84013e6827da
Revises: add_mfa_columns, oauth_accounts_v1
Create Date: 2025-12-07 22:37:57.796837

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84013e6827da'
down_revision: Union[str, Sequence[str], None] = ('add_mfa_columns', 'oauth_accounts_v1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
