"""add oauth_accounts table

Revision ID: oauth_accounts_v1
Revises: bee3420f9f3a
Create Date: 2025-12-05 18:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'oauth_accounts_v1'
down_revision = 'bee3420f9f3a'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('oauth_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_user_id', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('picture_url', sa.String(length=500), nullable=True),
        sa.Column('access_token', sa.String(length=1000), nullable=True),
        sa.Column('refresh_token', sa.String(length=1000), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_oauth_accounts_id'), 'oauth_accounts', ['id'], unique=False)
    op.create_index(op.f('ix_oauth_accounts_user_id'), 'oauth_accounts', ['user_id'], unique=False)
    op.create_index(op.f('ix_oauth_accounts_created_at'), 'oauth_accounts', ['created_at'], unique=False)
    # Unique constraint for provider + provider_user_id
    op.create_unique_constraint('uq_oauth_provider_user', 'oauth_accounts', ['provider', 'provider_user_id'])


def downgrade():
    op.drop_constraint('uq_oauth_provider_user', 'oauth_accounts', type_='unique')
    op.drop_index(op.f('ix_oauth_accounts_created_at'), table_name='oauth_accounts')
    op.drop_index(op.f('ix_oauth_accounts_user_id'), table_name='oauth_accounts')
    op.drop_index(op.f('ix_oauth_accounts_id'), table_name='oauth_accounts')
    op.drop_table('oauth_accounts')
