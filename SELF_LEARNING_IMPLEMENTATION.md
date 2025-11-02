# AI Self-Learning Implementation Guide

This document describes the complete self-evolving AI technology implementation for Cognitest.

## Overview

The self-learning system enables AI agents to:
1. **Store Knowledge**: Save all generated outputs and user feedback as vectors
2. **Learn from Feedback**: Improve future responses based on user acceptance/rejection
3. **Retrieve Context**: Access similar past cases to inform current decisions
4. **Track Performance**: Monitor metrics and trends
5. **Self-Improve**: Automatically adjust based on feedback patterns

## Architecture Components

### 1. Qdrant Vector Database Service (`app/services/qdrant_service.py`)

**Purpose**: Manages vector storage and semantic search

**Key Methods**:
- `ensure_collection_exists()`: Create or verify Qdrant collections
- `store_vector()`: Save embeddings with metadata
- `search_vectors()`: Semantic search for similar vectors
- `delete_point()`: Remove specific vectors
- `get_collection_stats()`: Collection analytics

**Configuration**:
```
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=<optional>
```

### 2. Base Agent Enhancement (`app/agents/base_agent.py`)

**New Methods Implemented**:

#### `store_knowledge()`
```python
async def store_knowledge(
    collection_name: str,
    text: str,
    metadata: Dict[str, Any],
    point_id: Optional[str] = None
)
```
- Creates embedding from text
- Stores in Qdrant with metadata
- Returns point ID for tracking

#### `retrieve_knowledge()`
```python
async def retrieve_knowledge(
    collection_name: str,
    query: str,
    limit: int = 5,
    score_threshold: float = 0.7
) -> List[Dict[str, Any]]
```
- Searches for semantically similar vectors
- Returns top matches with similarity scores
- Used for context-aware generation

#### `learn_from_feedback()`
```python
async def learn_from_feedback(
    input_data: Dict[str, Any],
    output_data: Dict[str, Any],
    feedback: Dict[str, Any]
)
```
- Stores feedback as training data
- Creates feedback record in PostgreSQL
- Stores vectorized feedback in Qdrant
- Triggers async learning process

### 3. Database Models (`app/models/ai_feedback.py`)

#### AIFeedback Model
Stores all user feedback on AI outputs:
- `project_id`: Project context
- `agent_name`: Which agent generated the output
- `feedback_type`: ACCEPTED, REJECTED, MODIFIED, RATING
- `input_data`: What was asked
- `output_data`: What was generated
- `user_feedback`: User's response
- `is_accepted`: Boolean acceptance flag
- `confidence_score`: AI confidence (0-1)
- `user_rating`: User rating (1-5 stars)
- `qdrant_point_id`: Reference to vector DB entry

#### AgentPerformance Model
Tracks performance metrics:
- `acceptance_rate`: % of accepted outputs
- `average_confidence`: AI confidence trend
- `average_user_rating`: User satisfaction
- `trend`: "improving" | "declining" | "stable"
- `last_improvement_date`: When agent improved

### 4. Knowledge Service (`app/services/knowledge_service.py`)

**Methods**:
- `get_agent_context()`: Retrieve historical context for agent
- `get_project_knowledge()`: Search across all agents
- `get_accepted_patterns()`: Extract successful patterns
- `get_improvement_suggestions()`: AI-generated recommendations
- `build_agent_prompt()`: Enhance prompts with learned context

### 5. Feedback API Endpoints (`app/api/v1/endpoints/ai_feedback.py`)

#### POST `/api/v1/ai/feedback/submit`
Submit feedback on AI output
```json
{
  "project_id": "uuid",
  "agent_name": "test_plan_generator",
  "feedback_type": "accepted",
  "input_data": {...},
  "output_data": {...},
  "user_feedback": {...},
  "is_accepted": true,
  "confidence_score": 0.92,
  "user_rating": 5
}
```

#### GET `/api/v1/ai/feedback/project/{project_id}`
Get all feedback for a project

#### GET `/api/v1/ai/feedback/performance/{project_id}`
Get agent performance metrics

#### POST `/api/v1/ai/feedback/performance/update/{project_id}`
Recalculate performance metrics

### 6. Analytics API Endpoints (`app/api/v1/endpoints/ai_analytics.py`)

#### GET `/api/v1/ai/analytics/self-evolution-report/{project_id}`
Comprehensive self-evolution report:
- Overall trends
- Agent-specific metrics
- Insights and recommendations
- Trend analysis

#### GET `/api/v1/ai/analytics/agent-history/{project_id}/{agent_name}`
Detailed learning history for agent:
- Feedback items
- Acceptance trend
- Performance metrics
- Learning curve

#### GET `/api/v1/ai/analytics/feedback-patterns/{project_id}`
Pattern analysis:
- Feedback type distribution
- Agent performance by type
- Confidence distribution
- Rating distribution

### 7. Background Tasks (`app/tasks/ai_learning_tasks.py`)

**Scheduled Tasks** (Celery):

1. **process_pending_feedback** (Every hour)
   - Process unprocessed feedback
   - Update Qdrant collections

2. **update_agent_performance_metrics** (Every 4 hours)
   - Recalculate acceptance rates
   - Update performance trends
   - Detect improvements/declines

3. **detect_learning_opportunities** (Daily)
   - Find agents needing improvement
   - Analyze failure patterns
   - Generate recommendations

4. **cleanup_old_knowledge** (Weekly)
   - Remove outdated vectors
   - Archive old feedback
   - Optimize storage

5. **generate_self_evolution_report** (Daily)
   - Create comprehensive report
   - Identify trends
   - Email to stakeholders

## Data Flow

### Feedback Collection Flow
```
1. Agent generates output
   ↓
2. User provides feedback
   ↓
3. POST /api/v1/ai/feedback/submit
   ↓
4. Feedback stored in PostgreSQL (AIFeedback)
   ↓
5. Async: Store in Qdrant with embedding
   ↓
6. Background task: Process and analyze
   ↓
7. Update performance metrics
```

### Learning & Retrieval Flow
```
1. New agent execution
   ↓
2. Query similar past cases
   ↓
3. retrieve_knowledge() → Qdrant search
   ↓
4. Get top N similar cases
   ↓
5. Extract patterns from accepted cases
   ↓
6. Enhance agent prompt with context
   ↓
7. Generate improved output
```

## Integration Steps

### 1. Install Dependencies
```bash
pip install qdrant-client==2.4.0
```

### 2. Update Main Router
Add endpoints to `app/main.py`:
```python
from app.api.v1.endpoints import ai_feedback, ai_analytics

app.include_router(ai_feedback.router)
app.include_router(ai_analytics.router)
```

### 3. Create Database Migration
```bash
alembic revision --autogenerate -m "Add AI feedback tables"
alembic upgrade head
```

### 4. Configure Qdrant
```bash
# Local development
docker run -p 6333:6333 qdrant/qdrant

# Environment variables
QDRANT_URL=http://localhost:6333
```

### 5. Update Agent Implementations
Agents now automatically:
- Store outputs in Qdrant
- Retrieve context for new tasks
- Learn from feedback

Example:
```python
class TestPlanGenerator(BaseAgent):
    async def execute(self, requirements: str, **kwargs):
        # Retrieve context from similar projects
        project_id = kwargs.get("project_id")
        context = await self.retrieve_knowledge(
            collection_name=f"project_{project_id}_feedback_test_plan",
            query=requirements,
            limit=3
        )

        # Generate enhanced prompt with context
        prompt = self._build_enhanced_prompt(requirements, context)

        # Generate test plan
        response = await self.generate_response(prompt)

        # Store knowledge for future learning
        await self.store_knowledge(
            collection_name=f"project_{project_id}_test_plans",
            text=response,
            metadata={
                "requirements": requirements,
                "generated_at": datetime.utcnow().isoformat()
            }
        )

        return response
```

### 6. Implement Feedback Collection in UI
When users accept/reject AI suggestions:
```javascript
// Collect feedback
const feedback = {
  project_id: projectId,
  agent_name: "test_plan_generator",
  feedback_type: "accepted",
  input_data: originalRequest,
  output_data: aiOutput,
  user_feedback: userModifications,
  is_accepted: true,
  confidence_score: 0.92,
  user_rating: 5
};

// Submit to backend
await fetch("/api/v1/ai/feedback/submit", {
  method: "POST",
  body: JSON.stringify(feedback)
});
```

## Metrics & KPIs

### Agent Performance Metrics
- **Acceptance Rate**: % of outputs accepted by users
- **Average Confidence**: AI's confidence in its outputs
- **User Rating**: Average user satisfaction (1-5)
- **Trend**: Performance trajectory

### Project Metrics
- **Overall Accuracy**: Combined acceptance rate
- **Learning Velocity**: Rate of improvement
- **Knowledge Growth**: Vector count and diversity
- **Feedback Ratio**: Amount of learning data

## Self-Improvement Mechanisms

### 1. Contextual Learning
Agents access similar past cases to:
- Match project-specific style
- Follow established patterns
- Avoid repeated mistakes

### 2. Confidence-Based Adjustment
- High confidence + Accepted: Reinforce pattern
- High confidence + Rejected: Identify gaps
- Low confidence + Accepted: Build confidence
- Low confidence + Rejected: Retrain needed

### 3. Feedback Loop Integration
```
Output → User Feedback → Store in Vector DB → Context for Next Task
   ↑___________________________________________________________________|
```

### 4. Performance-Based Optimization
- Monitor acceptance rates
- Auto-adjust temperature/model if declining
- Archive low-confidence outputs
- Promote high-confidence patterns

## Analytics Dashboard

The `ai_analytics` endpoints provide data for:
1. **Self-Evolution Report**: Overall AI improvement status
2. **Agent Learning History**: Individual agent progress
3. **Feedback Patterns**: Understanding AI behavior
4. **Trend Analysis**: Improvement/decline detection
5. **Recommendations**: Actionable improvement steps

## Example Usage

### Submit Feedback
```python
feedback_data = {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_name": "test_plan_generator",
    "feedback_type": "accepted",
    "input_data": {"requirement": "Test login flow"},
    "output_data": {"plan": "Comprehensive test plan..."},
    "user_feedback": {"modifications": "Added security tests"},
    "is_accepted": True,
    "confidence_score": 0.92,
    "user_rating": 5
}

response = await client.post(
    "/api/v1/ai/feedback/submit",
    json=feedback_data
)
```

### Get Performance Metrics
```python
response = await client.get(
    "/api/v1/ai/feedback/performance/550e8400-e29b-41d4-a716-446655440000"
)
# Returns acceptance rates, trends, recommendations
```

### Get Evolution Report
```python
response = await client.get(
    "/api/v1/ai/analytics/self-evolution-report/550e8400-e29b-41d4-a716-446655440000"
)
# Returns comprehensive evolution metrics and insights
```

## Configuration

### Environment Variables
```env
# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key-optional

# Database (existing)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/cognitest

# OpenAI (existing)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Celery Configuration (Optional)
```python
# For scheduled tasks
CELERY_BROKER_URL=db+postgresql://...
CELERY_BEAT_SCHEDULE = {
    'process-feedback': {
        'task': 'ai.process_pending_feedback',
        'schedule': crontab(minute=0),  # Every hour
    },
    'update-metrics': {
        'task': 'ai.update_performance_metrics',
        'schedule': crontab(minute=0, hour='*/4'),  # Every 4 hours
    },
}
```

## Testing

Run the test suite:
```bash
pytest backend/tests/test_ai_self_learning.py -v
```

Tests cover:
- Knowledge storage and retrieval
- Feedback learning
- Performance metrics
- End-to-end workflows
- Collection isolation

## Monitoring

Monitor self-learning health:
1. Check Qdrant collection stats
2. Track feedback submission rate
3. Monitor performance metric updates
4. Review improvement suggestions
5. Analyze feedback patterns

## Future Enhancements

1. **Active Learning**: Prioritize feedback on uncertain outputs
2. **Multi-Agent Learning**: Share knowledge across agents
3. **Automatic Retraining**: Retrain models based on feedback
4. **Prompt Optimization**: Auto-adjust system prompts
5. **Cost Analysis**: Track improvement vs. cost
6. **A/B Testing**: Compare agent versions
7. **Knowledge Extraction**: Auto-generate training data
8. **Ensemble Learning**: Combine agent outputs intelligently

## Troubleshooting

### Qdrant Connection Issues
```python
# Check connection
try:
    from app.services.qdrant_service import get_qdrant_service
    service = await get_qdrant_service()
except Exception as e:
    logger.error(f"Qdrant connection failed: {e}")
```

### Slow Vector Search
- Check collection stats: `get_collection_stats()`
- Consider reducing vector dimension
- Increase score_threshold
- Archive old vectors

### Memory Issues
- Enable vector compression
- Archive old feedback
- Run cleanup_old_knowledge task
- Monitor Qdrant memory usage

## Support & Documentation

- API Docs: Available at `/docs` (Swagger UI)
- Models: `app/models/ai_feedback.py`
- Services: `app/services/{qdrant,knowledge}_service.py`
- Tests: `backend/tests/test_ai_self_learning.py`

---

**Status**: Implementation Complete
**Last Updated**: 2025-01-02
**Version**: 1.0
