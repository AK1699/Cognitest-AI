# Cognitest - System Design Document

## 🎯 System Overview

Cognitest is a microservices-based, AI-first testing platform designed for scalability, modularity, and intelligent automation.

## 🏗️ High-Level Architecture

```
                                    ┌─────────────────────┐
                                    │   Load Balancer     │
                                    │    (Nginx/AWS)      │
                                    └──────────┬──────────┘
                                               │
                        ┌──────────────────────┼──────────────────────┐
                        │                      │                      │
                  ┌─────▼─────┐         ┌─────▼─────┐         ┌─────▼─────┐
                  │  Next.js  │         │  Next.js  │         │  Next.js  │
                  │ Frontend  │         │ Frontend  │         │ Frontend  │
                  │  (Node)   │         │  (Node)   │         │  (Node)   │
                  └─────┬─────┘         └─────┬─────┘         └─────┬─────┘
                        │                     │                      │
                        └──────────────────────┼──────────────────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │   API Gateway       │
                                    │   (FastAPI)         │
                                    └──────────┬──────────┘
                                               │
                 ┌─────────────────────────────┼─────────────────────────────┐
                 │                             │                             │
          ┌──────▼──────┐           ┌─────────▼─────────┐         ┌────────▼────────┐
          │   AI Agent  │           │   Core Business   │         │   Automation    │
          │ Orchestrator│           │     Services      │         │     Engine      │
          │             │           │                   │         │                 │
          │ • Test Plan │           │ • Projects API    │         │ • Playwright    │
          │ • Test Case │           │ • Test Mgmt API   │         │ • Appium        │
          │ • Issue Mgr │           │ • User Auth       │         │ • Workflows     │
          │ • Security  │           │ • Notifications   │         │ • Schedulers    │
          └──────┬──────┘           └─────────┬─────────┘         └────────┬────────┘
                 │                            │                            │
                 └────────────────────────────┼────────────────────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        │                     │                     │
                  ┌─────▼─────┐       ┌──────▼──────┐      ┌──────▼──────┐
                  │PostgreSQL │       │   Redis     │      │   Qdrant    │
                  │ (Primary) │       │   (Cache)   │      │  (Vector)   │
                  └───────────┘       └─────────────┘      └─────────────┘
                                              │
                                      ┌───────▼───────┐
                                      │    MinIO      │
                                      │  (S3 Store)   │
                                      └───────────────┘
```

## 🔄 Data Flow Diagrams

### 1. AI Test Plan Generation Flow

```
User Input (Requirements)
    │
    ▼
┌─────────────────────────┐
│  Frontend (Next.js)     │
│  - Upload BRD/Docs      │
│  - Enter Requirements   │
└───────────┬─────────────┘
            │ HTTP POST /api/v1/test-plans/generate
            ▼
┌─────────────────────────────────┐
│  FastAPI Backend                │
│  - Validate input               │
│  - Extract project context      │
└───────────┬─────────────────────┘
            │
            ▼
┌──────────────────────────────────┐
│  Test Plan Generator Agent       │
│  1. Retrieve similar plans       │
│  2. Query vector DB for context  │
│  3. Generate with LLM            │
│  4. Parse & validate output      │
└───────────┬──────────────────────┘
            │
            ▼
┌──────────────────────────────────┐
│  Knowledge Base (Qdrant)         │
│  - Store embeddings              │
│  - Retrieve similar context      │
└───────────┬──────────────────────┘
            │
            ▼
┌──────────────────────────────────┐
│  Database (PostgreSQL)           │
│  - Save test plan                │
│  - Link to project               │
└───────────┬──────────────────────┘
            │ Response (Test Plan JSON)
            ▼
┌─────────────────────────┐
│  Frontend               │
│  - Display test plan    │
│  - Allow editing        │
│  - Request feedback     │
└─────────────────────────┘
```

### 2. Workflow Automation Flow

```
Trigger Event (Schedule/Webhook/Manual)
    │
    ▼
┌────────────────────────┐
│  Workflow Engine       │
│  - Load workflow graph │
│  - Initialize context  │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│  Trigger Node          │
│  - Validate trigger    │
│  - Set initial data    │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│  Action Nodes          │
│  ┌──────────────────┐ │
│  │ Run Test Suite   │ │
│  └────────┬─────────┘ │
│           ▼           │
│  ┌──────────────────┐ │
│  │ Check Results    │ │
│  └────────┬─────────┘ │
│           ▼           │
│  ┌──────────────────┐ │
│  │ Condition: Failed│ │
│  └────────┬─────────┘ │
│           │ Yes       │
│           ▼           │
│  ┌──────────────────┐ │
│  │ Send Slack Alert │ │
│  └────────┬─────────┘ │
│           ▼           │
│  ┌──────────────────┐ │
│  │ Create JIRA      │ │
│  │ Issue            │ │
│  └──────────────────┘ │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│  Store Execution Log   │
│  (PostgreSQL + Redis)  │
└────────────────────────┘
```

### 3. Self-Learning Feedback Loop

```
┌─────────────────────────┐
│  User Interaction       │
│  - Accept/Reject        │
│  - Modify Suggestion    │
│  - Provide Feedback     │
└───────────┬─────────────┘
            │
            ▼
┌──────────────────────────────┐
│  Agent Feedback Collector    │
│  - Capture input/output      │
│  - Record user action        │
│  - Extract patterns          │
└───────────┬──────────────────┘
            │
            ▼
┌──────────────────────────────┐
│  Embedding Generator         │
│  - Create vector embedding   │
│  - Add metadata              │
└───────────┬──────────────────┘
            │
            ▼
┌──────────────────────────────┐
│  Vector Database (Qdrant)    │
│  - Store in project context  │
│  - Update knowledge base     │
└───────────┬──────────────────┘
            │
            ▼
┌──────────────────────────────┐
│  Future Queries              │
│  - Retrieve similar patterns │
│  - Improve suggestions       │
│  - Increase confidence       │
└──────────────────────────────┘
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    owner_id VARCHAR(255) NOT NULL,
    team_ids JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    ai_context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Test Plans
CREATE TABLE test_plans (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    objectives JSONB DEFAULT '[]',
    generated_by VARCHAR(50),
    source_documents JSONB DEFAULT '[]',
    confidence_score VARCHAR(50),
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL
);

-- Test Suites
CREATE TABLE test_suites (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    test_plan_id UUID REFERENCES test_plans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    generated_by VARCHAR(50),
    execution_history JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL
);

-- Test Cases
CREATE TABLE test_cases (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    test_suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]',
    expected_result TEXT,
    actual_result TEXT,
    status VARCHAR(50),
    priority VARCHAR(50),
    ai_generated BOOLEAN DEFAULT false,
    generated_by VARCHAR(50),
    confidence_score VARCHAR(50),
    execution_logs JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255)
);

-- Issues
CREATE TABLE issues (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    related_test_case_id UUID REFERENCES test_cases(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50),
    status VARCHAR(50),
    detected_by VARCHAR(50),
    remediation_suggestions JSONB DEFAULT '[]',
    ai_confidence VARCHAR(50),
    steps_to_reproduce JSONB DEFAULT '[]',
    environment JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255)
);

-- API Collections
CREATE TABLE api_collections (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requests JSONB DEFAULT '[]',
    environment JSONB DEFAULT '{}',
    imported_from VARCHAR(100),
    source_url VARCHAR(500),
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL
);
```

### Indexes for Performance

```sql
-- Project indexes
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Test plan indexes
CREATE INDEX idx_test_plans_project ON test_plans(project_id);
CREATE INDEX idx_test_plans_created ON test_plans(created_at DESC);

-- Test case indexes
CREATE INDEX idx_test_cases_project ON test_cases(project_id);
CREATE INDEX idx_test_cases_suite ON test_cases(test_suite_id);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_priority ON test_cases(priority);

-- Issue indexes
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
```

## 🔐 Security Architecture

### Authentication Flow

```
User Login Request
    │
    ▼
┌──────────────────┐
│  Clerk Auth      │
│  - Email/OAuth   │
│  - MFA           │
└────────┬─────────┘
         │ JWT Token
         ▼
┌──────────────────┐
│  Frontend        │
│  - Store token   │
│  - Set headers   │
└────────┬─────────┘
         │ API Request + JWT
         ▼
┌──────────────────┐
│  API Gateway     │
│  - Verify JWT    │
│  - Check RBAC    │
└────────┬─────────┘
         │ Authorized
         ▼
┌──────────────────┐
│  Backend Service │
│  - Process req   │
└──────────────────┘
```

### Authorization (RBAC)

```
Roles:
├── Owner
│   ├── Full project control
│   ├── Manage team members
│   └── Delete project
│
├── Admin
│   ├── Manage tests
│   ├── Configure integrations
│   └── View analytics
│
├── Editor
│   ├── Create/edit tests
│   ├── Run tests
│   └── Create issues
│
└── Viewer
    ├── View tests
    └── View reports
```

## 📊 Scalability Considerations

### Horizontal Scaling

- **Frontend**: Multiple Next.js instances behind load balancer
- **Backend**: Stateless FastAPI workers (scale with K8s HPA)
- **Database**: PostgreSQL read replicas for queries
- **Cache**: Redis cluster for distributed caching
- **Vector DB**: Qdrant cluster for high throughput

### Caching Strategy

```
Request Flow:
1. Check Redis cache (TTL: 5 min)
2. If miss → Query PostgreSQL
3. Store result in Redis
4. Return response

Invalidation:
- On data updates (POST/PUT/DELETE)
- Clear related cache keys
- Use cache tags for grouping
```

### Task Queue Architecture

```
┌─────────────┐
│   API       │
│  Request    │
└──────┬──────┘
       │
       ▼
┌────────────────┐
│  Celery Worker │ ←─── Redis Queue
└────────────────┘
       │
       ▼
┌────────────────┐
│  Long Tasks:   │
│  - AI Gen      │
│  - Test Run    │
│  - Report Gen  │
└────────────────┘
```

## 🔍 Monitoring & Observability

### Metrics to Track

1. **Application Metrics**
   - Request latency (p50, p95, p99)
   - Error rates
   - Active users
   - Test execution count

2. **AI Agent Metrics**
   - Generation latency
   - Confidence scores
   - User acceptance rate
   - Feedback loop efficiency

3. **Infrastructure Metrics**
   - CPU/Memory usage
   - Database connections
   - Cache hit rate
   - Queue length

### Logging Strategy

```
Log Levels:
- ERROR: System failures, unhandled exceptions
- WARN: Deprecated usage, slow queries
- INFO: User actions, API requests
- DEBUG: Detailed execution traces

Format: JSON
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "backend",
  "user_id": "user_123",
  "request_id": "req_456",
  "message": "Test plan generated",
  "metadata": {}
}
```

## 🚀 Performance Optimization

### Frontend Optimization

- Code splitting by route
- Image optimization with Next.js Image
- Lazy loading components
- React Query for data caching
- Service Worker for offline support

### Backend Optimization

- Database query optimization
- Connection pooling
- Async I/O operations
- Response compression
- API response pagination

### AI Agent Optimization

- Prompt caching
- Batch embeddings generation
- Vector search optimization
- Model response streaming
- Fallback models for cost

## 📈 Cost Estimation (Monthly)

### Infrastructure Costs

- **AWS/Cloud**: $200-500 (depending on usage)
- **Database (RDS)**: $50-150
- **Redis (ElastiCache)**: $30-80
- **Object Storage (S3)**: $10-50
- **Load Balancer**: $20-50

### AI Costs (Based on usage)

- **OpenAI GPT-4**: $0.03/1K tokens (input), $0.06/1K tokens (output)
- **Embeddings**: $0.0001/1K tokens
- **Estimated**: $100-500/month for moderate usage

### Total Estimated: $400-1,500/month

