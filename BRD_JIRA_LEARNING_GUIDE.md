# BRD + JIRA Integration with AI Self-Learning

## Complete Test Plan Generation with Continuous Learning

Your Cognitest AI now learns from **everything** when generating test plans:

```
BRD Document          JIRA User Story        Past Feedback
      ↓                     ↓                      ↓
      └─────────────────────┴──────────────────────┘
                            ↓
                  CONTEXT BUILDING LAYER
                            ↓
                    Enhanced Test Plan
                            ↓
                   User Reviews & Rates
                            ↓
                   AI LEARNS & IMPROVES
                            ↓
              Next Plan Even Better ✨
```

## What the System Learns

### 1. **From BRD Documents**
```
Upload: Business Requirements Document
        ├─ System architecture
        ├─ Functional requirements
        ├─ Non-functional requirements
        ├─ User workflows
        ├─ Data models
        ├─ Integration points
        └─ Compliance requirements
              ↓
        AI learns:
        ├─ What makes comprehensive test plans
        ├─ Which sections matter most
        ├─ Effective test coverage patterns
        └─ Regulatory compliance patterns
```

### 2. **From JIRA User Stories**
```
Connect: JIRA Integration
        ├─ User story details
        ├─ Acceptance criteria
        ├─ Issue descriptions
        ├─ Component mappings
        ├─ Priority levels
        ├─ Epic relationships
        └─ Story labels/tags
              ↓
        AI learns:
        ├─ Story to test case mapping
        ├─ What acceptance criteria require
        ├─ How to handle different priorities
        └─ Component-specific testing patterns
```

### 3. **From User Feedback**
```
Collect: Test Plan Feedback
        ├─ Acceptance (👍 or 👎)
        ├─ Rating (1-5 stars)
        ├─ Modifications made
        ├─ Comments on quality
        ├─ BRD section effectiveness
        └─ Missing test areas
              ↓
        AI learns:
        ├─ Which BRD sections matter
        ├─ Effective test patterns
        ├─ User expectations
        ├─ Improvement areas
        └─ Project-specific standards
```

## Setup & Configuration

### Prerequisites

```
✅ PostgreSQL
✅ Qdrant Vector Database
✅ OpenAI API key
✅ JIRA instance (optional but recommended)
✅ BRD documents ready to upload
```

### Step 1: Update Configuration

Add to `.env`:
```env
# Existing
QDRANT_URL=http://localhost:6333
DATABASE_URL=postgresql+asyncpg://...

# JIRA Integration (optional)
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-api-token

# Or pass at runtime in requests
```

### Step 2: Register Endpoints

In `app/main.py`:
```python
from app.api.v1.endpoints import documents, test_plans_ai

app.include_router(documents.router)
app.include_router(test_plans_ai.router)
```

### Step 3: Create Database Migration

```bash
alembic revision --autogenerate -m "Add test plan learning"
alembic upgrade head
```

### Step 4: Verify Setup

```bash
# Test document upload
curl -X POST http://localhost:8000/api/v1/documents/upload-text \
  -H "Authorization: Bearer TOKEN" \
  -F "project_id=..." \
  -F "content=Your BRD text" \
  -F "document_type=specification"
```

## Complete Workflow

### Phase 1: Upload BRD

```bash
curl -X POST http://localhost:8000/api/v1/documents/upload-file \
  -H "Authorization: Bearer TOKEN" \
  -F "project_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "file=@BRD.pdf" \
  -F "document_type=specification" \
  -F "document_name=Main BRD v2.0"
```

Response:
```json
{
  "document_id": "brd-abc123",
  "document_name": "Main BRD v2.0",
  "source": "file_upload",
  "total_chunks": 45,
  "content_length": 15000,
  "message": "Document uploaded and indexed for AI learning"
}
```

### Phase 2: Generate Test Plan

**Option A: From JIRA User Story**
```bash
curl -X POST http://localhost:8000/api/v1/test-plans-ai/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_story_key": "PROJ-123",
    "brd_document_id": "brd-abc123",
    "use_jira_integration": true,
    "jira_url": "https://company.atlassian.net",
    "jira_username": "email@company.com",
    "jira_token": "api-token-here"
  }'
```

**Option B: From Text Input**
```bash
curl -X POST http://localhost:8000/api/v1/test-plans-ai/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_story_text": "As a user, I want to process payments with multiple payment methods",
    "brd_document_id": "brd-abc123"
  }'
```

Response:
```json
{
  "generation_id": "gen-xyz789",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_story_key": "PROJ-123",
  "test_plan": "COMPREHENSIVE TEST PLAN\n\nOverview:\n...",
  "test_cases": [
    {
      "id": "TC-001",
      "title": "Test payment with credit card",
      "steps": ["1. Navigate to checkout", "2. Select credit card"],
      "expected_result": "Payment processed successfully"
    }
  ],
  "brd_used": true,
  "similar_plans_referenced": 3,
  "metadata": {
    "jira_story": "...",
    "brd_used": true,
    "patterns_applied": "..."
  },
  "message": "Test plan generated with AI learning"
}
```

### Phase 3: Review & Provide Feedback

```bash
curl -X POST http://localhost:8000/api/v1/test-plans-ai/feedback/gen-xyz789 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_story_key": "PROJ-123",
    "original_test_plan": "COMPREHENSIVE TEST PLAN...",
    "test_cases_count": 12,
    "is_accepted": true,
    "user_rating": 4.5,
    "ai_confidence": 0.92,
    "modifications": "Added security tests for payment gateway",
    "comments": "Great coverage of happy path and edge cases",
    "brd_used": true,
    "brd_document_id": "brd-abc123",
    "brd_effectiveness": 0.95
  }'
```

Response:
```json
{
  "generation_id": "gen-xyz789",
  "status": "success",
  "message": "Feedback recorded. AI will use this to improve future test plans.",
  "learning_recorded": true,
  "effectiveness_score": 0.9
}
```

### Phase 4: AI Learns & Improves

```
Feedback Processing:
├─ Store feedback in PostgreSQL (ai_feedback table)
├─ Vectorize feedback in Qdrant
├─ Update document usage metrics
│  └─ BRD effectiveness = 0.95 (high!)
├─ Update agent performance metrics
│  └─ Acceptance rate: 85%
└─ Identify patterns
   └─ "BRD-based test plans with security focus get 4.5+ ratings"
        ↓
Next Generation Improvement:
├─ Retrieve successful patterns
├─ Prioritize similar BRD sections
├─ Include security tests
└─ Output even better test plans
```

### Phase 5: Get Learning Insights

```bash
# Get what AI learned
curl -X GET http://localhost:8000/api/v1/test-plans-ai/project/550e8400-e29b-41d4-a716-446655440000/learning-insights \
  -H "Authorization: Bearer TOKEN"
```

Response:
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "test_plan_patterns": [
    "Focus on acceptance criteria coverage",
    "Include security and performance tests",
    "Cover happy path + edge cases + error scenarios",
    "Reference system architecture for design tests"
  ],
  "effective_brd_sections": [
    "Acceptance Criteria (98% relevance) - Users always rate higher when coverage is clear",
    "System Architecture (92% relevance) - Helps design better integration tests",
    "Security Requirements (88% relevance) - Critical for test completeness",
    "Data Models (78% relevance) - Useful for data-related test cases"
  ],
  "jira_patterns": [
    "PROJ-*: Security-related stories need comprehensive security tests",
    "PROJ-API-*: API stories need endpoint, error, and performance tests",
    "PROJ-UI-*: UI stories need usability and compatibility tests",
    "High Priority: Include stress testing and edge cases"
  ],
  "recommendations": [
    "Upload database schema diagram - would improve data test coverage",
    "Upload API specification - would help generate better integration tests",
    "Tag user stories by component - would improve context matching",
    "Provide feedback on more test plans - more data = better learning"
  ]
}
```

### Phase 6: Get Recommended Documents

```bash
curl -X GET http://localhost:8000/api/v1/test-plans-ai/project/550e8400-e29b-41d4-a716-446655440000/recommended-brd \
  -H "Authorization: Bearer TOKEN"
```

Response:
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_brd_count": 3,
  "recommended_uploads": [
    {
      "type": "API specification",
      "reason": "Would improve test coverage for API endpoints",
      "priority": "high"
    },
    {
      "type": "Security architecture",
      "reason": "Would ensure comprehensive security testing",
      "priority": "high"
    },
    {
      "type": "Database schema",
      "reason": "Would improve data-related test cases",
      "priority": "medium"
    }
  ],
  "missing_sections": [
    "Performance requirements and benchmarks",
    "Error handling and recovery procedures",
    "External system integrations"
  ]
}
```

## Data Models

### DocumentKnowledge (BRD Storage)
```sql
CREATE TABLE document_knowledge (
    id UUID PRIMARY KEY,
    project_id UUID,
    document_name VARCHAR,
    document_type ENUM ('specification', 'document', ...),
    source ENUM ('file_upload', 'text_input', ...),
    content TEXT,
    total_chunks INTEGER,
    times_used_in_generation INTEGER DEFAULT 0,
    relevance_score FLOAT,
    learning_contribution FLOAT,
    qdrant_collection VARCHAR,
    qdrant_point_ids JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### DocumentChunk (BRD Sections)
```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID,
    chunk_index INTEGER,
    chunk_text TEXT,
    qdrant_point_id VARCHAR UNIQUE,
    times_used INTEGER DEFAULT 0,
    effectiveness_score FLOAT,
    last_used_at TIMESTAMP
);
```

### DocumentUsageLog (Learning Tracking)
```sql
CREATE TABLE document_usage_log (
    id UUID PRIMARY KEY,
    document_id UUID,
    chunk_id UUID,
    agent_name VARCHAR,
    query TEXT,
    similarity_score FLOAT,
    was_useful INTEGER,  -- 1 if feedback was positive
    used_at TIMESTAMP
);
```

### AIFeedback (Test Plan Feedback)
```sql
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY,
    project_id UUID,
    agent_name VARCHAR ('test_plan_generator_v2'),
    input_data JSONB,      -- user story
    output_data JSONB,     -- test plan
    user_feedback JSONB,   -- modifications, comments
    is_accepted BOOLEAN,
    confidence_score FLOAT,
    user_rating FLOAT,
    created_at TIMESTAMP
);
```

## Learning Metrics Tracked

### Per Document
```
├─ times_used_in_generation        How many test plans used this doc
├─ relevance_score                 How often it matched queries
├─ learning_contribution           How much it improved outputs (0-1)
├─ effectiveness_score             User rating when used
└─ last_used_at                    When last helped generate
```

### Per Agent (test_plan_generator_v2)
```
├─ acceptance_rate                 % of test plans users accept
├─ average_confidence              AI confidence in outputs
├─ average_user_rating             User satisfaction (1-5)
├─ trend                           improving/declining/stable
├─ improvement_patterns            What works best
└─ ineffective_patterns            What doesn't work
```

### Per Project
```
├─ total_documents_uploaded        Count of BRDs
├─ total_test_plans_generated      Count generated
├─ overall_acceptance_rate         How well AI is doing
├─ document_utilization            Which docs are used
├─ feedback_coverage               How much data to learn from
└─ quality_improvement_trend       Is it improving?
```

## Advanced Features

### 1. **Contextual Learning**
```
When generating for PROJ-123:
├─ Search for similar stories from project history
├─ Find relevant BRD sections
├─ Retrieve successful test patterns
└─ Combine all context → Better test plan
```

### 2. **Document Prioritization**
```
AI learns which documents matter most:
├─ BRD: 98% relevance
├─ Architecture Diagram: 92% relevance
├─ API Spec: 88% relevance
└─ Uses top documents first when generating
```

### 3. **Feedback Loop**
```
Feedback → Learning → Improvement Cycle:

User gives 5-star feedback on test plan
        ↓
AI analyzes what made it good
        ↓
Stores as training pattern
        ↓
Next similar story uses this pattern
        ↓
Output even better
        ↓
Cycle continues...
```

### 4. **Document Effectiveness Scoring**
```
BRD Section Effectiveness = (User Ratings when Used) / (Times Used)

Example:
├─ Security Requirements section:
│  └─ Used 10 times, avg rating 4.8/5 = 96% effective
├─ Performance Requirements section:
│  └─ Used 5 times, avg rating 3.2/5 = 64% effective
└─ AI learns: Security section is more important!
```

## Integration with JIRA

### Supported JIRA Fields

```
Story Details Retrieved:
├─ Summary (title)
├─ Description (requirements)
├─ Acceptance Criteria (test criteria)
├─ Status (planning stage)
├─ Priority (test focus)
├─ Components (test areas)
├─ Labels (test tags)
├─ Assignee (developer context)
└─ Related Epics (scope context)
```

### JIRA Query Examples

```bash
# Get all user stories for a project
GET /jira/search?jql=project=PROJ AND type=Story

# Get high-priority stories
GET /jira/search?jql=project=PROJ AND priority=High

# Get stories from an epic
GET /jira/search?jql=parent=PROJ-100

# Get unfinished stories
GET /jira/search?jql=project=PROJ AND status!="Done"
```

## Example Workflow: E-Commerce Project

### Step 1: Upload BRD Documents
```
Documents uploaded:
├─ Main BRD.pdf (business requirements)
├─ System Architecture.pdf (system design)
├─ API Specification.pdf (integration points)
├─ Database Schema.pdf (data model)
├─ Security Requirements.pdf (compliance)
└─ Performance Requirements.pdf (benchmarks)
```

### Step 2: JIRA Stories Created
```
ECOM-100: User Registration
├─ Description: Allow users to create accounts
├─ Acceptance Criteria: Email validation, password strength, etc.
└─ Type: Story

ECOM-101: Payment Processing
├─ Description: Process credit card payments
├─ Acceptance Criteria: PCI compliance, retry logic, etc.
└─ Type: Story

ECOM-102: Inventory Management
├─ Description: Track product stock
├─ Acceptance Criteria: Real-time updates, alerts, etc.
└─ Type: Story
```

### Step 3: Generate Test Plans

For ECOM-100:
```
AI Uses:
├─ User Registration story from JIRA
├─ Security Requirements BRD (password validation)
├─ System Architecture (user service design)
├─ Past successful registration test plans
└─ Learned patterns from feedback
         ↓
Generated Test Plan:
├─ Test user registration with valid email
├─ Test password strength validation
├─ Test duplicate email prevention
├─ Test email verification flow
├─ Test account lockout after failed attempts
├─ Security tests for SQL injection, XSS
└─ Performance tests for concurrent registrations
```

### Step 4: Collect Feedback

User feedback on ECOM-100 test plan:
```
Response:
├─ Accepted: Yes ✅
├─ Rating: 5 stars ⭐⭐⭐⭐⭐
├─ Comments: "Excellent coverage of security scenarios"
├─ Modifications: "Added biometric authentication tests"
└─ BRD effectiveness: 0.98 (Security Requirements section was crucial)
```

### Step 5: AI Learns

From feedback, AI learns:
```
Pattern Stored:
├─ Security Requirements section = 98% effective
├─ Test plan structure works for auth scenarios
├─ Edge cases are important
├─ Include 3-5 security tests minimum
└─ Reference system architecture for design
```

### Step 6: Generate for Similar Story

For ECOM-103: Two-Factor Authentication:
```
AI Retrieves:
├─ ECOM-100 feedback (highly rated)
├─ Security Requirements section (learned effective)
├─ System Architecture (understand design)
├─ Patterns for authentication stories
└─ User preferences (5-star quality)
         ↓
Better Test Plan Generated:
├─ All acceptance criteria covered
├─ Comprehensive security tests (learned!)
├─ Edge cases included (learned!)
├─ Well-structured (learned!)
└─ Expected rating: 4.8+ stars
```

## Success Indicators

### Quality Improvement
```
Metrics over time:
├─ Acceptance Rate: 50% → 65% → 80% → 90%+
├─ Avg User Rating: 3.2 → 3.8 → 4.4 → 4.8
├─ User Modifications: 60% → 40% → 20% → <10%
└─ AI Confidence: 0.65 → 0.78 → 0.88 → 0.95+
```

### Efficiency Gains
```
Time Savings:
├─ Manual test plan creation: 4 hours
├─ With AI (initial): 1.5 hours (62% time saving)
├─ With AI (after learning): 0.5 hours (87% time saving)
└─ With feedback: Continuously improving
```

### Business Impact
```
├─ Faster test plan generation
├─ Consistent quality
├─ Reduced manual effort
├─ Better coverage
├─ Fewer escaped bugs
└─ Higher deployment confidence
```

## Best Practices

### 1. **Upload Quality BRDs**
- Complete documents (not partial specs)
- Well-structured content
- Clear requirements
- Include diagrams when possible

### 2. **Provide Regular Feedback**
- Rate every generated test plan
- Add comments on quality
- Suggest improvements
- Flag missing areas

### 3. **Use JIRA Properly**
- Clear user stories
- Detailed acceptance criteria
- Appropriate prioritization
- Consistent labeling

### 4. **Monitor Learning**
- Check learning insights monthly
- Verify improvement trends
- Adjust recommendations
- Update documents as needed

## Troubleshooting

### Q: Test plans not using BRD
**A**: Ensure BRD is uploaded and document_type='specification'. Check if query matches BRD content.

### Q: JIRA integration not working
**A**: Verify API token is valid. Check JIRA_URL format. Ensure story key exists.

### Q: Low effectiveness scores
**A**: Upload more relevant documents. Provide more feedback. Ensure documents have clear content.

### Q: Test plans getting worse
**A**: This might indicate wrong learning data. Check feedback quality. Verify documents are correct.

## Next Steps

1. **Upload BRD**: Start with main business requirements document
2. **Connect JIRA**: Configure JIRA integration
3. **Generate**: Create first test plan
4. **Provide Feedback**: Rate and comment on quality
5. **Monitor**: Check learning insights and improvements
6. **Improve**: Act on recommendations

---

Your Cognitest AI now truly learns from BRDs, JIRA stories, and feedback! 🚀

"Test. Self Evolve. Self Heal." with intelligent context at every step ✨
