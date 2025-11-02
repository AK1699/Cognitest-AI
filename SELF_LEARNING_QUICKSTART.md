# Self-Learning AI Quick Start Guide

Get the self-evolving AI system up and running in 5 minutes.

## What You Get

✅ Vector database integration (Qdrant)
✅ Knowledge storage and retrieval
✅ Automatic feedback learning
✅ Performance analytics
✅ Self-improvement pipelines
✅ API endpoints for feedback

## 1. Setup Qdrant (2 min)

### Option A: Docker (Recommended)
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Option B: Local Installation
```bash
# macOS
brew install qdrant

# Linux
# Download from https://github.com/qdrant/qdrant/releases
```

### Option C: Cloud
Sign up at https://cloud.qdrant.io and get your API key.

## 2. Update Environment (1 min)

Add to `.env`:
```env
# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Leave empty for local, required for cloud
```

## 3. Install Dependencies (1 min)

```bash
cd backend
pip install qdrant-client==2.4.0
```

## 4. Database Migration (1 min)

```bash
# Create migration
alembic revision --autogenerate -m "Add AI feedback tables"

# Apply migration
alembic upgrade head
```

## 5. Register API Endpoints (1 min)

Edit `backend/app/main.py`:
```python
from app.api.v1.endpoints import ai_feedback, ai_analytics

app.include_router(ai_feedback.router)
app.include_router(ai_analytics.router)
```

## Test It Works

### 1. Check API Documentation
```bash
# Start server
uvicorn app.main:app --reload

# Open http://localhost:8000/docs
# You should see new endpoints under "ai-feedback" and "ai-analytics"
```

### 2. Submit Feedback
```bash
curl -X POST http://localhost:8000/api/v1/ai/feedback/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "your-project-id",
    "agent_name": "test_plan_generator",
    "feedback_type": "accepted",
    "input_data": {"requirement": "Test login"},
    "output_data": {"plan": "Login test plan"},
    "user_feedback": {"comment": "Good"},
    "is_accepted": true,
    "confidence_score": 0.92,
    "user_rating": 5
  }'
```

### 3. View Analytics
```bash
curl -X GET http://localhost:8000/api/v1/ai/analytics/self-evolution-report/YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## How It Works

### Basic Flow

1. **Agent Executes** → Generates output
2. **User Provides Feedback** → Accept/reject/modify
3. **System Learns** → Stores in Qdrant + PostgreSQL
4. **Context Retrieved** → Future tasks use learned patterns
5. **Performance Tracked** → Analytics dashboard shows progress

### Example Agent Usage

```python
from app.agents.base_agent import BaseAgent

class TestPlanGenerator(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="test_plan_generator",
            system_prompt="You generate test plans...",
        )

    async def execute(self, requirements: str, project_id: str, **kwargs):
        # 1. Get context from past successful cases
        context = await self.retrieve_knowledge(
            collection_name=f"project_{project_id}_test_plans",
            query=requirements,
            limit=3  # Get top 3 similar cases
        )

        # 2. Use context to enhance response
        enhanced_prompt = f"""
        {self.system_prompt}

        Similar successful test plans:
        {self._format_context(context)}

        Generate test plan for: {requirements}
        """

        # 3. Generate output
        response = await self.generate_response(enhanced_prompt)

        # 4. Store for future learning
        await self.store_knowledge(
            collection_name=f"project_{project_id}_test_plans",
            text=response,
            metadata={"requirements": requirements}
        )

        return response
```

### Example Feedback Collection

```python
# In your API endpoint when user accepts/rejects output

# Get the agent
agent = TestPlanGenerator()

# Collect feedback
await agent.learn_from_feedback(
    input_data={
        "requirement": user_request,
        "project_id": project_id,
    },
    output_data={
        "test_plan": ai_generated_plan,
    },
    feedback={
        "is_accepted": user_clicked_accept,
        "confidence_score": 0.92,  # AI's confidence
        "user_rating": user_stars,
        "modifications": user_changes,
        "project_id": project_id,
    }
)
```

## Available Endpoints

### Feedback Collection
- **POST** `/api/v1/ai/feedback/submit` - Submit feedback
- **GET** `/api/v1/ai/feedback/project/{project_id}` - Get project feedback
- **GET** `/api/v1/ai/feedback/performance/{project_id}` - Get agent metrics
- **POST** `/api/v1/ai/feedback/performance/update/{project_id}` - Update metrics

### Analytics
- **GET** `/api/v1/ai/analytics/self-evolution-report/{project_id}` - Evolution report
- **GET** `/api/v1/ai/analytics/agent-history/{project_id}/{agent_name}` - Agent history
- **GET** `/api/v1/ai/analytics/feedback-patterns/{project_id}` - Pattern analysis

## Understanding the Analytics

### Self-Evolution Report
Shows:
- **Overall Acceptance Rate** - % of outputs users accept
- **Average Confidence** - AI's confidence trend
- **Trend** - improving/declining/stable
- **Insights** - what's working well
- **Recommendations** - areas to improve

### Agent Performance Metrics
- **Acceptance Rate** - How often users accept
- **Average Confidence** - AI confidence level
- **Average Rating** - User satisfaction (1-5)
- **Trend** - Direction of improvement

### Feedback Patterns
- **By Type** - accepted vs modified vs rejected
- **By Agent** - which agents are learning best
- **Confidence Distribution** - AI confidence patterns
- **Rating Distribution** - user satisfaction patterns

## Database Schema

### AIFeedback Table
```sql
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY,
    project_id UUID,
    agent_name VARCHAR,
    feedback_type VARCHAR,  -- accepted, rejected, modified, rating
    input_data JSONB,       -- what was asked
    output_data JSONB,      -- what was generated
    user_feedback JSONB,    -- user's response
    is_accepted BOOLEAN,
    confidence_score FLOAT,
    user_rating FLOAT,
    qdrant_point_id VARCHAR, -- reference to vector DB
    created_at TIMESTAMP
);
```

### AgentPerformance Table
```sql
CREATE TABLE agent_performance (
    id UUID PRIMARY KEY,
    project_id UUID,
    agent_name VARCHAR,
    acceptance_rate FLOAT,
    average_confidence FLOAT,
    average_user_rating FLOAT,
    trend VARCHAR,  -- improving, declining, stable
    updated_at TIMESTAMP
);
```

## Qdrant Collections

Automatically created per agent/project:
- `project_{id}_feedback_{agent}` - Feedback vectors
- `project_{id}_test_plans` - Generated test plans
- `project_{id}_all_feedback` - All feedback combined

## Common Tasks

### Get Agent's Learning Progress
```bash
curl -X GET http://localhost:8000/api/v1/ai/analytics/agent-history/PROJECT_ID/test_plan_generator
```

### Check Self-Evolution Status
```bash
curl -X GET http://localhost:8000/api/v1/ai/analytics/self-evolution-report/PROJECT_ID
```

### View Feedback Patterns
```bash
curl -X GET http://localhost:8000/api/v1/ai/analytics/feedback-patterns/PROJECT_ID
```

### Submit Feedback Programmatically
```python
import httpx

async def submit_feedback(project_id, agent_output, user_accepted):
    async with httpx.AsyncClient() as client:
        await client.post(
            "http://localhost:8000/api/v1/ai/feedback/submit",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "project_id": project_id,
                "agent_name": "test_plan_generator",
                "feedback_type": "accepted" if user_accepted else "rejected",
                "input_data": {...},
                "output_data": agent_output,
                "user_feedback": {...},
                "is_accepted": user_accepted,
                "confidence_score": 0.92,
                "user_rating": 5 if user_accepted else 2,
            }
        )
```

## Monitoring

### Check Qdrant Health
```bash
curl http://localhost:6333/health
```

### Check Collection Stats
```python
from app.services.qdrant_service import get_qdrant_service

service = await get_qdrant_service()
stats = await service.get_collection_stats("project_123_feedback_test_agent")
print(f"Vectors stored: {stats['points_count']}")
```

### Monitor Performance
```bash
# Get metrics and trends
curl -X GET http://localhost:8000/api/v1/ai/feedback/performance/PROJECT_ID
```

## Next Steps

1. **Integrate with Test Plan Generator**
   - Add feedback collection to UI
   - Call `learn_from_feedback()` when user accepts

2. **Add to Test Case Generator**
   - Retrieve context: `retrieve_knowledge()`
   - Store outputs: `store_knowledge()`

3. **Enable All Agents**
   - Update remaining agents similarly
   - Monitor performance dashboard

4. **Setup Analytics Dashboard**
   - Display self-evolution metrics
   - Show agent improvement trends
   - Track learning velocity

5. **Configure Background Tasks**
   - Enable Celery for scheduled jobs
   - Process feedback hourly
   - Update metrics every 4 hours

## Troubleshooting

### Qdrant Connection Error
```
Error: Failed to connect to Qdrant
```
**Solution:**
```bash
# Check if Qdrant is running
curl http://localhost:6333/health

# If not, start it
docker run -p 6333:6333 qdrant/qdrant
```

### Permission Error on Feedback Submit
```
Error: 401 Unauthorized
```
**Solution:** Include valid JWT token in Authorization header

### Slow Vector Search
**Solution:** Increase score_threshold or add more specific filters

### Out of Memory
**Solution:** Run cleanup task or reduce vector dimension

## Support

- 📖 Full docs: See `SELF_LEARNING_IMPLEMENTATION.md`
- 🐛 Issues: Check Qdrant logs
- 📊 Analytics: Visit `/api/v1/ai/analytics/*` endpoints
- 🧪 Tests: Run `pytest backend/tests/test_ai_self_learning.py`

---

**Ready to Enable Self-Evolution?** ✨

You now have a complete self-learning system that:
- Stores knowledge from every execution
- Learns from user feedback
- Improves over time
- Tracks progress automatically
- Powers intelligent agents

Start collecting feedback and watch your AI improve! 🚀
