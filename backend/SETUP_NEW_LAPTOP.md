# Setting Up Cognitest-AI on a New Laptop

This guide will help you set up the Cognitest-AI backend database on a new laptop after cloning the repository.

## Prerequisites

Ensure you have:
- Python 3.8+ installed
- PostgreSQL running locally
- Git installed
- The cognitest database created:

```bash
createdb cognitest
```

## Step-by-Step Setup

### 1. Clone and Navigate to Backend

```bash
git clone <repository-url>
cd Cognitest-AI/backend
```

### 2. Create and Activate Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it (macOS/Linux)
source venv/bin/activate

# Or on Windows
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Create `.env` File

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
DATABASE_URL=postgresql+asyncpg://akash@localhost:5432/cognitest
DATABASE_URL_SYNC=postgresql://akash@localhost:5432/cognitest
SECRET_KEY=your-secret-key
# ... other settings
```

### 5. Run Database Migrations (NEW WAY - Recommended)

Now that Alembic is properly configured, use:

```bash
alembic upgrade head
```

This will:
- Create all necessary database tables
- Set up indexes and constraints
- Record the migration state in the database

Verify it worked:

```bash
alembic current
```

Should output:
```
22d4bdcb1bbf (head)
```

### Alternative: Quick Setup with Script (OLD WAY)

If migrations fail for any reason, you can still use the init script:

```bash
python3 init_db.py
```

This creates all tables at once using SQLAlchemy metadata.

## Troubleshooting

### PostgreSQL Connection Error

If you get "could not connect to server":

1. Ensure PostgreSQL is running:
   ```bash
   brew services start postgresql  # macOS
   # or
   sudo service postgresql start  # Linux
   ```

2. Check the database exists:
   ```bash
   psql -U postgres -l | grep cognitest
   ```

3. If it doesn't exist, create it:
   ```bash
   createdb cognitest
   ```

### Migration Won't Apply

If you get "relation 'xyz' does not exist" error:

1. Check if database is empty:
   ```bash
   psql -U postgres -d cognitest -c "\dt"
   ```

2. If empty, ensure PostgreSQL is running and try again:
   ```bash
   alembic upgrade head
   ```

3. If tables exist but Alembic complains, the database might be out of sync. Use the init script as a fallback:
   ```bash
   python3 init_db.py
   ```

## What the Migration Does

The migration `22d4bdcb1bbf` creates all these tables:

**Core Tables:**
- `users` - User accounts
- `organisations` - Tenants/organizations
- `projects` - Projects within organizations
- `user_organisations` - User membership in organizations

**Authentication:**
- `oauth_accounts` - OAuth provider integrations (Google, Microsoft, Apple)
- `password_reset_codes` - Password reset tokens

**Access Control:**
- `permissions` - System permissions
- `roles` - Role definitions (also called `project_roles`)
- `user_project_roles` - User roles in projects
- `group_project_roles` - Group roles in projects
- `groups` - User groups
- `group_types` - Group type definitions
- `user_groups` - Group membership

**Testing & Management:**
- `test_plans` - Test plans
- `test_suites` - Test suites
- `test_cases` - Individual test cases
- `approval_workflows` - Approval workflow definitions
- `test_plan_approvals` - Test plan approval records
- `approval_stages` - Workflow stages
- `approval_history` - Approval history
- `issues` - Issue tracking

**Advanced Features:**
- `api_collections` - API test collections
- `ai_feedback` - AI feedback data
- `agent_performance` - Agent performance metrics
- `document_knowledge` - Knowledge base documents
- `document_chunks` - Document chunks for vectorization
- `document_usage_log` - Document usage tracking
- `invitations` - User invitations

## Next Steps

1. **Verify the setup:**
   ```bash
   python3 -c "from app.models import *; print('✅ All models loaded')"
   ```

2. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

3. **Access API docs:**
   Open http://localhost:8000/api/docs in your browser

4. **For frontend development:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## Common Issues When Syncing Code

If you're experiencing the original OAuth error after pulling code:

**Error:**
```
Error processing Google callback: (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError)
<class 'asyncpg.exceptions.UndefinedTableError'>: relation "oauth_accounts" does not exist
```

**Solution:**
```bash
alembic upgrade head
```

This applies any new migrations that were committed.

## How Migrations Work

- **Alembic** tracks database schema changes in version control
- **alembic.ini** - Configuration file
- **migrations/versions/** - Individual migration files
- **migrations/env.py** - Migration environment setup
- Each time you pull code with new migrations, just run `alembic upgrade head`

## For More Details

See [MIGRATIONS.md](./MIGRATIONS.md) for comprehensive migration documentation.
