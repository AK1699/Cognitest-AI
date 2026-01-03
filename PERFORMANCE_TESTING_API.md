# Performance Testing API Reference

Base URL: `/api/v1/performance`

## Authentication

All endpoints require authentication via JWT token:
```
Authorization: Bearer <access_token>
```

---

## Dashboard

### Get Dashboard Stats
```
GET /dashboard/{project_id}/stats
```

**Response:**
```json
{
  "total_tests": 42,
  "avg_performance_score": 85.5,
  "pass_rate": 92.3,
  "active_alerts": 2,
  "tests_last_7_days": 12
}
```

---

## Lighthouse Audits

### Run Lighthouse Audit
```
POST /lighthouse?project_id={project_id}
```

**Request Body:**
```json
{
  "target_url": "https://example.com",
  "device_type": "mobile" | "desktop"
}
```

**Response:**
```json
{
  "id": "uuid",
  "human_id": "LH-001",
  "status": "completed",
  "metrics": {
    "performance_score": 0.85,
    "accessibility_score": 0.92,
    "best_practices_score": 0.88,
    "seo_score": 0.95,
    "largest_contentful_paint": 2100,
    "first_input_delay": 45,
    "cumulative_layout_shift": 0.05
  },
  "opportunities": [...],
  "diagnostics": [...]
}
```

---

## Load Testing

### Run Load Test
```
POST /load-test?project_id={project_id}
```

**Request Body:**
```json
{
  "target_url": "https://api.example.com/endpoint",
  "virtual_users": 50,
  "duration_seconds": 60,
  "ramp_up_seconds": 10,
  "http_method": "GET"
}
```

**Response:**
```json
{
  "id": "uuid",
  "human_id": "LT-001",
  "status": "completed",
  "metrics": {
    "total_requests": 3500,
    "requests_per_second": 58.3,
    "avg_latency_ms": 85,
    "p50_latency_ms": 72,
    "p95_latency_ms": 145,
    "p99_latency_ms": 280,
    "success_rate": 99.8
  }
}
```

### Run Stress Test
```
POST /stress-test?project_id={project_id}
```

**Request Body:**
```json
{
  "target_url": "https://api.example.com/endpoint",
  "start_vus": 10,
  "max_vus": 200,
  "step_duration": 30,
  "step_size": 20
}
```

---

## Tests CRUD

### List Tests
```
GET /tests?project_id={project_id}&test_type=lighthouse&limit=20&offset=0
```

### Get Test Details
```
GET /tests/{test_id}
```

### Delete Test
```
DELETE /tests/{test_id}
```

---

## AI Analysis

### Get AI Analysis
```
GET /tests/{test_id}/ai-analysis
```

**Response:**
```json
{
  "summary": "Performance analysis indicates...",
  "risk_level": "medium",
  "bottlenecks": [
    {
      "type": "render_blocking",
      "description": "CSS blocks rendering",
      "impact": "High - delays first paint",
      "recommendation": "Inline critical CSS"
    }
  ],
  "recommendations": [
    "Enable compression",
    "Optimize images"
  ],
  "optimization_score": 72
}
```

---

## Reports

### Export Report
```
GET /tests/{test_id}/report?format=pdf|html|json
```

Returns binary blob (PDF/HTML) or JSON.

---

## Scheduling

### Create Schedule
```
POST /schedules?project_id={project_id}
```

**Request Body:**
```json
{
  "name": "Daily Audit",
  "test_type": "lighthouse",
  "target_url": "https://example.com",
  "schedule": "0 9 * * *",
  "config": {}
}
```

### List Schedules
```
GET /schedules?project_id={project_id}
```

### Delete Schedule
```
DELETE /schedules/{schedule_id}
```

---

## Historical Trends

### Get Trend Data
```
GET /trends?project_id={project_id}&days=30
```

**Response:**
```json
[
  {
    "date": "2026-01-01",
    "timestamp": 1735689600000,
    "performance": 85,
    "lcp": 2100,
    "cls": 0.05
  }
]
```

---

## Compare Tests

### Compare Two Tests
```
GET /compare?test1={test_id}&test2={test_id}
```

**Response:**
```json
{
  "baseline": {...},
  "compare": {...},
  "improvements": ["LCP improved by 15%"],
  "regressions": ["CLS increased by 0.02"],
  "summary": "Overall improvement..."
}
```

---

## Error Responses

```json
{
  "detail": "Error message",
  "status_code": 400 | 401 | 404 | 500
}
```

| Code | Meaning |
|------|---------|
| 400 | Bad request |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Server error |
