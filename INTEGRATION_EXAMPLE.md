# Self-Learning Integration Example

This document shows how to integrate self-learning into your existing agents.

## Example: Test Plan Generator Integration

### Before (Current Implementation)

```python
# backend/app/agents/test_plan_generator.py

class TestPlanGenerator(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="test_plan_generator",
            system_prompt="You are a test plan generation expert...",
            model_name="gpt-4-turbo-preview",
        )

    async def execute(self, requirements: str, **kwargs):
        # Just generate - no learning
        response = await self.generate_response(
            user_input=requirements,
            context=kwargs.get("context")
        )
        return {"test_plan": response}
```

### After (With Self-Learning)

```python
# backend/app/agents/test_plan_generator.py

class TestPlanGenerator(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="test_plan_generator",
            system_prompt="You are a test plan generation expert...",
            model_name="gpt-4-turbo-preview",
        )

    async def execute(self, requirements: str, **kwargs):
        project_id = kwargs.get("project_id")

        # NEW: Retrieve context from similar projects
        context = await self.retrieve_knowledge(
            collection_name=f"project_{project_id}_test_plans",
            query=requirements,
            limit=3  # Get top 3 similar cases
        )

        # NEW: Build enhanced prompt with learned context
        enhanced_prompt = self._build_prompt_with_context(requirements, context)

        # Generate response
        response = await self.generate_response(
            user_input=enhanced_prompt,
            context=kwargs.get("context")
        )

        # NEW: Store this knowledge for future reference
        await self.store_knowledge(
            collection_name=f"project_{project_id}_test_plans",
            text=response,
            metadata={
                "requirements": requirements,
                "generated_at": datetime.utcnow().isoformat(),
                "agent_version": "v1.0",
            }
        )

        return {"test_plan": response}

    def _build_prompt_with_context(self, requirements: str, context: Dict[str, Any]) -> str:
        """Build prompt enhanced with learned context"""
        prompt = self.system_prompt + "\n\n"

        if context.get("similar_cases"):
            prompt += "# Learn from similar successful test plans:\n"
            for case in context["similar_cases"][:2]:
                if case.get("text"):
                    prompt += f"\nExample: {case['text'][:200]}...\n"
            prompt += "\n"

        prompt += f"Generate test plan for: {requirements}"
        return prompt
```

## Example: API Endpoint with Feedback Collection

### Before (Current Implementation)

```python
# backend/app/api/v1/endpoints/test_plan.py

@router.post("/generate")
async def generate_test_plan(
    request: TestPlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent = TestPlanGenerator()
    result = await agent.execute(
        requirements=request.requirements,
        project_id=request.project_id,
    )
    return result
```

### After (With Feedback Collection)

```python
# backend/app/api/v1/endpoints/test_plan.py

from app.schemas.ai_feedback import AIFeedbackCreate

@router.post("/generate")
async def generate_test_plan(
    request: TestPlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent = TestPlanGenerator()
    result = await agent.execute(
        requirements=request.requirements,
        project_id=request.project_id,
    )

    # NEW: Store the output with execution ID for feedback tracking
    execution_id = str(uuid.uuid4())
    result["execution_id"] = execution_id  # Return for feedback reference

    return result


# NEW: Endpoint to submit feedback on generated test plan
@router.post("/feedback/{execution_id}")
async def submit_test_plan_feedback(
    execution_id: str,
    feedback: AIFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get original output from cache/DB (would need implementation)
    # For now, trust it's in the feedback object

    # Initialize agent for learning
    agent = TestPlanGenerator()

    # Learn from feedback
    await agent.learn_from_feedback(
        input_data={
            "requirements": feedback.input_data.get("requirements"),
            "project_id": feedback.project_id,
        },
        output_data=feedback.output_data,
        feedback={
            "is_accepted": feedback.is_accepted,
            "confidence_score": feedback.confidence_score,
            "user_rating": feedback.user_rating,
            "modifications": feedback.modifications,
            "project_id": feedback.project_id,
        }
    )

    # Also save to database
    db_feedback = AIFeedback(
        project_id=feedback.project_id,
        agent_name="test_plan_generator",
        feedback_type=feedback.feedback_type,
        input_data=feedback.input_data,
        output_data=feedback.output_data,
        user_feedback={"modifications": feedback.modifications},
        is_accepted=feedback.is_accepted,
        confidence_score=feedback.confidence_score,
        user_rating=feedback.user_rating,
        user_id=current_user.id,
    )
    db.add(db_feedback)
    await db.commit()

    return {"message": "Feedback submitted", "feedback_id": str(db_feedback.id)}
```

## Example: Frontend Integration

### React Component Example

```jsx
// frontend/components/TestPlanGenerator.tsx

import { useState } from 'react';

export function TestPlanGenerator() {
  const [requirements, setRequirements] = useState('');
  const [testPlan, setTestPlan] = useState('');
  const [executionId, setExecutionId] = useState('');
  const [confidence, setConfidence] = useState(0.8);

  const generateTestPlan = async () => {
    const response = await fetch('/api/v1/test-plans/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirements,
        project_id: projectId
      }),
    });

    const result = await response.json();
    setTestPlan(result.test_plan);
    setExecutionId(result.execution_id);
  };

  // NEW: Submit feedback when user accepts/rejects
  const submitFeedback = async (accepted: boolean, rating: number) => {
    const feedbackPayload = {
      project_id: projectId,
      agent_name: 'test_plan_generator',
      feedback_type: accepted ? 'accepted' : 'rejected',
      input_data: { requirements },
      output_data: { test_plan: testPlan },
      user_feedback: {
        comment: userComments,
        modifications: userModifications
      },
      is_accepted: accepted,
      confidence_score: confidence,
      user_rating: rating,
    };

    await fetch('/api/v1/ai/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackPayload),
    });

    // Show success message
    showNotification('Thank you! Your feedback helps improve AI');
  };

  return (
    <div className="test-plan-generator">
      <textarea
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
        placeholder="Describe test requirements..."
      />

      <button onClick={generateTestPlan}>Generate Test Plan</button>

      {testPlan && (
        <>
          <div className="output">
            {testPlan}
          </div>

          {/* NEW: Feedback buttons */}
          <div className="feedback-section">
            <p>Was this helpful?</p>

            <button
              onClick={() => submitFeedback(true, 5)}
              className="btn-accept"
            >
              👍 Yes, Accept
            </button>

            <button
              onClick={() => submitFeedback(false, 2)}
              className="btn-reject"
            >
              👎 No, Reject
            </button>

            {/* Star rating */}
            <div className="rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => submitFeedback(star >= 4, star)}
                  className={star <= rating ? 'active' : ''}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Optional: Allow modifications */}
            <textarea
              placeholder="Suggest improvements..."
              onChange={(e) => setUserModifications(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

## Example: Monitoring Dashboard

### Dashboard Component

```jsx
// frontend/components/AIAnalytics.tsx

import { useEffect, useState } from 'react';

export function AIAnalytics({ projectId }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Fetch self-evolution report
    fetch(`/api/v1/ai/analytics/self-evolution-report/${projectId}`)
      .then(r => r.json())
      .then(data => setReport(data));
  }, [projectId]);

  if (!report) return <div>Loading...</div>;

  return (
    <div className="ai-analytics">
      <h2>AI Self-Evolution Report</h2>

      {/* Overall metrics */}
      <section className="summary">
        <Metric
          label="Overall Acceptance Rate"
          value={`${report.summary.overall_acceptance_rate.toFixed(1)}%`}
          trend={report.summary.trend}
        />
        <Metric
          label="Average Confidence"
          value={report.summary.overall_average_confidence.toFixed(3)}
        />
        <Metric
          label="Average User Rating"
          value={`${report.summary.overall_average_rating?.toFixed(1) || 'N/A'}/5`}
        />
      </section>

      {/* Agent performance */}
      <section className="agents">
        <h3>Agent Performance</h3>
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Acceptance</th>
              <th>Confidence</th>
              <th>Trend</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.agents.map(agent => (
              <tr key={agent.name} className={`trend-${agent.trend}`}>
                <td>{agent.name}</td>
                <td>{agent.acceptance_rate.toFixed(1)}%</td>
                <td>{agent.average_confidence.toFixed(3)}</td>
                <td className={`trend-${agent.trend}`}>
                  {agent.trend === 'improving' ? '📈' :
                   agent.trend === 'declining' ? '📉' : '➡️'}
                </td>
                <td>
                  {agent.acceptance_rate >= 80 ? '✅ Good' :
                   agent.acceptance_rate >= 50 ? '⚠️  Okay' : '❌ Poor'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Insights & recommendations */}
      <section className="insights">
        <h3>Insights</h3>
        <ul>
          {report.insights.map((insight, i) => (
            <li key={i}>{insight}</li>
          ))}
        </ul>
      </section>

      <section className="recommendations">
        <h3>Recommendations</h3>
        <ul>
          {report.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value, trend }) {
  return (
    <div className={`metric trend-${trend}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {trend && <div className="trend">Trend: {trend}</div>}
    </div>
  );
}
```

## Example: Complete Integration Workflow

```python
# Complete workflow example

async def complete_workflow_example():
    project_id = "550e8400-e29b-41d4-a716-446655440000"

    # 1. Generate test plan (with learned context)
    agent = TestPlanGenerator()
    result = await agent.execute(
        requirements="Test payment processing flow",
        project_id=project_id,
    )
    test_plan = result["test_plan"]

    # 2. User reviews and provides feedback
    feedback = {
        "project_id": project_id,
        "agent_name": "test_plan_generator",
        "feedback_type": "accepted",
        "input_data": {"requirements": "Test payment processing"},
        "output_data": {"test_plan": test_plan},
        "user_feedback": {"comment": "Excellent coverage"},
        "is_accepted": True,
        "confidence_score": 0.95,
        "user_rating": 5,
    }

    # 3. Agent learns from feedback
    await agent.learn_from_feedback(
        input_data=feedback["input_data"],
        output_data=feedback["output_data"],
        feedback={k: v for k, v in feedback.items() if k not in ["input_data", "output_data"]}
    )

    # 4. Later, check evolution status
    # GET /api/v1/ai/analytics/self-evolution-report/{project_id}
    # Shows: acceptance rate increased 5% this week

    # 5. Agent uses learned context for next task
    next_result = await agent.execute(
        requirements="Test payment refund scenarios",
        project_id=project_id,  # Uses learned patterns!
    )
    # Output is better because it learned from previous feedback
```

## Step-by-Step Integration Checklist

- [ ] Review this example
- [ ] Update agent's `execute()` method
  - [ ] Add `retrieve_knowledge()` call
  - [ ] Build enhanced prompt
  - [ ] Add `store_knowledge()` call
- [ ] Create feedback endpoint
  - [ ] Accept feedback submission
  - [ ] Call `agent.learn_from_feedback()`
  - [ ] Store in database
- [ ] Update UI
  - [ ] Add feedback buttons (Accept/Reject)
  - [ ] Add star rating
  - [ ] Optional: Allow modifications
- [ ] Test end-to-end
  - [ ] Generate output
  - [ ] Submit feedback
  - [ ] Generate again (should use learned context)
- [ ] Add analytics dashboard
  - [ ] Display self-evolution report
  - [ ] Show agent performance
  - [ ] Track improvements

## Testing the Integration

```bash
# Start server
uvicorn app.main:app --reload

# 1. Generate test plan
curl -X POST http://localhost:8000/api/v1/test-plans/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": "Test login flow",
    "project_id": "550e8400-e29b-41d4-a716-446655440000"
  }'

# 2. Submit feedback
curl -X POST http://localhost:8000/api/v1/ai/feedback/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_name": "test_plan_generator",
    "feedback_type": "accepted",
    "input_data": {"requirements": "Test login flow"},
    "output_data": {"test_plan": "..."},
    "user_feedback": {},
    "is_accepted": true,
    "confidence_score": 0.95,
    "user_rating": 5
  }'

# 3. Check analytics
curl -X GET http://localhost:8000/api/v1/ai/analytics/self-evolution-report/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**That's it!** Your agents now self-evolve. Start with one agent and expand to others.

For more details, see `SELF_LEARNING_IMPLEMENTATION.md`.
