# Wave 4: Capacity Planning Guide

**Phase**: 6 Wave 4 (Production Readiness)
**Purpose**: Plan infrastructure for growth
**Date**: March 8, 2026
**Status**: Complete

---

## Capacity Planning Overview

This guide helps estimate infrastructure needs based on current usage and plan for growth.

---

## System Constraints & Limits

### Per-Server Hardware Limits

#### Browser Container Server
```
Hardware:        4-core CPU, 32GB RAM
Per Container:   1 browser ≈ 2GB RAM, 25% CPU
Max Containers:  (32GB × 0.75) / 2GB = 12 containers

CPU Constraint:  (4 cores × 100%) / 25% = 16 browsers (but memory limits first)
Memory Constraint: (32GB × 0.75) / 2GB = 12 browsers
Network Constraint: 10Mbps × 0.7 / 2Mbps per browser = 3.5 ≈ 3 browsers
BOTTLENECK: Network (3 browsers per server)

Realistic Limit: 10 concurrent browsers per server (conservative)
```

#### Backend Server
```
Hardware:        8-core CPU, 16GB RAM
Per Request:     ~50MB connections
Concurrent:      16GB / 50MB = 320 connections

CPU Constraint:  (8 cores × 80%) / (2% per request) = 320 concurrent
Memory Constraint: 16GB / 50MB = 320 concurrent
Load Balancer:   Can distribute across multiple servers
BOTTLENECK: Database connections (default 100, expand as needed)

Realistic Limit: 150-200 concurrent requests per backend server
```

#### Database Server
```
Hardware:        16-core CPU, 64GB RAM
Storage:         2TB SSD
Connection Pool: Default 100 (expandable to 500)

Active Connections: 100-500 concurrent queries
Read Replicas:  Recommended if >1000 concurrent users
BOTTLENECK: Connection pool or disk I/O

Realistic Limit: ~500 concurrent connections (with pool expansion)
```

---

## User Growth Model

### Current Baseline (March 2026)
```
Concurrent Users: 50
Total Users: 500
Storage Used: 50GB
Monthly Growth: 10%

Expected Next Milestones:
- Q2 2026: 150 concurrent (1500 total)
- Q3 2026: 300 concurrent (3000 total)
- Q4 2026: 600 concurrent (6000 total)
- Q1 2027: 1000 concurrent (10000 total)
```

### Hardware Projection (Month by Month)

| Month | Concurrent | Servers | RAM | CPU | Storage | Cost/mo |
|-------|-----------|---------|-----|-----|---------|---------|
| Mar | 50 | 1x backend, 1x DB | 48GB | 4 cores | 100GB | $1000 |
| Apr | 55 | 1x backend, 1x DB | 48GB | 4 cores | 110GB | $1000 |
| May | 60 | 1x backend, 1x DB | 48GB | 4 cores | 120GB | $1000 |
| Jun | 75 | 2x backend, 1x DB | 64GB | 8 cores | 150GB | $1500 |
| Jul | 83 | 2x backend, 1x DB | 64GB | 8 cores | 165GB | $1500 |
| Aug | 91 | 2x backend, 1x DB | 64GB | 8 cores | 182GB | $1500 |
| Sep | 110 | 3x backend, 1x DB | 80GB | 12 cores | 220GB | $2000 |
| Oct | 150 | 4x backend, 2x DB | 96GB | 16 cores | 300GB | $2500 |
| Nov | 165 | 4x backend, 2x DB | 96GB | 16 cores | 330GB | $2500 |
| Dec | 182 | 4x backend, 2x DB | 96GB | 16 cores | 364GB | $2500 |
| Jan | 200 | 5x backend, 2x DB | 112GB | 20 cores | 400GB | $3000 |

---

## Scaling Decision Triggers

### CPU Utilization

```
<30%: Optimal, can handle growth
30-50%: Normal operation, plan scaling in 2-4 weeks
50-70%: Loaded, plan scaling within 1 week
70-80%: High load, add capacity within 24 hours
>80%: Critical, add capacity immediately
```

**Action**:
```bash
# Check current CPU
kubectl top nodes

# If CPU >70% for >30 minutes:
# 1. Scale up backend
kubectl scale deployment backend --replicas=+1 -n cognitest

# 2. If still >70%, scale browser containers
kubectl scale deployment browser-container --replicas=+5 -n cognitest

# 3. Monitor for 10 minutes
watch -n 5 'kubectl top nodes'
```

### Memory Utilization

```
<50%: Optimal
50-70%: Normal, watch closely
70-80%: Add capacity within 1 week
80%+: Add capacity within 24 hours
>90%: Critical, immediate action
```

**Action**:
```bash
# Check current memory
free -h

# If memory >80%:
# 1. Identify high-memory consumers
docker stats --no-stream | sort -k4 -rn

# 2. Scale up or restart heavy containers
# 3. Consider memory-optimized instances
```

### Error Rate

```
<0.1%: Excellent
0.1-0.5%: Good
0.5-1%: Needs attention
1-2%: Scale up immediately
>2%: Crisis mode
```

**Action**:
```bash
# Check error rate
curl http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[5m])'

# If >0.5%:
# 1. Identify error type
docker logs cognitest-backend 2>&1 | grep ERROR | tail -20

# 2. Scale problematic service
# 3. If database errors: Increase connection pool
```

### Disk Usage

```
<50%: Optimal
50-70%: Normal, plan archival
70-80%: Archive old data immediately
>80%: Critical, stop accepting new data
>90%: Delete least-used data
```

**Action**:
```bash
# Check disk usage
df -h

# If disk >70%:
# 1. Archive old executions
sqlite3 cognitest.db "DELETE FROM executions WHERE created_at < datetime('now', '-90 days')"

# 2. Compress logs
gzip /var/log/cognitest/*.log

# 3. Move to archival storage
aws s3 cp /var/log/cognitest/ s3://cognitest-archive/logs/

# 4. Increase disk space (cloud)
```

---

## Scaling Plans

### Phase 1: Single Server (0-100 concurrent users)

```
Infrastructure:
├── Backend: 1 server (4 core, 8GB)
├── Database: 1 server (4 core, 16GB)
├── Browser: 1 server (4 core, 8GB) - 10 browsers
├── Redis: 1 server (2 core, 4GB)
└── Load Balancer: (optional, built-in)

Cost: ~$1000/month
Capacity: 100 concurrent users
```

### Phase 2: Multi-Backend (100-300 concurrent users)

```
Infrastructure:
├── Backend: 3 servers (4 core, 8GB each)
├── Database: 1 server (8 core, 32GB)
├── Browser: 3 servers (4 core, 8GB each) - 30 total
├── Redis: 1 server (2 core, 4GB)
├── Load Balancer: 1 (3-way round-robin)
└── Monitoring: Prometheus, Grafana

Cost: ~$2000/month
Capacity: 300 concurrent users
```

### Phase 3: Multi-Database (300-1000 concurrent users)

```
Infrastructure:
├── Backend: 5 servers (4 core, 8GB each)
├── Database: Primary + 2 Read Replicas (8 core, 32GB each)
├── Browser: 10 servers (4 core, 8GB each) - 100 total
├── Redis: Cluster mode, 3 nodes
├── Load Balancer: Multi-zone
└── CDN: For static assets

Cost: ~$3500/month
Capacity: 1000 concurrent users
```

### Phase 4: Multi-Region (1000+ concurrent users)

```
Infrastructure (per region):
├── Backend: 10 servers
├── Database: Primary + Replicas
├── Browser: 20 servers - 200 total
├── Redis: Cluster
├── Load Balancer: Multi-region

Global:
├── DNS: GeoDNS for routing
├── CDN: Multi-region
├── Monitoring: Central
└── Logging: Central

Cost: ~$8000+/month per region
Capacity: 1000+ concurrent users per region
Scalable to unlimited with N regions
```

---

## Cost Analysis

### Infrastructure Cost Breakdown (Assuming AWS)

| Component | Size | Cost/mo | Scaling |
|-----------|------|---------|---------|
| EC2 Backend | t3.medium | $40 | Add per 200 users |
| EC2 Database | m5.xlarge | $150 | Add per 500 users |
| EC2 Browser | t3.large | $80 | Add per 100 users |
| RDS Database | db.t3.small | $100 | Upgrade/replicas |
| ElastiCache Redis | cache.t3.small | $50 | Cluster mode |
| Load Balancer | ALB | $20 | Fixed |
| Data Transfer | Out | $0.02/GB | Variable |
| Storage | S3 | $0.023/GB | Archive old data |
| **Baseline** | **3-4 servers** | **~$1000** | **—** |

### Monthly Cost Projections

```
Month  Concurrent  Servers  Backend  Database  Browser  Redis  LB  Total
Mar    50          1        $40      $150      $80      $50    $20 $1,290
Apr    55          2        $80      $150      $160     $50    $20 $1,460
May    60          2        $80      $150      $160     $50    $20 $1,460
Jun    75          3        $120     $150      $240     $75    $20 $1,605
Jul    83          3        $120     $150      $240     $75    $20 $1,605
Aug    91          3        $120     $150      $240     $75    $20 $1,605
Sep    110         4        $160     $300      $320     $100   $20 $1,900
Oct    150         5        $200     $300      $400     $125   $20 $2,045
Nov    165         5        $200     $300      $400     $125   $20 $2,045
Dec    182         5        $200     $300      $400     $125   $20 $2,045
Jan    200         6        $240     $300      $480     $150   $20 $2,190
```

### ROI & Monetization Target

```
Assumptions:
- Average Revenue Per User (ARPU): $50/month
- 50% conversion from concurrent to paying
- Cost of infrastructure: See above

Model:
Concurrent Users × 50% conversion × $50 ARPU = Revenue
Revenue - Infrastructure Cost = Profit

Examples:
- 50 concurrent: $1250 - $1290 = -$40 (break-even)
- 100 concurrent: $2500 - $1500 = +$1000
- 200 concurrent: $5000 - $2200 = +$2800
- 500 concurrent: $12500 - $4000 = +$8500
- 1000 concurrent: $25000 - $6500 = +$18500

Break-even point: ~60 concurrent users
```

---

## Storage Planning

### Current Usage

```
Execution Logs:  5MB per execution × 100/day × 30 days = 15GB/month
Screenshots:     1MB per screenshot × 50 per execution × 100/day × 30 = 150GB/month
Videos:          100MB per 10-minute session × 10/day × 30 = 300GB/month
Database:        Grows ~10% per month = 5GB starting

Total: ~470GB/month
```

### Archival Strategy

```
Keep in fast storage (SSD):
- Executions: <30 days
- Screenshots: <7 days (only recent)
- Videos: <30 days

Archive to cold storage (S3):
- Executions: 30-90 days
- Screenshots: >7 days
- Videos: >30 days

Delete from cold storage:
- >1 year old

Cost Impact:
- SSD: $0.11/GB/month
- S3 Standard: $0.023/GB/month
- S3 Glacier: $0.004/GB/month

Example: 100GB
- SSD: $11/month
- S3 Standard: $2.30/month
- S3 Glacier: $0.40/month
```

---

## Performance at Scale

### Expected Latency vs. Concurrent Users

```
10 users:   4.2ms (baseline)
50 users:   4.9ms (16% overhead)
100 users:  5.5ms (30% overhead)
200 users:  6.5ms (54% overhead)  ← Single server limit
500 users:  10ms (138% overhead)   ← Multiple servers
1000 users: 14ms (233% overhead)   ← Needs optimization
```

**Mitigation for Large Scale**:
1. Cache frequently accessed data (Redis)
2. Use read replicas for database
3. Shard user data across databases
4. Implement request queuing
5. Use CDN for static assets

### Error Rate at Scale

```
<50 users:   <0.1% errors
50-100:      0.1-0.2%
100-200:     0.2-0.5%
200-500:     0.5-1%   ← May need optimization
500-1000:    1-2%     ← Needs significant optimization
>1000:       >2%      ← Multi-region required
```

**Mitigation**:
1. Improve error handling
2. Increase retry logic
3. Better connection pooling
4. Load shedding (graceful degradation)

---

## Monitoring for Capacity

### Key Metrics to Watch

```
Daily Checks:
- Peak concurrent users
- Average latency p95
- Error rate
- CPU utilization
- Memory utilization

Weekly Trends:
- Growth rate
- Peak trends
- Cost per user
- Error trends
```

### Alerts for Scaling

```
Set alerts for:
- CPU >70% for >10 min
- Memory >80% for >10 min
- Error rate >1%
- Disk >70%
- Latency P95 >100ms

These trigger automatic scaling or manual review
```

---

## Decision Matrix

### When to Scale

| Metric | Green | Yellow | Red | Action |
|--------|-------|--------|-----|--------|
| CPU | <30% | 30-70% | >70% | Monitor/Plan/ADD |
| Memory | <50% | 50-80% | >80% | Monitor/Plan/ADD |
| Disk | <50% | 50-80% | >80% | Monitor/Archive/ADD |
| Error Rate | <0.1% | 0.1-1% | >1% | Monitor/Investigate/ADD |
| Latency P95 | <50ms | 50-100ms | >100ms | OK/Optimize/ADD |

**Action**:
- **Monitor**: Watch for trend
- **Plan**: Schedule scaling in 1-2 weeks
- **ADD**: Add capacity within 24 hours

---

## Pre-Production Validation

Before scaling to production, validate:

```
✅ Database scaling: Test with >200 concurrent users
✅ Backend scaling: Test load distribution
✅ Browser scaling: Test with 50+ concurrent browsers
✅ Network: Test with high data transfer
✅ Storage: Test archival process
✅ Monitoring: Ensure all metrics capture scaling
✅ Failover: Test server/service failures at scale
✅ Disaster Recovery: Test restoration from backups
```

---

## Post-Launch Monitoring

After launching each scaling phase:

1. **Week 1**: Monitor every hour
2. **Week 2**: Monitor every 4 hours
3. **Week 3**: Monitor daily
4. **Week 4+**: Monitor per normal schedule

Track:
- Growth rate (are we on target?)
- Cost per user (is it profitable?)
- Performance metrics (maintaining quality?)
- User satisfaction (any complaints?)

---

## Summary

| Milestone | Users | Servers | Cost | Action |
|-----------|-------|---------|------|--------|
| Current | 50 | 1 | $1K | Maintain |
| Q2 2026 | 150 | 3 | $1.6K | 1x backend |
| Q3 2026 | 300 | 4 | $2K | 1x backend, 2x DB |
| Q4 2026 | 600 | 6 | $3K | 2x backend |
| Q1 2027 | 1000 | 10 | $4.5K | Multi-region ready |

---

**Capacity Planning Guide Complete**: March 8, 2026 ✅
**Next**: Production Readiness Summary

