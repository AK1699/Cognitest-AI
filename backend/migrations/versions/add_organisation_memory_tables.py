"""add organisation memory tables

Revision ID: add_organisation_memory
Revises: f68bd51c625c
Create Date: 2025-01-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_organisation_memory'
down_revision = 'f68bd51c625c'
branch_labels = None
depends_on = None


def upgrade():
    # Create organisation_memory table
    op.create_table(
        'organisation_memory',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),

        sa.Column('input_type', sa.String(50), nullable=False, index=True),
        sa.Column('source', sa.String(50), nullable=False, index=True),

        sa.Column('user_description', sa.Text, nullable=False),
        sa.Column('processed_text', sa.Text, nullable=True),

        sa.Column('has_images', sa.Integer, default=0, index=True),
        sa.Column('total_images', sa.Integer, default=0),

        sa.Column('image_analysis', postgresql.JSON, default=dict),
        sa.Column('extracted_features', postgresql.JSON, default=list),
        sa.Column('ui_elements', postgresql.JSON, default=list),
        sa.Column('workflows', postgresql.JSON, default=list),

        sa.Column('searchable_content', sa.Text, nullable=False),

        sa.Column('qdrant_collection', sa.String(255), nullable=True),
        sa.Column('qdrant_point_id', sa.String(255), nullable=True),

        sa.Column('times_referenced', sa.Integer, default=0),
        sa.Column('effectiveness_score', sa.Float, default=0.0),
        sa.Column('last_referenced_at', sa.DateTime(timezone=True), nullable=True),

        sa.Column('generated_test_plan_ids', postgresql.JSON, default=list),
        sa.Column('generated_test_case_ids', postgresql.JSON, default=list),

        sa.Column('tags', postgresql.JSON, default=list),
        sa.Column('meta_data', postgresql.JSON, default=dict),

        sa.Column('is_active', sa.Integer, default=1, index=True),

        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Create organisation_memory_images table
    op.create_table(
        'organisation_memory_images',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('memory_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisation_memory.id', ondelete='CASCADE'), nullable=False, index=True),

        sa.Column('file_name', sa.String(500), nullable=False),
        sa.Column('file_path', sa.String(1000), nullable=False),
        sa.Column('file_size', sa.Integer, nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),

        sa.Column('width', sa.Integer, nullable=True),
        sa.Column('height', sa.Integer, nullable=True),

        sa.Column('vision_analysis', postgresql.JSON, default=dict),
        sa.Column('extracted_text', sa.Text, nullable=True),
        sa.Column('identified_elements', postgresql.JSON, default=list),

        sa.Column('image_order', sa.Integer, default=0),
        sa.Column('meta_data', postgresql.JSON, default=dict),

        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create memory_usage_log table
    op.create_table(
        'memory_usage_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('memory_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisation_memory.id', ondelete='CASCADE'), nullable=False, index=True),

        sa.Column('used_in_generation', sa.String(255), nullable=False),
        sa.Column('generation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('similarity_score', sa.Float, nullable=False),

        sa.Column('was_helpful', sa.Integer, nullable=True),
        sa.Column('user_rating', sa.Float, nullable=True),

        sa.Column('query_text', sa.Text, nullable=True),
        sa.Column('meta_data', postgresql.JSON, default=dict),

        sa.Column('used_at', sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )

    # Create indexes for better query performance
    op.create_index('idx_org_memory_org_id', 'organisation_memory', ['organisation_id'])
    op.create_index('idx_org_memory_project_id', 'organisation_memory', ['project_id'])
    op.create_index('idx_org_memory_created_at', 'organisation_memory', ['created_at'])
    op.create_index('idx_org_memory_has_images', 'organisation_memory', ['has_images'])
    op.create_index('idx_org_memory_active', 'organisation_memory', ['is_active'])

    op.create_index('idx_memory_images_memory_id', 'organisation_memory_images', ['memory_id'])
    op.create_index('idx_memory_images_order', 'organisation_memory_images', ['memory_id', 'image_order'])

    op.create_index('idx_memory_usage_org_id', 'memory_usage_log', ['organisation_id'])
    op.create_index('idx_memory_usage_memory_id', 'memory_usage_log', ['memory_id'])
    op.create_index('idx_memory_usage_used_at', 'memory_usage_log', ['used_at'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_memory_usage_used_at', table_name='memory_usage_log')
    op.drop_index('idx_memory_usage_memory_id', table_name='memory_usage_log')
    op.drop_index('idx_memory_usage_org_id', table_name='memory_usage_log')

    op.drop_index('idx_memory_images_order', table_name='organisation_memory_images')
    op.drop_index('idx_memory_images_memory_id', table_name='organisation_memory_images')

    op.drop_index('idx_org_memory_active', table_name='organisation_memory')
    op.drop_index('idx_org_memory_has_images', table_name='organisation_memory')
    op.drop_index('idx_org_memory_created_at', table_name='organisation_memory')
    op.drop_index('idx_org_memory_project_id', table_name='organisation_memory')
    op.drop_index('idx_org_memory_org_id', table_name='organisation_memory')

    # Drop tables
    op.drop_table('memory_usage_log')
    op.drop_table('organisation_memory_images')
    op.drop_table('organisation_memory')
