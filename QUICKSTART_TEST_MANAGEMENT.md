# Quick Start - Test Plan Generator

Get up and running with Test Plan, Test Suite, and Test Case management in 5 minutes.

## Prerequisites

- Node.js 20+ and npm 10+
- Python 3.11+
- PostgreSQL 15+
- OpenAI API Key (for AI generation)
- Qdrant running (for semantic search)

## Setup (5 minutes)

### 1. Configure Environment Variables

Add to `.env`:
```env
# OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Qdrant
QDRANT_URL=http://localhost:6333

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/cognitest
```

### 2. Start Services

```bash
# Terminal 1: Database + Qdrant (if not running)
docker-compose up postgres qdrant

# Terminal 2: Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 5-Minute Tutorial

### Step 1: Login (1 minute)

```bash
# Create test user or login with existing account
# Navigate to http://localhost:3000 and login
```

### Step 2: Create a Test Plan (1 minute)

```bash
curl -X POST http://localhost:8000/api/v1/test-plans/ \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "your-project-uuid",
    "name": "User Login Test Plan",
    "description": "Comprehensive test plan for user authentication",
    "objectives": ["Test login functionality", "Verify security"],
    "created_by": "your-email@example.com"
  }'
```

Or use the UI: Navigate to Test Management → Test Plans → Create

### Step 3: Generate Test Cases with AI (2 minutes)

```bash
curl -X POST http://localhost:8000/api/v1/test-cases/ai-generate \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "your-project-uuid",
    "feature_description": "User login with email and password. Support Google OAuth. Rate limit failed attempts.",
    "user_stories": [
      "As a user, I want to login with email and password",
      "As a user, I want to login with Google OAuth",
      "As a user, I want to be rate-limited after failed attempts"
    ],
    "count": 10
  }'
```

Or use the UI: Test Cases tab → Generate with AI

### Step 4: Execute a Test (1 minute)

```bash
curl -X POST http://localhost:8000/api/v1/test-cases/execute \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "test_case_id": "generated-case-uuid",
    "status": "passed",
    "actual_result": "User successfully logged in",
    "execution_notes": "Tested on Chrome 120"
  }'
```

---

## Common Tasks

### Generate Test Plan from BRD

```bash
POST /api/v1/test-plans/ai-generate
{
  "project_id": "uuid",
  "source_documents": ["doc-uuid-1", "doc-uuid-2"],
  "additional_context": "Focus on security and performance",
  "objectives": ["Ensure security compliance"]
}
```

### Generate Test Suite from Requirements

```bash
POST /api/v1/test-suites/ai-generate
{
  "project_id": "uuid",
  "test_plan_id": "uuid",
  "requirements": "Payment processing for credit cards, PayPal, and Apple Pay",
  "test_scenarios": [
    "Valid payment processing",
    "Declined card handling",
    "Timeout handling"
  ]
}
```

### List All Test Cases for a Suite

```bash
GET /api/v1/test-cases/?project_id=uuid&test_suite_id=suite-uuid
Authorization: Bearer <token>
```

### Update Test Case Status

```bash
PUT /api/v1/test-cases/case-uuid
{
  "status": "passed",
  "priority": "high"
}
```

---

## Frontend Usage

### Test Management Dashboard

1. Navigate to `/test-management`
2. Select a project
3. Use tabs to switch between:
   - **Test Plans**: Create and manage test plans
   - **Test Suites**: Organize test cases into suites
   - **Test Cases**: Define individual test cases

### Creating Tests

- **Manual**: Click "Create" button and fill form
- **AI Generation**: Click "Generate with AI" and describe what to test

### Viewing Results

- Test plans show associated suites
- Test suites show test cases
- Test cases show steps, priority, and execution logs

---

## API Endpoints Reference

### Test Plans
- `POST /api/v1/test-plans/` - Create
- `GET /api/v1/test-plans/?project_id=uuid` - List
- `GET /api/v1/test-plans/uuid` - Get
- `PUT /api/v1/test-plans/uuid` - Update
- `DELETE /api/v1/test-plans/uuid` - Delete
- `POST /api/v1/test-plans/ai-generate` - **AI Generate**

### Test Suites
- `POST /api/v1/test-suites/` - Create
- `GET /api/v1/test-suites/?project_id=uuid` - List
- `GET /api/v1/test-suites/uuid` - Get
- `PUT /api/v1/test-suites/uuid` - Update
- `DELETE /api/v1/test-suites/uuid` - Delete
- `POST /api/v1/test-suites/ai-generate` - **AI Generate**

### Test Cases
- `POST /api/v1/test-cases/` - Create
- `GET /api/v1/test-cases/?project_id=uuid` - List
- `GET /api/v1/test-cases/uuid` - Get
- `PUT /api/v1/test-cases/uuid` - Update
- `DELETE /api/v1/test-cases/uuid` - Delete
- `POST /api/v1/test-cases/execute` - Execute (log result)
- `POST /api/v1/test-cases/ai-generate` - **AI Generate**

---

## Troubleshooting

### "OpenAI API key not configured"
- Check `OPENAI_API_KEY` in `.env`
- Verify key is valid at https://platform.openai.com/api-keys
- Ensure key has GPT-4 access

### "Qdrant connection refused"
- Start Qdrant: `docker-compose up qdrant`
- Check `QDRANT_URL` in `.env`
- Verify Qdrant is running: `curl http://localhost:6333/health`

### "Test cases not appearing"
- Ensure project_id is correct
- Check user has project access
- Verify test_suite_id if filtering
- Check backend logs for errors

### "AI generation times out"
- Check OpenAI API status
- Reduce document size
- Try with fewer test scenarios
- Check network connectivity

---

## Tips & Best Practices

### For Best AI Generation Results

1. **Provide Rich Context**
   - Include detailed requirements
   - Add user stories
   - Specify test scenarios

2. **Review Generated Content**
   - Check for accuracy
   - Edit as needed
   - Add project-specific details

3. **Use Hierarchies**
   - Group related tests in suites
   - Organize suites under plans
   - Use meaningful names

4. **Manage Priorities**
   - Mark critical tests as high priority
   - Use status to track progress
   - Assign tests to team members

### Test Case Best Practices

- **Write Atomic Steps**: One action per step
- **Clear Expected Results**: Make them measurable
- **Use Realistic Data**: Data that can be reused
- **Good Coverage**: Balance happy path with errors
- **Proper Tags**: Use for filtering and organization

---

## What's Included

### Backend
- ✅ Full CRUD API for test management
- ✅ AI-powered generation using LangChain + OpenAI
- ✅ Service layer with business logic
- ✅ Database models and migrations
- ✅ Input validation and error handling

### Frontend
- ✅ Test management UI with tabs
- ✅ Create/edit dialogs
- ✅ Execution tracking
- ✅ AI generation interface
- ✅ TypeScript API client

### Documentation
- ✅ Complete API reference
- ✅ User guide with examples
- ✅ Architecture documentation
- ✅ Troubleshooting guide

---

## Next Steps

1. **Learn More**: Read [TEST_MANAGEMENT_GUIDE.md](./TEST_MANAGEMENT_GUIDE.md)
2. **Check Examples**: Review API examples in this guide
3. **Explore UI**: Test the frontend components
4. **Integrate**: Connect with your CI/CD pipeline

---

## Support

- 📚 Documentation: See `TEST_MANAGEMENT_GUIDE.md`
- 🐛 Issues: Check troubleshooting section
- 💬 Questions: Review API examples
- 🚀 Feedback: Open an issue on GitHub

---

## Key Stats

| Metric | Value |
|--------|-------|
| Total Endpoints | 21 |
| API Operations | CRUD + AI Generation |
| Database Tables | 3 (plans, suites, cases) |
| Frontend Components | 12+ |
| Documentation | 2000+ lines |
| Supported Generation Types | 3 (plans, suites, cases) |
| Status | Production Ready ✅ |

---

**Ready to generate your first test plan?** Start with the tutorial above! 🚀
