# Database Migrations Guide

This guide explains how to use Alembic for managing database schema changes in the Cognitest-AI project.

## Overview

We use **Alembic**, the SQLAlchemy migrations tool, to version control and manage database schema changes. This allows:
- Version control for database schema
- Easy rollback of schema changes
- Consistent database setup across all environments
- Clear history of what changed and when

## Quick Start

### For New Developers / New Laptops

After cloning the repository and pulling the latest code:

```bash
cd backend

# Install dependencies (if not already done)
pip install -r requirements.txt

# Run all pending migrations
alembic upgrade head
```

This will apply all migrations to your database and get it to the latest state.

### Verify Migrations

To see the current database state:

```bash
alembic current
```

Output example:
```
22d4bdcb1bbf (head)
```

To see migration history:

```bash
alembic history
```

Output example:
```
<base> -> 22d4bdcb1bbf (head), Create all application tables
```

## Creating New Migrations

### When to Create a Migration

Create a migration when you:
- Add a new SQLAlchemy model
- Add/remove columns from existing models
- Add/remove indexes or constraints
- Change column types or constraints

### Steps to Create a Migration

1. **Update your SQLAlchemy models** in `app/models/`

   Example: Adding a new field to the `TestCase` model:
   ```python
   class TestCase(Base):
       # ... existing fields ...
       execution_environment = Column(String(255), nullable=True)  # New field
   ```

2. **Generate the migration automatically**

   ```bash
   alembic revision --autogenerate -m "Add execution_environment to test_cases"
   ```

   This compares your models with the database schema and generates migration code.

3. **Review the generated migration file**

   A new file will be created in `migrations/versions/` with a name like:
   ```
   migrations/versions/abc123def456_add_execution_environment_to_test_cases.py
   ```

   Review the `upgrade()` and `downgrade()` functions to ensure they're correct.

4. **Test the migration locally**

   ```bash
   alembic upgrade head
   ```

   Verify the changes:
   ```bash
   psql -U postgres -d cognitest -c "\d test_cases"
   ```

5. **Commit and push**

   ```bash
   git add migrations/versions/abc123def456_*.py
   git commit -m "Add execution_environment field to test_cases"
   git push
   ```

### Manual Migrations

If autogenerate doesn't handle your change (rare cases), create a manual migration:

```bash
alembic revision -m "Custom migration description"
```

Then edit the created file and write the SQL operations manually.

## Common Commands

### Apply Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply next 1 migration
alembic upgrade +1

# Apply specific migration
alembic upgrade abc123def456
```

### Rollback Migrations

```bash
# Rollback to previous migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base

# Rollback to specific migration
alembic downgrade abc123def456
```

### View Migration Status

```bash
# Current version
alembic current

# All migrations history
alembic history

# Show specific migration details
alembic show abc123def456
```

## Configuration

### alembic.ini

Main configuration file with settings like:
- `script_location` - Where migration files are stored (default: `migrations/`)
- Logging configuration
- Database URL settings

### migrations/env.py

The environment file that:
- Imports all SQLAlchemy models for autogeneration
- Configures the async database engine
- Loads settings from `app/core/config.py`
- Defines how migrations are executed

Key features:
- Automatically reads `DATABASE_URL` from `.env`
- Supports async migrations with PostgreSQL
- Compares models with current database schema for autogeneration

## Best Practices

### 1. Always Use Autogenerate

```bash
alembic revision --autogenerate -m "Clear description of changes"
```

This is more reliable than manual migrations.

### 2. Clear Commit Messages

```bash
# Good
alembic revision --autogenerate -m "Add email_verified flag to users table"

# Bad
alembic revision --autogenerate -m "Update schema"
```

### 3. Test Migrations Before Committing

```bash
# Apply to local database
alembic upgrade head

# Verify changes
psql -U postgres -d cognitest -c "\d table_name"

# Rollback to test downgrade
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### 4. Review Generated Code

Always review the `upgrade()` and `downgrade()` functions in generated migrations:
- Check for data loss (e.g., dropping columns with data)
- Ensure foreign key constraints are preserved
- Verify indexes are created for performance-critical columns

### 5. Never Modify Old Migrations

Once a migration is committed and pushed, don't modify it. Create a new migration instead.

## Troubleshooting

### "relation 'xyz' does not exist"

This usually means migrations haven't been run. Solution:

```bash
alembic upgrade head
```

### Migration Won't Apply

Check the migration status and history:

```bash
alembic current
alembic history
```

Verify the migration file syntax by reviewing it in `migrations/versions/`

### Need to Undo Recent Changes

```bash
# See what migration to go back to
alembic history

# Rollback to specific migration
alembic downgrade abc123def456
```

### Alembic Can't Connect to Database

Verify your `.env` file has correct database settings:

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/database_name
```

### Auto-Generated Migration is Wrong

Sometimes autogenerate misses or incorrectly detects changes. You can:

1. Manually edit the generated migration file
2. Or delete it and create a manual one:

```bash
# List migrations to see which one to delete
ls migrations/versions/

# Delete the incorrect one (if not yet committed)
rm migrations/versions/abc123def456_*.py

# Create a manual migration
alembic revision -m "Fix xyz schema"

# Edit the migration file and implement the changes
```

## Migration File Structure

A typical migration file looks like:

```python
"""Add user roles

Revision ID: abc123def456
Revises: 123456789abc
Create Date: 2025-11-04 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'abc123def456'
down_revision = '123456789abc'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add new columns
    op.add_column('users', sa.Column('role', sa.String(50), nullable=True))
    op.create_index('ix_users_role', 'users', ['role'])

def downgrade() -> None:
    # Reverse the changes
    op.drop_index('ix_users_role', table_name='users')
    op.drop_column('users', 'role')
```

## Fixed Issues

### Metadata Column Names

Some models had columns named `metadata`, which is reserved in SQLAlchemy Declarative API. These have been renamed to `meta_data`:
- `Issue.metadata` → `Issue.meta_data`
- `ApiCollection.metadata` → `ApiCollection.meta_data`
- `DocumentKnowledge.metadata` → `DocumentKnowledge.meta_data`
- `DocumentUsageLog.metadata` → `DocumentUsageLog.meta_data`

This allows Alembic to properly introspect the models.

## References

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Async Guide](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [PostgreSQL Types in SQLAlchemy](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
