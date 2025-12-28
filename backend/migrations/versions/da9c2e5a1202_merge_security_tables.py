"""merge_security_tables

Revision ID: da9c2e5a1202
Revises: add_security_testing_tables, project_roles_enterprise_update
Create Date: 2025-12-28 20:08:10.716831

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'da9c2e5a1202'
down_revision: Union[str, Sequence[str], None] = ('add_security_testing_tables', 'project_roles_enterprise_update')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
