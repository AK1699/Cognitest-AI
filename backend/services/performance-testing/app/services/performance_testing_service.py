"""
Performance Testing Service
Main orchestration service for all performance testing operations
"""
import logging
import asyncio
import random
import string
from typing import Dict, Any, Optional, List, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models.performance import (
    PerformanceTest, PerformanceMetrics, TestExecution, 
    PerformanceAlert, TestType, TestStatus, TestProvider,
    AlertSeverity, DeviceType, ConnectionType, LoadProfile
)
from .pagespeed_service import PageSpeedInsightsService, get_pagespeed_service
from .loader_service import LoaderIOService, get_loader_service, LoadTestType
from .webpagetest_service import WebPageTestService, WebPageTestConfig
from .performance_ai_analyzer import PerformanceAIAnalyzer, get_performance_ai_analyzer

logger = logging.getLogger(__name__)


async def generate_human_id(prefix: str, db: AsyncSession) -> str:
    """Generate a human-readable ID like PERF-A1B2C or EXEC-X9Y8Z"""
    # Simple implementation for now, in production this should be more robust
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"{prefix}-{suffix}"


class PerformanceTestingService:
    """
    Main performance testing orchestration service
    Coordinates between different test providers and manages test lifecycle
    """
    
    def __init__(
        self,
        db: AsyncSession,
        pagespeed_api_key: Optional[str] = None,
        loader_api_key: Optional[str] = None,
        wpt_api_key: Optional[str] = None,
        google_api_key: Optional[str] = None,
    ):
        self.db = db
        self.pagespeed_service = get_pagespeed_service(pagespeed_api_key)
        self.loader_service = get_loader_service(loader_api_key) if loader_api_key else None
        self.wpt_service = WebPageTestService(wpt_api_key) if wpt_api_key else None
        self.ai_analyzer = get_performance_ai_analyzer(api_key=google_api_key)
    
    # =========================================================================
    # Test CRUD Operations
    # =========================================================================
    
    async def create_test(
        self,
        project_id: UUID,
        organisation_id: UUID,
        user_id: Optional[UUID],
        name: str,
        test_type: TestType,
        target_url: str,
        **kwargs
    ) -> PerformanceTest:
        """Create a new performance test"""
        
        # Generate human-friendly ID
        human_id = await generate_human_id("PERF", self.db)
        
        test = PerformanceTest(
            project_id=project_id,
            organisation_id=organisation_id,
            human_id=human_id,
            name=name,
            test_type=test_type,
            target_url=target_url,
            triggered_by=user_id,
            trigger_source=kwargs.get("trigger_source", "manual"),
            
            # Optional fields
            description=kwargs.get("description"),
            target_method=kwargs.get("target_method", "GET"),
            target_headers=kwargs.get("target_headers", {}),
            target_body=kwargs.get("target_body"),
            
            # Lighthouse options
            device_type=kwargs.get("device_type", DeviceType.MOBILE),
            connection_type=kwargs.get("connection_type", ConnectionType.CABLE),
            test_location=kwargs.get("test_location", "us-central1"),
            
            # Load test options
            virtual_users=kwargs.get("virtual_users", 10),
            duration_seconds=kwargs.get("duration_seconds", 60),
            ramp_up_seconds=kwargs.get("ramp_up_seconds", 10),
            ramp_down_seconds=kwargs.get("ramp_down_seconds", 10),
            load_profile=kwargs.get("load_profile", LoadProfile.RAMP_UP),
            stages=kwargs.get("stages"),
            
            # Thresholds
            thresholds=kwargs.get("thresholds", {}),
            
            # Metadata
            tags=kwargs.get("tags", []),
            notes=kwargs.get("notes"),
        )
        
        self.db.add(test)
        await self.db.commit()
        await self.db.refresh(test)
        
        logger.info(f"Created performance test: {test.human_id}")
        return test
    
    async def get_test(self, test_id: UUID) -> Optional[PerformanceTest]:
        """Get a performance test by ID"""
        result = await self.db.execute(
            select(PerformanceTest).where(PerformanceTest.id == test_id)
        )
        return result.scalar_one_or_none()
    
    async def list_tests(
        self,
        project_id: UUID,
        page: int = 1,
        page_size: int = 20,
        test_type: Optional[TestType] = None,
        status: Optional[TestStatus] = None
    ) -> Tuple[List[PerformanceTest], int]:
        """List performance tests for a project with pagination"""
        query = select(PerformanceTest).where(
            PerformanceTest.project_id == project_id
        )
        
        if test_type:
            query = query.where(PerformanceTest.test_type == test_type)
        if status:
            query = query.where(PerformanceTest.status == status)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0
        
        # Paginate
        query = query.order_by(PerformanceTest.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.db.execute(query)
        tests = result.scalars().all()
        
        return list(tests), total
    
    async def delete_test(self, test_id: UUID) -> bool:
        """Delete a performance test"""
        test = await self.get_test(test_id)
        if test:
            await self.db.delete(test)
            await self.db.commit()
            return True
        return False
    
    # =========================================================================
    # Test Execution
    # =========================================================================
    
    async def execute_test(self, test_id: UUID) -> PerformanceTest:
        """
        Execute a performance test
        Routes to appropriate service based on test type
        """
        test = await self.get_test(test_id)
        if not test:
            raise ValueError(f"Test {test_id} not found")
        
        # Update status
        test.status = TestStatus.RUNNING
        test.started_at = datetime.utcnow()
        test.progress_percentage = 10
        await self.db.commit()
        
        try:
            # Route to appropriate handler
            if test.test_type == TestType.LIGHTHOUSE:
                await self._execute_lighthouse_test(test)
            elif test.test_type in [TestType.LOAD, TestType.STRESS, TestType.SPIKE]:
                await self._execute_load_test(test)
            elif test.test_type == TestType.API:
                await self._execute_api_test(test)
            else:
                raise ValueError(f"Unsupported test type: {test.test_type}")
            
            # AI Analysis if results available
            try:
                # Need to fetch metrics first
                metrics_result = await self.db.execute(
                    select(PerformanceMetrics).where(PerformanceMetrics.test_id == test.id)
                )
                metrics = metrics_result.scalar_one_or_none()
                
                if metrics:
                    if test.test_type == TestType.LIGHTHOUSE:
                        analysis = await self.ai_analyzer.analyze_lighthouse_results(
                            metrics=metrics.__dict__, # Convert to dict for analyzer
                            url=test.target_url
                        )
                    else:
                        analysis = await self.ai_analyzer.analyze_load_test_results(
                            metrics=metrics.__dict__,
                            config={"target_url": test.target_url, "virtual_users": test.virtual_users, "duration_seconds": test.duration_seconds}
                        )
                    
                    test.ai_analysis = analysis.get("summary")
                    test.ai_recommendations = analysis.get("recommendations", [])
                    test.ai_risk_level = analysis.get("risk_level")
            except Exception as ai_err:
                logger.warning(f"AI analysis failed for test {test.id}: {ai_err}")

            # Mark complete
            test.status = TestStatus.COMPLETED
            test.completed_at = datetime.utcnow()
            test.duration_ms = int((test.completed_at - test.started_at).total_seconds() * 1000)
            test.progress_percentage = 100
            
            # Check thresholds
            await self._check_thresholds(test)
            
        except Exception as e:
            logger.error(f"Test execution failed: {e}")
            test.status = TestStatus.FAILED
            test.error_message = str(e)
            test.completed_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(test)
        
        # Create execution record
        await self._create_execution_record(test)
        
        return test
    
    async def _execute_lighthouse_test(self, test: PerformanceTest):
        """Execute Lighthouse/PageSpeed test"""
        logger.info(f"Running Lighthouse test for {test.target_url}")
        
        test.provider = TestProvider.PAGESPEED_INSIGHTS
        test.progress_percentage = 30
        await self.db.commit()
        
        # Run PageSpeed audit
        strategy = "mobile" if test.device_type == DeviceType.MOBILE else "desktop"
        result = await self.pagespeed_service.run_audit(
            url=test.target_url,
            strategy=strategy
        )
        
        test.progress_percentage = 80
        await self.db.commit()
        
        # Store metrics
        await self._store_lighthouse_metrics(test, result)
    
    async def _execute_load_test(self, test: PerformanceTest):
        """Execute load/stress/spike test"""
        if self.loader_service:
            logger.info(f"Running CLOUD load test for {test.target_url}")
            test.provider = TestProvider.LOADER_IO
            test.progress_percentage = 20
            await self.db.commit()
            
            # Determine load test type based on test type
            if test.test_type == TestType.STRESS:
                load_type = LoadTestType.CLIENTS_PER_SECOND
            elif test.test_type == TestType.SPIKE:
                load_type = LoadTestType.MAINTAIN_LOAD
            else:
                load_type = LoadTestType.CLIENTS_PER_SECOND
            
            try:
                # Run cloud load test
                result = await self.loader_service.run_test_and_wait(
                    target_url=test.target_url,
                    test_type=load_type,
                    clients=test.virtual_users,
                    duration_seconds=test.duration_seconds,
                    headers=test.target_headers,
                    body=test.target_body,
                    method=test.target_method,
                    name=test.name
                )
                
                test.provider_test_id = result.get("result_id")
                test.progress_percentage = 90
                await self.db.commit()
                
                # Store metrics
                await self._store_load_test_metrics(test, result)
                return
            except Exception as e:
                logger.warning(f"Cloud load test failed, falling back to local: {e}")

        # Fallback to REAL local execution instead of mock
        await self._execute_local_load_test(test)

    async def _execute_local_load_test(self, test: PerformanceTest):
        """Execute a real local load test using aiohttp"""
        import time
        import aiohttp
        
        logger.info(f"Running REAL LOCAL load test for {test.target_url}")
        
        test.provider = TestProvider.LOCAL
        test.progress_percentage = 10
        await self.db.commit()
        
        start_time = time.time()
        # Ensure duration is at least 1s
        duration = max(test.duration_seconds or 5, 1)
        end_time = start_time + duration
        
        latencies = []
        errors = 0
        total_requests = 0
        timeline = []
        
        # Cap local concurrency for safety/stability
        concurrency = min(test.virtual_users or 10, 50)
        
        async with aiohttp.ClientSession() as session:
            while time.time() < end_time:
                batch_start = time.time()
                tasks = []
                
                # Create a batch of requests
                for _ in range(concurrency):
                    tasks.append(session.request(
                        method=test.target_method or "GET",
                        url=test.target_url,
                        headers=test.target_headers or {},
                        timeout=aiohttp.ClientTimeout(total=10)
                    ))
                
                # Execute batch
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                batch_latencies = []
                batch_errors = 0
                for res in results:
                    total_requests += 1
                    if isinstance(res, aiohttp.ClientResponse):
                        lat = (time.time() - batch_start) * 1000 # ms
                        latencies.append(lat)
                        batch_latencies.append(lat)
                        if res.status >= 400:
                            errors += 1
                            batch_errors += 1
                        await res.release()
                    else:
                        errors += 1
                        batch_errors += 1
                        logger.debug(f"Local request failed: {res}")
                
                # Update progress
                elapsed = time.time() - start_time
                progress = int(10 + (80 * (min(elapsed / duration, 1.0))))
                test.progress_percentage = progress
                await self.db.commit()
                
                # Add to timeline for real-time charts
                timeline.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "requests": len(results),
                    "avg_response_time": sum(batch_latencies) / len(batch_latencies) if batch_latencies else 0,
                    "errors": batch_errors,
                })
                
                # Update metrics periodically (every ~2 seconds)
                if len(timeline) % 4 == 0:
                    partial_latencies = sorted(latencies) if latencies else [0]
                    p_count = len(partial_latencies)
                    partial_result = {
                        "total_requests_made": total_requests,
                        "requests_per_second": total_requests / max(elapsed, 1),
                        "latency_min": partial_latencies[0],
                        "latency_max": partial_latencies[-1],
                        "latency_avg": sum(partial_latencies) / p_count,
                        "latency_p50": partial_latencies[int(p_count * 0.5)],
                        "latency_p95": partial_latencies[int(p_count * 0.95)],
                        "latency_p99": partial_latencies[int(p_count * 0.99)],
                        "error_count": errors,
                        "error_rate": (errors / total_requests * 100) if total_requests > 0 else 0,
                        "timeline": timeline,
                    }
                    await self._store_load_test_metrics(test, partial_result)
                
                # Regulate RPS a bit
                await asyncio.sleep(0.5)
        
        # Calculate final metrics from collected data
        if not latencies:
            latencies = [0]
            
        latencies.sort()
        count = len(latencies)
        
        result = {
            "total_requests_made": total_requests,
            "requests_per_second": total_requests / duration,
            "latency_min": latencies[0],
            "latency_max": latencies[-1],
            "latency_avg": sum(latencies) / count,
            "latency_p50": latencies[int(count * 0.5)],
            "latency_p95": latencies[int(count * 0.95)],
            "latency_p99": latencies[int(count * 0.99)],
            "data_received_bytes": total_requests * 1024, # Approximation
            "throughput_bytes_per_second": (total_requests * 1024) / duration,
            "error_count": errors,
            "error_rate": (errors / total_requests * 100) if total_requests > 0 else 0,
            "timeline": timeline,
            "raw_response": {"local_execution": True, "concurrency": concurrency}
        }
        
        test.progress_percentage = 95
        await self._store_load_test_metrics(test, result)
    
    async def _execute_api_test(self, test: PerformanceTest):
        """Execute simple API performance test"""
        # For API tests, we use PageSpeed for now (simpler single-request timing)
        await self._execute_lighthouse_test(test)
    
    async def _store_lighthouse_metrics(self, test: PerformanceTest, result: Dict[str, Any]):
        """Store Lighthouse metrics in database"""
        metrics = PerformanceMetrics(
            test_id=test.id,
            
            # Scores
            performance_score=result.get("performance_score"),
            accessibility_score=result.get("accessibility_score"),
            seo_score=result.get("seo_score"),
            best_practices_score=result.get("best_practices_score"),
            pwa_score=result.get("pwa_score"),
            
            # Core Web Vitals
            largest_contentful_paint=result.get("largest_contentful_paint"),
            first_input_delay=result.get("first_input_delay"),
            cumulative_layout_shift=result.get("cumulative_layout_shift"),
            first_contentful_paint=result.get("first_contentful_paint"),
            time_to_first_byte=result.get("time_to_first_byte"),
            
            # Additional metrics
            speed_index=result.get("speed_index"),
            time_to_interactive=result.get("time_to_interactive"),
            total_blocking_time=result.get("total_blocking_time"),
            
            # Page resources
            total_byte_weight=result.get("total_byte_weight"),
            total_requests=result.get("total_requests"),
            dom_size=result.get("dom_size"),
            
            # Opportunities & diagnostics
            opportunities=result.get("opportunities", []),
            diagnostics=result.get("diagnostics", []),
            
            # Screenshots
            screenshot_url=result.get("screenshot"),
            
            # Raw data
            raw_response=result.get("raw_response"),
        )

        if metrics.raw_response:
             logger.info(f"DEBUG: PerformanceMetrics created with raw_response. Size: {len(str(metrics.raw_response))}")
        else:
             logger.warning("DEBUG: PerformanceMetrics created BUT raw_response is None!")
        
        self.db.add(metrics)
        await self.db.commit()
    
    async def _store_load_test_metrics(self, test: PerformanceTest, result: Dict[str, Any]):
        """Store or update load test metrics in database"""
        timeline = result.get("timeline", [])
        
        # Check for existing metrics
        existing_metrics_result = await self.db.execute(
            select(PerformanceMetrics).where(PerformanceMetrics.test_id == test.id)
        )
        metrics = existing_metrics_result.scalar_one_or_none()
        
        if not metrics:
            metrics = PerformanceMetrics(test_id=test.id)
            self.db.add(metrics)
            
        # Request metrics
        metrics.total_requests_made = result.get("total_requests_made")
        metrics.requests_per_second = result.get("requests_per_second")
        
        # Latency
        metrics.latency_min = result.get("latency_min")
        metrics.latency_max = result.get("latency_max")
        metrics.latency_avg = result.get("latency_avg")
        metrics.latency_p50 = result.get("latency_p50")
        metrics.latency_p95 = result.get("latency_p95")
        metrics.latency_p99 = result.get("latency_p99")
        
        # Throughput
        if result.get("data_received_bytes"):
            metrics.data_received_bytes = result.get("data_received_bytes")
        if result.get("throughput_bytes_per_second"):
            metrics.throughput_bytes_per_second = result.get("throughput_bytes_per_second")
        
        # Errors
        metrics.error_count = result.get("error_count", 0)
        metrics.error_rate = result.get("error_rate", 0)
        
        # Max VUs
        metrics.max_virtual_users = test.virtual_users
        
        # Timeline data for charts
        metrics.latency_timeline = [
            {"timestamp": p.get("timestamp"), "value": p.get("avg_response_time")}
            for p in timeline
        ]
        metrics.rps_timeline = [
            {"timestamp": p.get("timestamp"), "value": p.get("requests")}
            for p in timeline
        ]
        metrics.errors_timeline = [
            {"timestamp": p.get("timestamp"), "value": p.get("errors")}
            for p in timeline
        ]
        
        # Raw data
        if result.get("raw_response"):
            metrics.raw_response = result.get("raw_response")
        
        await self.db.commit()
    
    async def _check_thresholds(self, test: PerformanceTest):
        """Check if test results meet defined thresholds"""
        if not test.thresholds:
            return
        
        # Get metrics
        result = await self.db.execute(
            select(PerformanceMetrics).where(PerformanceMetrics.test_id == test.id)
        )
        metrics = result.scalar_one_or_none()
        if not metrics:
            return
        
        test.threshold_passed = True
        
        for metric_name, threshold_value in test.thresholds.items():
            actual_value = getattr(metrics, metric_name, None)
            if actual_value is None:
                continue
            
            # Check if threshold is breached
            breached = False
            if metric_name in ["error_rate"]:
                breached = float(actual_value) > float(threshold_value)
            elif metric_name in ["performance_score"]:
                breached = float(actual_value) < float(threshold_value)
            elif "latency" in metric_name:
                breached = float(actual_value) > float(threshold_value)
            
            if breached:
                test.threshold_passed = False
                # Create alert
                await self._create_alert(
                    test=test,
                    metric_name=metric_name,
                    threshold_value=float(threshold_value),
                    actual_value=float(actual_value)
                )
    
    async def _create_alert(
        self,
        test: PerformanceTest,
        metric_name: str,
        threshold_value: float,
        actual_value: float
    ):
        """Create a performance alert for threshold breach"""
        severity = AlertSeverity.WARNING
        if metric_name == "error_rate" and actual_value > 5:
            severity = AlertSeverity.CRITICAL
        elif "performance_score" in metric_name and actual_value < 50:
            severity = AlertSeverity.CRITICAL
        
        alert = PerformanceAlert(
            test_id=test.id,
            project_id=test.project_id,
            severity=severity,
            title=f"Threshold breach: {metric_name}",
            message=f"{metric_name} ({actual_value}) exceeded threshold ({threshold_value})",
            metric_name=metric_name,
            threshold_value=threshold_value,
            actual_value=actual_value,
        )
        
        self.db.add(alert)
        await self.db.commit()
        
        logger.warning(f"Alert created: {alert.title}")
    
    async def _create_execution_record(self, test: PerformanceTest):
        """Create execution history record"""
        # Count existing executions
        count_result = await self.db.execute(
            select(func.count()).where(TestExecution.test_id == test.id)
        )
        run_number = (count_result.scalar() or 0) + 1
        
        # Get metrics snapshot
        metrics_result = await self.db.execute(
            select(PerformanceMetrics).where(PerformanceMetrics.test_id == test.id)
        )
        metrics = metrics_result.scalar_one_or_none()
        
        execution = TestExecution(
            test_id=test.id,
            human_id=await generate_human_id("EXEC", self.db),
            run_number=run_number,
            status=test.status,
            started_at=test.started_at,
            completed_at=test.completed_at,
            duration_ms=test.duration_ms,
            
            # Key metrics snapshot
            performance_score=metrics.performance_score if metrics else None,
            latency_p95=metrics.latency_p95 if metrics else None,
            requests_per_second=metrics.requests_per_second if metrics else None,
            error_rate=metrics.error_rate if metrics else None,
            
            threshold_passed=test.threshold_passed,
            
            provider=test.provider,
            provider_test_id=test.provider_test_id,
            
            error_message=test.error_message,
            triggered_by=test.triggered_by,
            trigger_source=test.trigger_source,
            
            # Store metrics snapshot
            metrics_snapshot=metrics.__dict__ if metrics else {}
        )
        
        self.db.add(execution)
        await self.db.commit()
    
    # =========================================================================
    # Dashboards & Statistics
    # =========================================================================
    
    async def get_dashboard_stats(self, project_id: UUID) -> Dict[str, Any]:
        """Get dashboard statistics for a project"""
        now = datetime.utcnow()
        last_7_days = now - timedelta(days=7)
        
        # Total tests
        total_result = await self.db.execute(
            select(func.count()).where(PerformanceTest.project_id == project_id)
        )
        total_tests = total_result.scalar() or 0
        
        # Tests in last 7 days
        week_result = await self.db.execute(
            select(func.count()).where(
                and_(
                    PerformanceTest.project_id == project_id,
                    PerformanceTest.created_at >= last_7_days
                )
            )
        )
        tests_last_7_days = week_result.scalar() or 0
        
        # Pass rate
        passed_result = await self.db.execute(
            select(func.count()).where(
                and_(
                    PerformanceTest.project_id == project_id,
                    PerformanceTest.threshold_passed == True
                )
            )
        )
        passed_count = passed_result.scalar() or 0
        
        completed_result = await self.db.execute(
            select(func.count()).where(
                and_(
                    PerformanceTest.project_id == project_id,
                    PerformanceTest.status == TestStatus.COMPLETED
                )
            )
        )
        completed_count = completed_result.scalar() or 0
        
        pass_rate = (passed_count / completed_count * 100) if completed_count > 0 else 0
        
        # Average performance score
        avg_score_result = await self.db.execute(
            select(func.avg(PerformanceMetrics.performance_score))
            .join(PerformanceTest)
            .where(PerformanceTest.project_id == project_id)
        )
        avg_performance_score = avg_score_result.scalar()
        
        # Active tests
        active_result = await self.db.execute(
            select(func.count()).where(
                and_(
                    PerformanceTest.project_id == project_id,
                    PerformanceTest.status == TestStatus.RUNNING
                )
            )
        )
        active_tests = active_result.scalar() or 0
        
        # Active alerts
        alerts_result = await self.db.execute(
            select(func.count()).where(
                and_(
                    PerformanceAlert.project_id == project_id,
                    PerformanceAlert.is_acknowledged == False
                )
            )
        )
        active_alerts = alerts_result.scalar() or 0
        
        return {
            "project_id": project_id,
            "total_tests": total_tests,
            "tests_last_7_days": tests_last_7_days,
            "pass_rate": round(pass_rate, 1),
            "avg_performance_score": round(avg_performance_score, 1) if avg_performance_score else None,
            "active_tests": active_tests,
            "active_alerts": active_alerts,
        }
