# Performance Testing Module - User Guide

## Overview

The Cognitest Performance Testing module provides enterprise-grade performance analysis including Lighthouse audits, load testing, stress testing, and AI-powered bottleneck detection.

## Getting Started

### Accessing the Module

1. Navigate to your project dashboard
2. Click **Performance Testing** in the sidebar
3. You'll see the Performance Overview with stats cards

### Dashboard Stats

| Metric | Description |
|--------|-------------|
| **Total Tests** | Number of tests run in this project |
| **Avg Score** | Average Lighthouse performance score |
| **Pass Rate** | Percentage of tests meeting thresholds |
| **Active Alerts** | Performance issues requiring attention |

---

## Lighthouse Audits

### What it Measures

- **Performance Score** (0-100) - Overall page speed
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint) - Loading performance
  - FID (First Input Delay) - Interactivity
  - CLS (Cumulative Layout Shift) - Visual stability
- **Accessibility**, **Best Practices**, **SEO** scores

### Running a Lighthouse Audit

1. Click the **Lighthouse** tab
2. Enter your target URL (e.g., `https://example.com`)
3. Select device type (Mobile/Desktop)
4. Click **Run Audit**

### Interpreting Results

| Score | Rating | Action |
|-------|--------|--------|
| 90-100 | 🟢 Good | Optimal - maintain current state |
| 50-89 | 🟡 Needs Improvement | Review opportunities |
| 0-49 | 🔴 Poor | Immediate action required |

---

## Load Testing

### Configuration Options

| Setting | Description | Range |
|---------|-------------|-------|
| **Target URL** | API endpoint or page to test | Any valid URL |
| **Virtual Users** | Concurrent simulated users | 1-500 |
| **Duration** | Test length in seconds | 10-300 |
| **Ramp Up** | Time to reach full load | 0-60 seconds |

### Running a Load Test

1. Click the **Load Test** tab
2. Enter your target URL
3. Configure virtual users (start with 10-50)
4. Set duration (60 seconds recommended)
5. Click **Start Test**

### Metrics Explained

| Metric | Description | Good Threshold |
|--------|-------------|----------------|
| **RPS** | Requests per second | Higher = better |
| **P50** | Median latency | < 100ms |
| **P95** | 95th percentile latency | < 500ms |
| **P99** | 99th percentile latency | < 1000ms |
| **Error Rate** | % of failed requests | < 1% |

---

## Stress Testing

Stress testing pushes your application beyond normal load to find breaking points.

### Stress Test Patterns

1. **Ramp Up**: Gradually increase load
2. **Spike**: Sudden traffic surge
3. **Soak**: Extended duration at moderate load

### Configuration

| Setting | Description |
|---------|-------------|
| **Start VUs** | Initial virtual users |
| **Max VUs** | Maximum to ramp up to |
| **Step Size** | Users added per step |
| **Step Duration** | Time per step |

---

## Test Comparison

Compare two test runs to track performance changes:

1. Click the **Results** tab
2. Select a **Baseline** test from the dropdown
3. Select a **Compare** test
4. View metrics with change indicators:
   - 🟢 ↑ Improvement
   - 🔴 ↓ Regression

---

## Report Export

Export test results in multiple formats:

| Format | Use Case |
|--------|----------|
| **PDF** | Stakeholder reports, printing |
| **HTML** | Interactive web viewing |
| **JSON** | CI/CD integration, automation |

### Exporting

1. Go to **Results** tab
2. Click **Export Report** button
3. Select format
4. Click Download

---

## Historical Trends

Track performance over time:

1. View the **Historical Trend** chart in Results
2. Select metric (Performance, LCP, RPS, etc.)
3. Choose time range (7d, 30d, 90d)
4. Analyze trend direction:
   - ↑ Improving
   - ↓ Regressing
   - — Stable

---

## AI Analysis

The AI analyzer provides:

- **Summary**: Overall assessment
- **Risk Level**: Low/Medium/High/Critical
- **Bottlenecks**: Identified performance issues
- **Recommendations**: Actionable improvements

---

## Best Practices

### For Lighthouse Audits

1. Test on representative pages (home, product, checkout)
2. Run multiple audits to account for variance
3. Test both mobile and desktop
4. Set up scheduled audits for monitoring

### For Load Testing

1. Start with baseline (10-20 VUs)
2. Gradually increase to find limits
3. Test during off-peak hours first
4. Monitor backend resources during tests

### For Production

1. Never run stress tests on production
2. Use staging environments for load testing
3. Set up alerts for performance degradation
4. Review trends weekly

---

## API Integration

Use the Performance API for automation:

```typescript
import { performanceAPI } from '@/lib/api/performance'

// Run Lighthouse audit
const result = await performanceAPI.runLighthouseAudit(
  projectId,
  'https://example.com',
  'mobile'
)

// Run load test
const loadResult = await performanceAPI.runLoadTest(projectId, {
  targetUrl: 'https://api.example.com/endpoint',
  virtualUsers: 50,
  durationSeconds: 60
})

// Get AI analysis
const analysis = await performanceAPI.getAIAnalysis(testId)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Audit not starting | Check URL is accessible |
| Low scores | Review Lighthouse opportunities |
| High latency | Check backend resources |
| Test timeout | Reduce duration or VUs |
| No data in charts | Ensure test completed |

---

## Support

For issues or feature requests, contact the Cognitest team.
