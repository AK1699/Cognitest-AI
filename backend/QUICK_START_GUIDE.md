# Test Management - Quick Start Guide

Get started with Test Management in 5 minutes!

---

## 🚀 Quick Start in 3 Steps

### Step 1: Create a Test Plan (2 minutes)

```bash
# Set your credentials
export TOKEN="your-auth-token-here"
export PROJECT_ID="your-project-id"

# Create a test plan
curl -X POST http://localhost:8000/api/v1/test-plans/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "name": "My First Test Plan",
    "description": "Testing user login feature",
    "objectives": [
      "Verify successful login",
      "Test invalid credentials",
      "Check session timeout"
    ],
    "tags": ["login", "authentication"],
    "generated_by": "manual",
    "created_by": "you@example.com"
  }'
```

### Step 2: Create a Test Suite (1 minute)

```bash
# Save the test plan ID from Step 1
export TEST_PLAN_ID="test-plan-id-from-step-1"

# Create a test suite
curl -X POST http://localhost:8000/api/v1/test-suites/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "test_plan_id": "'$TEST_PLAN_ID'",
    "name": "Login Tests",
    "description": "All login-related test cases",
    "tags": ["smoke-test"],
    "created_by": "you@example.com"
  }'
```

### Step 3: Create a Test Case (2 minutes)

```bash
# Save the test suite ID from Step 2
export TEST_SUITE_ID="test-suite-id-from-step-2"

# Create a test case
curl -X POST http://localhost:8000/api/v1/test-cases/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "test_suite_id": "'$TEST_SUITE_ID'",
    "title": "Test successful login",
    "description": "Verify user can login with valid credentials",
    "steps": [
      {
        "step_number": 1,
        "action": "Open login page",
        "expected_result": "Login form displayed"
      },
      {
        "step_number": 2,
        "action": "Enter valid email and password",
        "expected_result": "Credentials accepted"
      },
      {
        "step_number": 3,
        "action": "Click Login button",
        "expected_result": "User redirected to dashboard"
      }
    ],
    "expected_result": "User successfully logged in",
    "priority": "critical",
    "tags": ["smoke-test"],
    "created_by": "you@example.com"
  }'
```

**✅ Congratulations!** You've created your first test plan, suite, and case!

---

## 📊 Visual Flow

```
┌─────────────────────────────────────────┐
│         Test Management Flow            │
└─────────────────────────────────────────┘

1️⃣  CREATE TEST PLAN
    ├── Define objectives
    ├── Set scope
    └── Add tags
         │
         ▼
2️⃣  CREATE TEST SUITES (Groups)
    ├── Login Tests
    ├── Registration Tests
    └── Payment Tests
         │
         ▼
3️⃣  CREATE TEST CASES
    ├── Test Case 1: Valid login
    ├── Test Case 2: Invalid password
    └── Test Case 3: Expired session
         │
         ▼
4️⃣  SUBMIT FOR APPROVAL (Optional)
    ├── Stage 1: Technical Review
    ├── Stage 2: Manager Approval
    └── Stage 3: Sign-off
         │
         ▼
5️⃣  EXECUTE TESTS
    └── Track results
```

---

## 🎯 Common Use Cases

### Use Case 1: Testing a New Feature

```bash
# 1. Create test plan for the feature
curl -X POST http://localhost:8000/api/v1/test-plans/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "name": "Shopping Cart Feature Test Plan",
    "objectives": ["Test add to cart", "Test remove from cart", "Test cart persistence"],
    "generated_by": "manual",
    "created_by": "qa@example.com"
  }'

# 2. Create test suites for different scenarios
# - Happy Path Suite
# - Error Handling Suite
# - Performance Suite

# 3. Create test cases for each scenario
# 4. Submit for approval
# 5. Execute tests
```

### Use Case 2: Regression Testing

```bash
# Create regression test suite
curl -X POST http://localhost:8000/api/v1/test-suites/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "test_plan_id": "'$TEST_PLAN_ID'",
    "name": "Regression Test Suite",
    "description": "Critical tests to run before each release",
    "tags": ["regression", "smoke-test"],
    "created_by": "qa@example.com"
  }'
```

### Use Case 3: Security Testing

```bash
# Create security test plan
curl -X POST http://localhost:8000/api/v1/test-plans/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "name": "Security Test Plan",
    "objectives": [
      "Test SQL injection prevention",
      "Verify XSS protection",
      "Check authentication security"
    ],
    "tags": ["security", "critical"],
    "generated_by": "manual",
    "created_by": "security@example.com"
  }'
```

---

## 🔍 Viewing Your Data

### List All Test Plans

```bash
curl -X GET "http://localhost:8000/api/v1/test-plans/?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### List All Test Suites

```bash
curl -X GET "http://localhost:8000/api/v1/test-suites/?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### List All Test Cases

```bash
curl -X GET "http://localhost:8000/api/v1/test-cases/?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## ⚡ Using the Approval Workflow

### 1. Create Approval Workflow (One-time setup)

```bash
export ORG_ID="your-org-id"

curl -X POST http://localhost:8000/api/v1/approvals/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "organisation_id": "'$ORG_ID'",
    "name": "2-Stage Approval",
    "stages": [
      {
        "order": 1,
        "role": "qa_manager",
        "name": "QA Review",
        "required": true
      },
      {
        "order": 2,
        "role": "product_owner",
        "name": "Business Approval",
        "required": true
      }
    ],
    "escalation_enabled": "enabled",
    "escalation_sla_hours": 24,
    "created_by": "admin@example.com"
  }'
```

### 2. Submit Test Plan for Approval

```bash
curl -X POST http://localhost:8000/api/v1/approvals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "test_plan_id": "'$TEST_PLAN_ID'"
  }'
```

### 3. Check Status

```bash
curl -X GET "http://localhost:8000/api/v1/approvals/test-plan/$TEST_PLAN_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 4. Approve a Stage

```bash
# Get the stage ID from the status check above
export STAGE_ID="approval-stage-id"

curl -X POST "http://localhost:8000/api/v1/approvals/approve/$STAGE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "decision": "approved",
    "comments": "Looks good!"
  }'
```

---

## 🎨 UI Integration (Frontend)

If you're building the UI, here's what each API call translates to:

### Page: Test Plans List

```typescript
// Fetch test plans
const testPlans = await axios.get(`/api/v1/test-plans/?project_id=${projectId}`)

// Display in a list/grid
testPlans.data.map(plan => (
  <TestPlanCard
    name={plan.name}
    objectives={plan.objectives}
    createdBy={plan.created_by}
  />
))
```

### Button: Create Test Plan

```typescript
const createTestPlan = async () => {
  await axios.post('/api/v1/test-plans/', {
    project_id: projectId,
    name: formData.name,
    objectives: formData.objectives,
    generated_by: 'manual',
    created_by: user.email
  })
}
```

### Button: Generate with AI (Coming Soon)

```typescript
const generateWithAI = async () => {
  try {
    const response = await axios.post('/api/v1/test-plans/ai-generate', {
      project_id: projectId,
      source_documents: [documentUrl],
      additional_context: context
    })
    // Show success with confidence score
  } catch (error) {
    // Will show "not implemented" until AI is integrated
  }
}
```

---

## 📱 Example Complete Workflow Script

Save this as `create_test_workflow.sh`:

```bash
#!/bin/bash

# Configuration
export TOKEN="your-token"
export PROJECT_ID="your-project-id"
export ORG_ID="your-org-id"
API_URL="http://localhost:8000/api/v1"

echo "🚀 Creating complete test workflow..."

# 1. Create Test Plan
echo "📋 Creating test plan..."
TEST_PLAN=$(curl -s -X POST "$API_URL/test-plans/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "name": "API Testing Plan",
    "description": "Complete API testing strategy",
    "objectives": ["Test all endpoints", "Validate responses", "Check error handling"],
    "tags": ["api", "backend"],
    "generated_by": "manual",
    "created_by": "qa@example.com"
  }' | jq -r '.id')

echo "✅ Test Plan created: $TEST_PLAN"

# 2. Create Test Suite
echo "📦 Creating test suite..."
TEST_SUITE=$(curl -s -X POST "$API_URL/test-suites/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "test_plan_id": "'$TEST_PLAN'",
    "name": "User API Tests",
    "description": "Tests for user endpoints",
    "created_by": "qa@example.com"
  }' | jq -r '.id')

echo "✅ Test Suite created: $TEST_SUITE"

# 3. Create Test Case
echo "📝 Creating test case..."
TEST_CASE=$(curl -s -X POST "$API_URL/test-cases/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "test_suite_id": "'$TEST_SUITE'",
    "title": "GET /users - Success",
    "description": "Test successful user list retrieval",
    "steps": [
      {"step_number": 1, "action": "Send GET /users", "expected_result": "200 OK"},
      {"step_number": 2, "action": "Verify response structure", "expected_result": "Valid JSON array"}
    ],
    "expected_result": "User list returned successfully",
    "priority": "high",
    "created_by": "qa@example.com"
  }' | jq -r '.id')

echo "✅ Test Case created: $TEST_CASE"

# 4. Submit for Approval
echo "✔️  Submitting for approval..."
APPROVAL=$(curl -s -X POST "$API_URL/approvals/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "test_plan_id": "'$TEST_PLAN'"
  }' | jq -r '.id')

echo "✅ Submitted for approval: $APPROVAL"

echo ""
echo "🎉 Complete workflow created!"
echo "Test Plan: $TEST_PLAN"
echo "Test Suite: $TEST_SUITE"
echo "Test Case: $TEST_CASE"
echo "Approval: $APPROVAL"
```

Run it:
```bash
chmod +x create_test_workflow.sh
./create_test_workflow.sh
```

---

## 🆘 Troubleshooting

### Error: 401 Unauthorized
**Fix**: Get a new auth token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### Error: 404 Project not found
**Fix**: Verify your project ID
```bash
curl -X GET http://localhost:8000/api/v1/projects/ \
  -H "Authorization: Bearer $TOKEN"
```

### Error: 501 Not Implemented (AI generation)
**Fix**: AI features coming soon, use manual creation

---

## 📚 Next Steps

1. ✅ **You're Done!** - You now know how to use Test Management
2. 📖 Read the full guide: `TEST_MANAGEMENT_USER_GUIDE.md`
3. 🎨 Build the UI: `UI_TEST_PLAN_GENERATOR_GUIDE.md`
4. 🔧 Technical details: `TEST_MANAGEMENT_IMPLEMENTATION.md`

---

## 🌐 API Documentation

Visit http://localhost:8000/docs for interactive API documentation!

**Happy Testing! 🚀**
