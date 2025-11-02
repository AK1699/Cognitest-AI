# Test Management Guide - Cognitest AI

Comprehensive guide for using the Test Plan, Test Suite, and Test Case management features in Cognitest.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Test Plans](#test-plans)
4. [Test Suites](#test-suites)
5. [Test Cases](#test-cases)
6. [AI Generation](#ai-generation)
7. [API Reference](#api-reference)
8. [Backend Architecture](#backend-architecture)
9. [Frontend Components](#frontend-components)
10. [Database Schema](#database-schema)

---

## Overview

Cognitest provides a comprehensive test management system that combines traditional test case creation with AI-powered test generation. The system is organized in a hierarchical structure:

**Test Plan** → **Test Suite** → **Test Case**

### Key Benefits

- **AI-Powered Generation**: Automatically generate test plans, suites, and cases from BRDs and requirements
- **Hierarchical Organization**: Organize tests in logical groups (plans → suites → cases)
- **Rich Execution Tracking**: Track test execution with detailed logs and attachments
- **Priority & Status Management**: Manage test priority and execution status
- **Comprehensive Metadata**: Support for custom tags, metadata, and attachments
- **Self-Learning**: AI agents learn from feedback to improve future generations

---

## Features

### Core Capabilities

| Feature | Description | AI-Powered |
|---------|-------------|-----------|
| **Test Plan Management** | Create and organize high-level test plans with objectives | Yes |
| **Test Suite Organization** | Group related test cases into logical suites | Yes |
| **Test Case Creation** | Define detailed test cases with steps and expected results | Yes |
| **Test Execution** | Record test execution with status, results, and attachments | No |
| **AI Generation** | Auto-generate test artifacts from documents and requirements | Yes |
| **Coverage Analysis** | Analyze test coverage and identify gaps | Yes |
| **Version History** | Track changes and maintain test plan versions | Partial |
| **Search & Filter** | Find tests by status, priority, tags, and more | No |
| **Reporting** | Generate execution and coverage reports | No |

---

## Test Plans

### What is a Test Plan?

A test plan is a high-level document that outlines:
- Overall testing strategy and approach
- Scope and objectives
- Test cases organized by feature
- Resource and schedule requirements
- Risk assessment

### Creating Test Plans

#### Manual Creation

```bash
POST /api/v1/test-plans/
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "uuid",
  "name": "User Authentication Test Plan",
  "description": "Comprehensive test plan for user authentication features",
  "objectives": [
    "Verify login flow with valid credentials",
    "Test password reset functionality",
    "Validate session management and security"
  ],
  "tags": ["authentication", "security", "critical"],
  "meta_data": {
    "version": "1.0",
    "scope": "web-only"
  },
  "created_by": "user@cognitest.ai"
}
```

#### AI-Powered Generation

Generate test plans from Business Requirements Documents (BRDs):

```bash
POST /api/v1/test-plans/ai-generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "uuid",
  "source_documents": ["doc_id_1", "doc_id_2"],
  "additional_context": "Focus on mobile platform compatibility",
  "objectives": [
    "Ensure multi-platform compatibility",
    "Test payment processing"
  ]
}
```

**Response:**
```json
{
  "test_plan": {
    "id": "uuid",
    "name": "AI Generated Test Plan",
    "description": "...",
    "objectives": [...],
    "generated_by": "ai",
    "confidence_score": "high",
    "created_at": "2024-11-02T10:00:00Z"
  },
  "confidence_score": "high",
  "suggestions": [
    "Consider adding edge case testing",
    "Include security penetration testing"
  ],
  "warnings": []
}
```

### Test Plan Operations

**List all test plans for a project:**
```bash
GET /api/v1/test-plans/?project_id=<project_id>
```

**Get specific test plan:**
```bash
GET /api/v1/test-plans/<test_plan_id>
```

**Update test plan:**
```bash
PUT /api/v1/test-plans/<test_plan_id>
{
  "name": "Updated name",
  "objectives": [...]
}
```

**Delete test plan:**
```bash
DELETE /api/v1/test-plans/<test_plan_id>
```

---

## Test Suites

### What is a Test Suite?

A test suite is a collection of related test cases that test a specific feature or functional area. Test suites:
- Group logically related test cases
- Can belong to a test plan
- Support execution history tracking
- Include preconditions and exit criteria

### Creating Test Suites

#### Manual Creation

```bash
POST /api/v1/test-suites/
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "uuid",
  "test_plan_id": "uuid",
  "name": "Login Flow Test Suite",
  "description": "Tests for login functionality including happy path and error scenarios",
  "tags": ["login", "authentication", "regression"],
  "meta_data": {
    "estimated_duration_minutes": 30,
    "preconditions": "Database must be initialized with test user"
  },
  "created_by": "user@cognitest.ai"
}
```

#### AI-Powered Generation

Generate test suites from requirements:

```bash
POST /api/v1/test-suites/ai-generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "uuid",
  "test_plan_id": "uuid",
  "requirements": "Users must be able to login with email/password or social OAuth providers. Sessions should expire after 24 hours.",
  "test_scenarios": [
    "Valid email and password",
    "Invalid email format",
    "Correct email, wrong password",
    "Session expiry",
    "OAuth login flow"
  ]
}
```

### Test Suite Operations

**List test suites:**
```bash
GET /api/v1/test-suites/?project_id=<project_id>&test_plan_id=<plan_id>
```

**Get test suite with cases:**
```bash
GET /api/v1/test-suites/<test_suite_id>
```

**Update test suite:**
```bash
PUT /api/v1/test-suites/<test_suite_id>
{
  "name": "Updated suite name",
  "description": "..."
}
```

**Delete test suite:**
```bash
DELETE /api/v1/test-suites/<test_suite_id>
```

---

## Test Cases

### What is a Test Case?

A test case is a specific, executable test that verifies functionality. Each test case includes:
- **Title**: Clear, descriptive name
- **Description**: What is being tested
- **Preconditions**: Setup required before execution
- **Steps**: Numbered, atomic action steps
- **Expected Results**: Expected outcome for each step
- **Priority**: Critical/High/Medium/Low
- **Status**: Draft/Ready/In Progress/Passed/Failed/Blocked/Skipped

### Creating Test Cases

#### Manual Creation

```bash
POST /api/v1/test-cases/
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "uuid",
  "test_suite_id": "uuid",
  "title": "Test successful login with valid credentials",
  "description": "Verify that a user can successfully login with valid email and password",
  "priority": "high",
  "steps": [
    {
      "step_number": 1,
      "action": "Navigate to login page",
      "expected_result": "Login form is displayed"
    },
    {
      "step_number": 2,
      "action": "Enter valid email address",
      "expected_result": "Email field accepts input"
    },
    {
      "step_number": 3,
      "action": "Enter valid password",
      "expected_result": "Password field accepts input (masked)"
    },
    {
      "step_number": 4,
      "action": "Click login button",
      "expected_result": "User is redirected to dashboard"
    }
  ],
  "expected_result": "User successfully logs in and sees the dashboard",
  "tags": ["smoke-test", "critical"],
  "created_by": "user@cognitest.ai"
}
```

#### AI-Powered Generation

Generate multiple test cases from feature description:

```bash
POST /api/v1/test-cases/ai-generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "uuid",
  "test_suite_id": "uuid",
  "feature_description": "User login with email/password and OAuth providers. Sessions expire after 24 hours. Failed login attempts are rate-limited.",
  "user_stories": [
    "As a user, I want to login with my email and password",
    "As a user, I want to login with Google",
    "As a user, I want to be logged out after 24 hours of inactivity"
  ],
  "test_scenarios": [
    "Happy path login",
    "Invalid password",
    "Non-existent email",
    "Session timeout",
    "Rate limiting on failed attempts"
  ],
  "count": 10
}
```

**Response:**
```json
{
  "test_cases": [
    {
      "id": "uuid",
      "title": "Test successful login with valid credentials",
      "description": "...",
      "steps": [...],
      "expected_result": "...",
      "priority": "high",
      "status": "draft",
      "ai_generated": true,
      "generated_by": "ai",
      "created_at": "2024-11-02T10:00:00Z"
    }
    // ... more test cases
  ],
  "coverage_analysis": "Comprehensive coverage of authentication flows including happy path, error handling, and security scenarios",
  "suggestions": [
    "Consider adding performance testing for login",
    "Include accessibility testing for login form"
  ]
}
```

### Test Case Operations

**List test cases:**
```bash
GET /api/v1/test-cases/?project_id=<project_id>&test_suite_id=<suite_id>
```

**Get test case:**
```bash
GET /api/v1/test-cases/<test_case_id>
```

**Update test case:**
```bash
PUT /api/v1/test-cases/<test_case_id>
{
  "title": "Updated title",
  "status": "ready",
  "priority": "critical"
}
```

**Execute test case:**
```bash
POST /api/v1/test-cases/execute
{
  "test_case_id": "uuid",
  "status": "passed",
  "actual_result": "User successfully logged in and dashboard displayed",
  "execution_notes": "Executed in Chrome 120 on Windows 11",
  "attachments": ["screenshot_url", "video_url"]
}
```

**Delete test case:**
```bash
DELETE /api/v1/test-cases/<test_case_id>
```

---

## AI Generation

### How AI Generation Works

The AI generation system uses LangChain with OpenAI's GPT-4 to intelligently generate test artifacts.

#### Generation Pipeline

```
1. Document Ingestion
   ↓
2. Context Retrieval (Semantic Search with Qdrant)
   ↓
3. AI Processing (LangChain + GPT-4)
   ↓
4. Structured Output Parsing
   ↓
5. Database Storage
   ↓
6. Vector Embedding for Future Learning
```

### System Prompts

**Test Plan Generation:**
```
You are an expert test plan generator. Create comprehensive test plans that include:
1. Test Scope - what will and won't be tested
2. Test Strategy - approach and methodology
3. Test Schedule and Resources
4. Test Cases organized by feature/module
5. Entry and Exit Criteria
6. Risk Assessment
7. Assumptions and Dependencies
```

**Test Suite Generation:**
```
You are an expert QA engineer. Create organized test suites that group related test cases.
For each test suite, provide:
1. Suite Name - descriptive name
2. Description - what this suite tests
3. Suggested Test Cases - list of test cases
4. Tags - categorization tags
5. Preconditions - setup needed
6. Exit Criteria - completion conditions
```

**Test Case Generation:**
```
You are an expert test case designer. Create detailed, actionable test cases that include:
1. Test Case ID and Title
2. Description - what is being tested
3. Priority - critical, high, medium, or low
4. Preconditions - setup required
5. Test Steps - numbered, clear action steps
6. Expected Results - what should happen
7. Tags - for organization and filtering
```

### Configuration

Set these environment variables for AI generation:

```env
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
QDRANT_URL=http://localhost:6333
```

---

## API Reference

### Test Plans Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/test-plans/` | POST | Create test plan |
| `/api/v1/test-plans/` | GET | List test plans |
| `/api/v1/test-plans/{id}` | GET | Get test plan |
| `/api/v1/test-plans/{id}` | PUT | Update test plan |
| `/api/v1/test-plans/{id}` | DELETE | Delete test plan |
| `/api/v1/test-plans/ai-generate` | POST | AI generate test plan |

### Test Suites Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/test-suites/` | POST | Create test suite |
| `/api/v1/test-suites/` | GET | List test suites |
| `/api/v1/test-suites/{id}` | GET | Get test suite |
| `/api/v1/test-suites/{id}` | PUT | Update test suite |
| `/api/v1/test-suites/{id}` | DELETE | Delete test suite |
| `/api/v1/test-suites/ai-generate` | POST | AI generate test suite |

### Test Cases Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/test-cases/` | POST | Create test case |
| `/api/v1/test-cases/` | GET | List test cases |
| `/api/v1/test-cases/{id}` | GET | Get test case |
| `/api/v1/test-cases/{id}` | PUT | Update test case |
| `/api/v1/test-cases/{id}` | DELETE | Delete test case |
| `/api/v1/test-cases/execute` | POST | Execute test case |
| `/api/v1/test-cases/ai-generate` | POST | AI generate test cases |

---

## Backend Architecture

### Service Layer

**TestPlanService** (`app/services/test_plan_service.py`)
- `generate_test_plan_from_brd()` - AI generation from documents
- `generate_test_suite_from_requirements()` - AI test suite generation
- `generate_test_cases()` - AI test case generation
- `store_generated_artifacts()` - Store for learning

**TestSuiteService**
- `get_suite_with_cases()` - Get suite with all cases
- `get_execution_summary()` - Get execution statistics

**TestCaseService**
- `get_case_with_logs()` - Get case with execution logs
- `get_cases_by_priority()` - Filter by priority
- `get_cases_by_status()` - Filter by status

### API Routes

**Test Plans** (`app/api/v1/test_plans.py`)
- CRUD operations
- AI generation with document context
- Project access verification

**Test Suites** (`app/api/v1/test_suites.py`)
- Suite management
- AI generation from requirements
- Test plan association

**Test Cases** (`app/api/v1/test_cases.py`)
- Test case CRUD
- Execution recording
- Bulk AI generation
- Step and priority management

---

## Frontend Components

### Pages

**Test Management Page** (`app/test-management/page.tsx`)
- Main entry point
- Tab-based interface for Plans/Suites/Cases

### Components

**Test Plans**
- `TestPlansTab` - Plans listing and creation
- `TestPlanCard` - Individual plan display
- `CreateTestPlanModal` - Plan creation dialog
- `AITestPlanGenerator` - AI generation interface

**Test Suites**
- `TestSuitesTab` - Suites listing and creation
- `TestSuiteCard` - Individual suite display
- `CreateTestSuiteModal` - Suite creation dialog

**Test Cases**
- `TestCasesTab` - Cases listing and management
- `TestCaseCard` - Individual case display
- `CreateTestCaseModal` - Case creation dialog

### API Client

**test-management.ts** (`lib/api/test-management.ts`)

Provides TypeScript interfaces and API functions:
```typescript
testPlansAPI.list(projectId)
testPlansAPI.create(data)
testPlansAPI.aiGenerate(request)
testSuitesAPI.aiGenerate(request)
testCasesAPI.aiGenerate(request)
testCasesAPI.execute(testCaseId, data)
```

---

## Database Schema

### test_plans
```sql
CREATE TABLE test_plans (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL (FOREIGN KEY -> projects.id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  objectives JSON,  -- Array of objective strings
  generated_by ENUM('ai', 'manual', 'hybrid'),
  source_documents JSON,  -- Array of document IDs
  confidence_score VARCHAR(50),
  tags JSON,  -- Array of tags
  meta_data JSON,  -- Custom metadata
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255) NOT NULL
);
```

### test_suites
```sql
CREATE TABLE test_suites (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL (FOREIGN KEY -> projects.id),
  test_plan_id UUID (FOREIGN KEY -> test_plans.id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  generated_by ENUM('ai', 'manual', 'hybrid'),
  execution_history JSON,  -- Array of execution records
  tags JSON,  -- Array of tags
  meta_data JSON,  -- Custom metadata
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255) NOT NULL
);
```

### test_cases
```sql
CREATE TABLE test_cases (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL (FOREIGN KEY -> projects.id),
  test_suite_id UUID (FOREIGN KEY -> test_suites.id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  steps JSON,  -- Array of {step_number, action, expected_result}
  expected_result TEXT,
  actual_result TEXT,
  status ENUM('draft', 'ready', 'in_progress', 'passed', 'failed', 'blocked', 'skipped'),
  priority ENUM('low', 'medium', 'high', 'critical'),
  ai_generated BOOLEAN,
  generated_by ENUM('ai', 'manual', 'hybrid'),
  confidence_score VARCHAR(50),
  execution_logs JSON,  -- Array of execution records
  tags JSON,  -- Array of tags
  attachments JSON,  -- Array of attachment URLs
  meta_data JSON,  -- Custom metadata
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255)
);
```

### Indexes

- `test_plans(project_id)`
- `test_suites(project_id)`
- `test_suites(test_plan_id)`
- `test_cases(project_id)`
- `test_cases(test_suite_id)`
- `test_cases(status)`
- `test_cases(priority)`

---

## Usage Examples

### Example 1: Create a Complete Test Plan from BRD

```python
# 1. Upload BRD document (done via document upload API)
# 2. Generate test plan from BRD
POST /api/v1/test-plans/ai-generate
{
  "project_id": "proj-123",
  "source_documents": ["brd-doc-456"],
  "objectives": ["Ensure payment processing works", "Verify security"]
}

# 3. Generate test suites for key features
POST /api/v1/test-suites/ai-generate
{
  "project_id": "proj-123",
  "test_plan_id": "plan-789",
  "requirements": "Payment processing for credit cards, PayPal, and Apple Pay"
}

# 4. Generate test cases for each suite
POST /api/v1/test-cases/ai-generate
{
  "project_id": "proj-123",
  "test_suite_id": "suite-101",
  "feature_description": "Credit card payment processing with 3D Secure",
  "count": 15
}
```

### Example 2: Manual Test Plan with AI Case Generation

```bash
# 1. Create test plan manually
POST /api/v1/test-plans/
{
  "project_id": "proj-123",
  "name": "Login Feature Test Plan",
  "objectives": ["Verify login flow", "Test session management"]
}

# 2. Create test suite manually
POST /api/v1/test-suites/
{
  "project_id": "proj-123",
  "test_plan_id": "plan-789",
  "name": "Email/Password Login Suite"
}

# 3. Generate test cases for the suite
POST /api/v1/test-cases/ai-generate
{
  "project_id": "proj-123",
  "test_suite_id": "suite-101",
  "feature_description": "Email/password login with rate limiting and 2FA",
  "user_stories": [
    "As a user, I want to login with email and password",
    "As a user, I want to be rate-limited after 5 failed attempts"
  ],
  "count": 8
}
```

### Example 3: Execute Tests and Track Results

```bash
# 1. Get test cases for a suite
GET /api/v1/test-cases/?project_id=proj-123&test_suite_id=suite-101

# 2. Execute a test case
POST /api/v1/test-cases/execute
{
  "test_case_id": "case-202",
  "status": "passed",
  "actual_result": "Login successful, user redirected to dashboard",
  "execution_notes": "Tested on Chrome 120, Windows 11",
  "attachments": ["screenshot_url"]
}

# 3. Get execution logs for a case
GET /api/v1/test-cases/case-202
```

---

## Best Practices

### For Test Plans

1. **Clear Objectives**: Define specific, measurable test objectives
2. **Document References**: Link to relevant BRDs, requirements, or designs
3. **Risk Assessment**: Identify and document potential testing risks
4. **Resource Planning**: Define who executes tests and timeframes

### For Test Suites

1. **Logical Grouping**: Group related tests by feature or functional area
2. **Preconditions**: Clearly document setup required before running suite
3. **Dependencies**: Document test interdependencies
4. **Execution Order**: Specify if tests should run in specific order

### For Test Cases

1. **Atomic Steps**: Each step should be a single, testable action
2. **Clear Assertions**: Make expected results measurable and verifiable
3. **Reusable Data**: Use realistic test data that can be reused
4. **Proper Priority**: Classify tests by business impact
5. **Good Coverage**: Aim for balance of happy path, edge cases, and errors

### For AI Generation

1. **Rich Context**: Provide detailed requirements and user stories
2. **Review Generated**: Always review AI-generated tests for accuracy
3. **Refine as Needed**: Edit generated tests to match your specific needs
4. **Provide Feedback**: Rate and comment on generated tests for learning
5. **Iterate**: Regenerate with additional context if needed

---

## Troubleshooting

### AI Generation Fails

**Problem**: AI generation endpoint returns 500 error

**Solutions**:
1. Check `OPENAI_API_KEY` is configured correctly
2. Ensure Qdrant vector database is running
3. Check database connection
4. Review API logs for specific error

### Tests Not Appearing

**Problem**: Created tests don't show in list

**Solutions**:
1. Verify correct project_id is being used
2. Check user has project access
3. Ensure test_suite_id is correct if filtering
4. Check for SQL errors in backend logs

### Performance Issues

**Problem**: Loading test lists is slow

**Solutions**:
1. Add database indexes on project_id and test_suite_id
2. Implement pagination in frontend
3. Use lazy loading for large test suites
4. Archive old/completed tests

---

## Future Enhancements

- **Test Execution Dashboard**: Real-time test execution visualization
- **Test Coverage Metrics**: Automatic coverage analysis
- **Test Reuse**: Save and reuse test case templates
- **Parallel Execution**: Support for parallel test execution
- **Integration**: Jira, TestRail, Qtest integration
- **Performance Analysis**: Track test execution performance over time
- **Accessibility Testing**: AI-powered accessibility test generation
- **Mobile Testing**: Device-specific test case generation
- **Performance Testing**: Load and stress test case generation

---

## Support

For issues, questions, or feature requests, please contact the Cognitest team or check the documentation at https://docs.cognitest.ai/test-management
