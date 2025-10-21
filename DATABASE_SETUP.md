# Database Setup Guide

This guide covers how to set up the PostgreSQL database for CogniTest locally.

## Prerequisites

- PostgreSQL 14+ installed locally
- Python 3.10+
- Access to the repository

## Quick Setup (For New Developers)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Cognitest-AI
```

### 2. Install PostgreSQL (if not installed)

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 3. Create Database

```bash
# Create the database
createdb cognitest

# Or using psql
psql -U postgres -c "CREATE DATABASE cognitest;"
```

### 4. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and update the database URLs:
```env
# Replace 'your_db_user' with your PostgreSQL username (usually 'postgres' or your system username)
DATABASE_URL=postgresql+asyncpg://your_db_user@localhost:5432/cognitest
DATABASE_URL_SYNC=postgresql://your_db_user@localhost:5432/cognitest
CELERY_BROKER_URL=db+postgresql://your_db_user@localhost:5432/cognitest
CELERY_RESULT_BACKEND=db+postgresql://your_db_user@localhost:5432/cognitest

SECRET_KEY=your-secret-key-change-in-production-make-it-random-and-long
```

### 5. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 6. Initialize Database Schema

**Option A: Using init_db.py (Fresh Start)**
```bash
python3 init_db.py
```

**Option B: Restore from Dump (With Sample Data)**
```bash
# Binary format dump (recommended)
pg_restore -d cognitest database_dumps/cognitest_schema.dump

# Or SQL format dump
psql -d cognitest -f database_dumps/cognitest_schema.sql
```

### 7. Verify Database Connection

```bash
# Check if tables were created
psql -d cognitest -c "\dt"

# Check users table
psql -d cognitest -c "SELECT COUNT(*) FROM users;"
```

### 8. Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

## Database Management Commands

### Create a Database Dump

**Full database dump (binary format - recommended for backups):**
```bash
pg_dump -d cognitest -F c -f database_dumps/cognitest_backup_$(date +%Y%m%d).dump
```

**SQL format dump (readable, good for version control):**
```bash
pg_dump -d cognitest -F p -f database_dumps/cognitest_schema.sql
```

**Schema only (no data):**
```bash
pg_dump -d cognitest --schema-only -f database_dumps/cognitest_schema_only.sql
```

**Data only (no schema):**
```bash
pg_dump -d cognitest --data-only -f database_dumps/cognitest_data_only.sql
```

### Restore from Dump

**From binary dump:**
```bash
# Drop existing database (CAREFUL!)
dropdb cognitest

# Create fresh database
createdb cognitest

# Restore dump
pg_restore -d cognitest database_dumps/cognitest_schema.dump
```

**From SQL dump:**
```bash
# Drop and recreate
dropdb cognitest
createdb cognitest

# Restore
psql -d cognitest -f database_dumps/cognitest_schema.sql
```

**Restore to existing database (will fail on conflicts):**
```bash
psql -d cognitest -f database_dumps/cognitest_schema.sql
```

### Export/Import Specific Tables

**Export single table:**
```bash
pg_dump -d cognitest -t users -f users_backup.sql
```

**Import single table:**
```bash
psql -d cognitest -f users_backup.sql
```

### View Database Information

```bash
# List all databases
psql -l

# Connect to database
psql -d cognitest

# Inside psql:
\dt              # List all tables
\d users         # Describe users table
\du              # List users/roles
\l               # List databases
\q               # Quit
```

## Database Migrations (Using Alembic)

### Create a New Migration

```bash
cd backend
alembic revision --autogenerate -m "description of changes"
```

### Apply Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade by 1 version
alembic upgrade +1

# Downgrade by 1 version
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
```

## Common Database Tasks

### Reset Database (CAREFUL - Destroys All Data!)

```bash
# Drop database
dropdb cognitest

# Recreate
createdb cognitest

# Initialize schema
python3 init_db.py

# Or restore from dump
pg_restore -d cognitest database_dumps/cognitest_schema.dump
```

### Create Test User Programmatically

```python
# Create a script: create_test_user.py
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import uuid

async def create_test_user():
    async with AsyncSessionLocal() as db:
        # Check if user exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "test@cognitest.ai"))
        existing = result.scalar_one_or_none()

        if existing:
            print("Test user already exists")
            return

        # Create test user
        user = User(
            id=uuid.uuid4(),
            email="test@cognitest.ai",
            username="testuser",
            full_name="Test User",
            hashed_password=get_password_hash("TestPass123!"),
            is_active=True,
            is_superuser=False
        )

        db.add(user)
        await db.commit()
        print(f"✅ Test user created: {user.email}")

if __name__ == "__main__":
    asyncio.run(create_test_user())
```

Run it:
```bash
python3 create_test_user.py
```

### Check Database Size

```bash
psql -d cognitest -c "SELECT pg_size_pretty(pg_database_size('cognitest'));"
```

### Vacuum Database (Optimize)

```bash
psql -d cognitest -c "VACUUM ANALYZE;"
```

## Troubleshooting

### Error: "role 'postgres' does not exist"

Use your system username instead:
```bash
# Find your username
whoami

# Use it in connection string
DATABASE_URL=postgresql+asyncpg://your_username@localhost:5432/cognitest
```

### Error: "database 'cognitest' does not exist"

Create it:
```bash
createdb cognitest
```

### Error: "password authentication failed"

If PostgreSQL requires a password:
```bash
# Set password for your user
psql -c "ALTER USER your_username WITH PASSWORD 'yourpassword';"

# Update .env
DATABASE_URL=postgresql+asyncpg://your_username:yourpassword@localhost:5432/cognitest
```

### Error: "No module named 'greenlet'"

Install required Python package:
```bash
pip install greenlet
```

### Connection Refused Error

Start PostgreSQL:
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Check status
pg_isready
```

## Database Schema Overview

### Main Tables

- **users**: User accounts and authentication
- **organisations**: Organization/company entities
- **projects**: Testing projects within organizations
- **test_plans**: High-level test planning documents
- **test_suites**: Collections of test cases
- **test_cases**: Individual test case definitions

### Relationships

```
users (1) ──> (M) organisations
organisations (1) ──> (M) projects
projects (1) ──> (M) test_plans
projects (1) ──> (M) test_suites
projects (1) ──> (M) test_cases
test_plans (1) ──> (M) test_suites
test_suites (1) ──> (M) test_cases
```

## Best Practices

1. **Always backup before major changes:**
   ```bash
   pg_dump -d cognitest -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
   ```

2. **Use migrations for schema changes:**
   - Never modify database schema directly
   - Always create Alembic migrations
   - Test migrations on dev before production

3. **Keep dumps in version control:**
   - Commit schema dumps (without sensitive data)
   - Add `*_backup_*.dump` to `.gitignore`
   - Document any manual schema changes

4. **Regular maintenance:**
   ```bash
   # Weekly vacuum
   psql -d cognitest -c "VACUUM ANALYZE;"

   # Monitor size
   psql -d cognitest -c "SELECT pg_size_pretty(pg_database_size('cognitest'));"
   ```

5. **Security:**
   - Use strong passwords
   - Never commit `.env` files
   - Rotate database credentials regularly
   - Use read-only users for analytics

## Production Deployment

For production deployments:

1. Use managed PostgreSQL services (AWS RDS, Google Cloud SQL, etc.)
2. Enable SSL connections
3. Set up automated backups
4. Use connection pooling (PgBouncer)
5. Monitor query performance
6. Set up replication for high availability

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
