# Test Management Module - User Guide

A complete guide to using the Test Management features in Cognitest.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Creating Test Plans](#creating-test-plans)
4. [Managing Test Suites](#managing-test-suites)
5. [Creating Test Cases](#creating-test-cases)
6. [Approval Workflow](#approval-workflow)
7. [API Examples](#api-examples)
8. [Best Practices](#best-practices)

---

## Overview

### What is Test Management?

The Test Management module helps you:
- **Plan** your testing strategy
- **Organize** tests into logical groups
- **Create** detailed test cases
- **Track** test execution
- **Approve** test plans through workflows
- **Generate** tests using AI (coming soon)

### Hierarchy

```
Organization
  └── Project
       └── Test Plan (Strategy & Objectives)
            └── Test Suite (Group of related tests)
                 └── Test Case (Individual test)
                      └── Test Steps (Step-by-step instructions)
```

---

## Getting Started

### Prerequisites

1. **Active Account**: Sign in to Cognitest
2. **Organization**: Create or join an organization
3. **Project**: Create a project within your organization

### Access Test Management

1. Navigate to your project
2. Click on **"Test Management"** from the project menu
3. You'll see three tabs:
   - Test Plans
   - Test Suites
   - Test Cases

---

## Creating Test Plans

### What is a Test Plan?

A test plan defines:
- Testing objectives
- Scope of testing
- Test strategy
- Coverage areas
- Resources needed

### Method 1: Create Manually

**Step-by-Step:**

1. **Navigate to Test Plans**
   - Go to your project → Test Management → Test Plans

2. **Click "Create Test Plan"**

3. **Fill in Details:**
   ```
   Name: e.g., "User Authentication Test Plan"
   Description: Comprehensive testing of login, logout, and session management
   Objectives:
     - Verify login with valid credentials
     - Test password reset flow
     - Validate session timeout
     - Check multi-factor authentication
   Tags: authentication, security, critical
   ```

4. **Save**
   - Click "Create Test Plan"
   - Your test plan is now created!

**API Example:**
```bash
curl -X POST http://localhost:8000/api/v1/test-plans/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "your-project-uuid",
    "name": "User Authentication Test Plan",
    "description": "Comprehensive testing of login, logout, and session management",
    "objectives": [
      "Verify login with valid credentials",
      "Test password reset flow",
      "Validate session timeout"
    ],
    "tags": ["authentication", "security"],
    "generated_by": "manual",
    "created_by": "your-email@example.com"
  }'
```

### Method 2: AI-Powered Generation (Coming Soon)

**What You Need:**
- Requirements document (PDF, Word, Google Doc)
- BRD (Business Requirements Document)
- User stories
- Feature specifications

**How It Works:**
1. Upload or provide URL to your requirements
2. AI analyzes the document
3. Generates comprehensive test plan with:
   - Test objectives
   - Coverage areas
   - Recommended test suites
   - Confidence score

**API Example (Future):**
```bash
curl -X POST http://localhost:8000/api/v1/test-plans/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "your-project-uuid",
    "source_documents": [
      "https://docs.example.com/auth-requirements.pdf"
    ],
    "additional_context": "Focus on security and edge cases",
    "objectives": [
      "Test all authentication methods",
      "Verify security compliance"
    ]
  }'
```

### Viewing Test Plans

**List All Test Plans:**
```bash
curl -X GET "http://localhost:8000/api/v1/test-plans/?project_id=your-project-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Specific Test Plan:**
```bash
curl -X GET "http://localhost:8000/api/v1/test-plans/{test-plan-id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Managing Test Suites

### What is a Test Suite?

A test suite is a collection of related test cases that:
- Test a specific feature or module
- Share common setup/teardown
- Can be executed together
- Organize tests logically

### Creating a Test Suite

**Example: Login Feature Test Suite**

```bash
curl -X POST http://localhost:8000/api/v1/test-suites/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "your-project-uuid",
    "test_plan_id": "test-plan-uuid",
    "name": "Login Flow Test Suite",
    "description": "Tests all login-related functionality",
    "tags": ["login", "authentication"],
    "created_by": "your-email@example.com"
  }'
```

### Common Test Suite Examples

1. **Functional Testing**
   - Login Test Suite
   - Registration Test Suite
   - Payment Processing Suite
   - Search Functionality Suite

2. **Non-Functional Testing**
   - Performance Test Suite
   - Security Test Suite
   - Accessibility Test Suite
   - Usability Test Suite

3. **Integration Testing**
   - API Integration Suite
   - Database Integration Suite
   - Third-party Service Suite

---

## Creating Test Cases

### What is a Test Case?

A test case contains:
- **Title**: Clear description
- **Description**: What is being tested
- **Steps**: Detailed instructions
- **Expected Result**: What should happen
- **Priority**: Critical, High, Medium, Low
- **Status**: Draft, Ready, In Progress, Passed, Failed

### Test Case Structure

```
Test Case: Successful Login with Valid Credentials

Description:
Verify that a user can successfully log in using valid email and password

Preconditions:
- User account exists
- User has verified email
- Browser is open

Steps:
1. Navigate to login page
   Expected: Login form is displayed with email and password fields

2. Enter valid email address
   Expected: Email field accepts the input

3. Enter valid password
   Expected: Password is masked, field accepts input

4. Click "Login" button
   Expected: User is redirected to dashboard

5. Verify user is logged in
   Expected: User name is displayed, logout option available

Expected Result:
User successfully logs in and sees the dashboard

Priority: Critical
Type: Functional
Tags: smoke-test, authentication
```

### Creating a Test Case via API

```bash
curl -X POST http://localhost:8000/api/v1/test-cases/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "your-project-uuid",
    "test_suite_id": "test-suite-uuid",
    "title": "Successful login with valid credentials",
    "description": "Verify that a user can successfully log in using valid email and password",
    "steps": [
      {
        "step_number": 1,
        "action": "Navigate to login page",
        "expected_result": "Login form is displayed"
      },
      {
        "step_number": 2,
        "action": "Enter valid email",
        "expected_result": "Email field accepts input"
      },
      {
        "step_number": 3,
        "action": "Enter valid password",
        "expected_result": "Password field accepts input"
      },
      {
        "step_number": 4,
        "action": "Click login button",
        "expected_result": "User is redirected to dashboard"
      }
    ],
    "expected_result": "User successfully logs in and sees the dashboard",
    "priority": "critical",
    "tags": ["smoke-test", "authentication"],
    "created_by": "your-email@example.com"
  }'
```

### Test Case Priorities

- **Critical**: Core functionality, must work
- **High**: Important features, high impact
- **Medium**: Standard features
- **Low**: Nice-to-have, edge cases

### Test Case Status

- **Draft**: Being written
- **Ready**: Ready for execution
- **In Progress**: Currently being tested
- **Passed**: Test successful
- **Failed**: Test failed
- **Blocked**: Cannot proceed
- **Skipped**: Not executed

---

## Approval Workflow

### Why Use Approval Workflows?

Approval workflows ensure:
- **Quality**: Multiple reviewers check test plans
- **Compliance**: Meet organizational standards
- **Accountability**: Track who approved what
- **Collaboration**: Team involvement in testing strategy

### How It Works

```
1. QA Lead creates Test Plan
         ↓
2. Submit for Approval
         ↓
3. Stage 1: Senior QA Engineer Review
         ↓ (approved)
4. Stage 2: QA Manager Approval
         ↓ (approved)
5. Stage 3: Project Manager Review
         ↓ (approved)
6. Stage 4: Product Owner Sign-Off
         ↓ (approved)
7. Test Plan Approved → Ready for Execution
```

### Step 1: Create an Approval Workflow

```bash
curl -X POST http://localhost:8000/api/v1/approvals/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "your-project-uuid",
    "organisation_id": "your-org-uuid",
    "name": "Standard Test Plan Approval",
    "description": "4-stage approval workflow for test plans",
    "stages": [
      {
        "order": 1,
        "role": "senior_qa_engineer",
        "name": "Technical Review",
        "required": true,
        "parallel": false
      },
      {
        "order": 2,
        "role": "qa_manager",
        "name": "Management Approval",
        "required": true,
        "parallel": false
      },
      {
        "order": 3,
        "role": "project_manager",
        "name": "Project Alignment",
        "required": true,
        "parallel": false
      },
      {
        "order": 4,
        "role": "product_owner",
        "name": "Business Sign-Off",
        "required": true,
        "parallel": false
      }
    ],
    "escalation_enabled": "enabled",
    "escalation_sla_hours": 48,
    "created_by": "your-email@example.com"
  }'
```

### Step 2: Submit Test Plan for Approval

```bash
curl -X POST http://localhost:8000/api/v1/approvals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "test_plan_id": "your-test-plan-uuid",
    "workflow_id": "workflow-uuid"
  }'
```

### Step 3: Approve/Reject a Stage

**Approve:**
```bash
curl -X POST http://localhost:8000/api/v1/approvals/approve/{approval-stage-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "decision": "approved",
    "comments": "Test coverage looks comprehensive. Approved.",
    "feedback": [
      {
        "category": "coverage",
        "rating": "good",
        "comment": "All critical paths covered"
      }
    ]
  }'
```

**Request Changes:**
```bash
curl -X POST http://localhost:8000/api/v1/approvals/approve/{approval-stage-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "decision": "changes_requested",
    "comments": "Need more edge case coverage for password validation",
    "feedback": [
      {
        "category": "coverage",
        "rating": "needs_improvement",
        "comment": "Missing edge cases for special characters in passwords"
      }
    ]
  }'
```

**Reject:**
```bash
curl -X POST http://localhost:8000/api/v1/approvals/approve/{approval-stage-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "decision": "rejected",
    "comments": "Test plan does not align with security requirements",
    "feedback": [
      {
        "category": "compliance",
        "rating": "poor",
        "comment": "Missing security compliance testing"
      }
    ]
  }'
```

### Step 4: Check Approval Status

```bash
curl -X GET http://localhost:8000/api/v1/approvals/test-plan/{test-plan-id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "approval-uuid",
  "test_plan_id": "test-plan-uuid",
  "workflow_id": "workflow-uuid",
  "overall_status": "pending",
  "current_stage": 2,
  "submitted_at": "2025-01-01T10:00:00Z",
  "approval_stages": [
    {
      "stage_order": 1,
      "stage_name": "Technical Review",
      "stage_role": "senior_qa_engineer",
      "status": "approved",
      "approver_email": "senior.qa@example.com",
      "reviewed_at": "2025-01-01T11:00:00Z",
      "comments": "Looks good"
    },
    {
      "stage_order": 2,
      "stage_name": "Management Approval",
      "stage_role": "qa_manager",
      "status": "pending",
      "approver_email": null,
      "reviewed_at": null
    }
  ]
}
```

### Step 5: View Approval History

```bash
curl -X GET http://localhost:8000/api/v1/approvals/history/{approval-id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API Examples

### Complete Workflow Example

**1. Create a Test Plan**
```bash
# Create test plan
TEST_PLAN=$(curl -X POST http://localhost:8000/api/v1/test-plans/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "name": "E-Commerce Checkout Test Plan",
    "description": "Testing the complete checkout flow",
    "objectives": [
      "Verify cart functionality",
      "Test payment processing",
      "Validate order confirmation"
    ],
    "tags": ["checkout", "payments"],
    "generated_by": "manual",
    "created_by": "qa@example.com"
  }' | jq -r '.id')

echo "Test Plan ID: $TEST_PLAN"
```

**2. Create Test Suites**
```bash
# Create suite for cart tests
CART_SUITE=$(curl -X POST http://localhost:8000/api/v1/test-suites/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "test_plan_id": "'$TEST_PLAN'",
    "name": "Shopping Cart Tests",
    "description": "Tests for add/remove/update cart items",
    "created_by": "qa@example.com"
  }' | jq -r '.id')

echo "Cart Suite ID: $CART_SUITE"
```

**3. Create Test Cases**
```bash
# Create test case for adding items
curl -X POST http://localhost:8000/api/v1/test-cases/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "test_suite_id": "'$CART_SUITE'",
    "title": "Add item to cart",
    "description": "Verify user can add product to cart",
    "steps": [
      {
        "step_number": 1,
        "action": "Click Add to Cart button",
        "expected_result": "Item is added to cart"
      },
      {
        "step_number": 2,
        "action": "View cart",
        "expected_result": "Item appears in cart with correct quantity"
      }
    ],
    "expected_result": "Item successfully added to cart",
    "priority": "high",
    "created_by": "qa@example.com"
  }'
```

**4. Submit for Approval**
```bash
# Submit test plan for approval
APPROVAL=$(curl -X POST http://localhost:8000/api/v1/approvals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "test_plan_id": "'$TEST_PLAN'"
  }' | jq -r '.id')

echo "Approval ID: $APPROVAL"
```

**5. Get Approval Stages**
```bash
# Get approval stages
STAGES=$(curl -X GET "http://localhost:8000/api/v1/approvals/test-plan/$TEST_PLAN" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.approval_stages[0].id')

echo "First Stage ID: $STAGES"
```

**6. Approve Stage**
```bash
# Approve first stage
curl -X POST "http://localhost:8000/api/v1/approvals/approve/$STAGES" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "decision": "approved",
    "comments": "Test plan looks comprehensive"
  }'
```

---

## Best Practices

### Test Plan Best Practices

1. **Clear Objectives**
   - Be specific about what you're testing
   - Align with project goals
   - Make objectives measurable

2. **Comprehensive Coverage**
   - Cover all critical paths
   - Include positive and negative scenarios
   - Don't forget edge cases

3. **Proper Organization**
   - Group related tests into suites
   - Use consistent naming conventions
   - Tag appropriately for filtering

4. **Regular Updates**
   - Review test plans when requirements change
   - Archive outdated test plans
   - Keep test cases current

### Test Case Best Practices

1. **Write Clear Steps**
   - Each step should be actionable
   - Include expected results for each step
   - Use simple language

2. **Set Priorities**
   - Critical: Must work for release
   - High: Important functionality
   - Medium: Standard features
   - Low: Nice-to-have

3. **Add Context**
   - Include preconditions
   - Specify test data needed
   - Note any dependencies

4. **Use Tags**
   - `smoke-test`: Quick sanity checks
   - `regression`: For regression testing
   - `critical`: Must-pass tests
   - `automated`: Candidates for automation

### Approval Workflow Best Practices

1. **Define Clear Roles**
   - Assign specific roles to stages
   - Ensure role holders have authority
   - Document escalation paths

2. **Set Realistic SLAs**
   - 24-48 hours per stage is common
   - Account for time zones
   - Plan for unavailability

3. **Provide Feedback**
   - Give specific, actionable comments
   - Use structured feedback
   - Be constructive

4. **Track History**
   - Review approval history
   - Learn from rejections
   - Improve processes

---

## Troubleshooting

### Common Issues

**Issue: Cannot create test plan**
- Check you have a valid project
- Verify you're logged in
- Ensure you have permissions

**Issue: AI generation returns 501 error**
- AI features are coming soon
- Use manual creation for now
- Check back for updates

**Issue: Approval workflow not found**
- Create a workflow first
- Ensure workflow is active
- Check project ID matches

**Issue: Cannot approve stage**
- Verify you have the correct role
- Check stage is in "pending" status
- Ensure test plan was submitted

---

## Next Steps

1. **Create Your First Test Plan**
   - Start with a small feature
   - Add 2-3 test cases
   - Practice the workflow

2. **Set Up Approval Workflow**
   - Define your team roles
   - Create a workflow
   - Test the approval process

3. **Build Your Test Library**
   - Create test suites for features
   - Build reusable test cases
   - Organize with tags

4. **Integrate with CI/CD** (Future)
   - Automate test execution
   - Link to test results
   - Track coverage metrics

---

## Support

- **API Documentation**: http://localhost:8000/docs
- **Backend Guide**: `TEST_MANAGEMENT_IMPLEMENTATION.md`
- **UI Guide**: `UI_TEST_PLAN_GENERATOR_GUIDE.md`

---

**Last Updated**: October 28, 2025
**Version**: 1.0
**Module Status**: ✅ Fully Operational
