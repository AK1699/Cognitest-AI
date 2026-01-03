"""
Loader.io Service
Integration with Loader.io API for cloud-based load testing
"""
import aiohttp
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class LoadTestType(str, Enum):
    """Loader.io test types"""
    CLIENTS_PER_TEST = "clients-per-test"       # Fixed number of clients
    CLIENTS_PER_SECOND = "clients-per-second"   # Ramp up clients per second
    MAINTAIN_LOAD = "maintain-client-load"      # Maintain constant load


class LoaderIOService:
    """
    Loader.io API integration
    Free cloud-based load testing service
    
    API Docs: https://loader.io/api/
    Free tier: Up to 10,000 clients per test, limited tests/month
    """
    
    BASE_URL = "https://api.loader.io/v2"
    
    def __init__(self, api_key: str):
        """
        Initialize Loader.io service
        
        Args:
            api_key: Loader.io API key (required)
        """
        if not api_key:
            raise ValueError("Loader.io API key is required")
        self.api_key = api_key
        self.headers = {
            "loaderio-auth": api_key,
            "Content-Type": "application/json"
        }
    
    async def verify_domain(self, domain: str) -> Dict[str, Any]:
        """
        Register and verify a domain for testing
        """
        logger.info(f"Registering domain with Loader.io: {domain}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.BASE_URL}/apps",
                headers=self.headers,
                json={"app": domain}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "domain": domain,
                        "token": data.get("token"),
                        "verified": data.get("status") == "verified",
                        "message": data.get("message", "")
                    }
                else:
                    error = await response.text()
                    logger.error(f"Domain registration failed: {error}")
                    raise Exception(f"Domain registration failed: {error}")
    
    async def list_registered_domains(self) -> List[Dict[str, Any]]:
        """Get list of registered domains"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.BASE_URL}/apps",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return []
    
    async def create_test(
        self,
        target_url: str,
        test_type: LoadTestType = LoadTestType.CLIENTS_PER_SECOND,
        clients: int = 100,
        duration_seconds: int = 60,
        timeout_ms: int = 10000,
        name: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[str] = None,
        method: str = "GET"
    ) -> Dict[str, Any]:
        """
        Create and run a load test
        """
        logger.info(f"Creating load test for {target_url} with {clients} clients")
        
        # Build test configuration
        test_config = {
            "test_type": test_type.value,
            "duration": duration_seconds,
            "timeout": timeout_ms,
            "urls": [
                {
                    "url": target_url,
                    "request_type": method.upper(),
                }
            ]
        }
        
        # Add client configuration based on test type
        if test_type == LoadTestType.CLIENTS_PER_TEST:
            test_config["total"] = clients
        elif test_type == LoadTestType.CLIENTS_PER_SECOND:
            test_config["from"] = 1
            test_config["to"] = clients
        else:  # MAINTAIN_LOAD
            test_config["initial"] = clients
        
        # Add optional fields
        if name:
            test_config["name"] = name
        if headers:
            test_config["urls"][0]["headers"] = headers
        if body:
            test_config["urls"][0]["raw_post_body"] = body
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.BASE_URL}/tests",
                headers=self.headers,
                json=test_config
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Test created: {data.get('message', 'OK')}")
                    return {
                        "test_id": data.get("test_id"),
                        "result_id": data.get("result_id"),
                        "message": data.get("message"),
                        "status": "created"
                    }
                else:
                    error = await response.text()
                    logger.error(f"Test creation failed: {error}")
                    raise Exception(f"Failed to create test: {error}")
    
    async def get_test_status(self, result_id: str) -> Dict[str, Any]:
        """
        Get status of a running or completed test
        """
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.BASE_URL}/results/{result_id}",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error = await response.text()
                    raise Exception(f"Failed to get test status: {error}")
    
    async def run_test_and_wait(
        self,
        target_url: str,
        test_type: LoadTestType = LoadTestType.CLIENTS_PER_SECOND,
        clients: int = 100,
        duration_seconds: int = 60,
        timeout_ms: int = 10000,
        name: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[str] = None,
        method: str = "GET",
        poll_interval: int = 5,
        max_wait_seconds: int = 600
    ) -> Dict[str, Any]:
        """
        Create test, wait for completion, and return results
        """
        # Create the test
        test_info = await self.create_test(
            target_url=target_url,
            test_type=test_type,
            clients=clients,
            duration_seconds=duration_seconds,
            timeout_ms=timeout_ms,
            name=name,
            headers=headers,
            body=body,
            method=method
        )
        
        result_id = test_info.get("result_id")
        if not result_id:
            raise Exception("No result_id returned from test creation")
        
        logger.info(f"Test started. Polling for results (result_id: {result_id})")
        
        # Poll for completion
        elapsed = 0
        while elapsed < max_wait_seconds:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
            
            status = await self.get_test_status(result_id)
            test_status = status.get("status", "unknown")
            
            logger.debug(f"Test status: {test_status} (elapsed: {elapsed}s)")
            
            if test_status == "complete":
                logger.info("Test completed successfully")
                return self._parse_results(status)
            elif test_status == "error":
                raise Exception(f"Test failed: {status.get('message', 'Unknown error')}")
        
        raise TimeoutError(f"Test did not complete within {max_wait_seconds} seconds")
    
    def _parse_results(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Loader.io results into our metrics format"""
        # Extract key metrics
        data_points = raw_result.get("data", [])
        
        # Calculate statistics from data points
        response_times = []
        error_counts = []
        request_counts = []
        
        for point in data_points:
            if point.get("avg_response_time"):
                response_times.append(point["avg_response_time"])
            if point.get("error_count"):
                error_counts.append(point["error_count"])
            if point.get("count"):
                request_counts.append(point["count"])
        
        total_requests = sum(request_counts) if request_counts else 0
        total_errors = sum(error_counts) if error_counts else 0
        
        # Calculate latency percentiles from available data
        avg_response = raw_result.get("avg_response_time", 0)
        
        return {
            "status": "completed",
            "result_id": raw_result.get("result_id"),
            
            # Request Metrics
            "total_requests_made": total_requests,
            "requests_per_second": raw_result.get("avg_count", 0),
            
            # Latency Metrics (Loader.io provides limited percentile data)
            "latency_avg": avg_response,
            "latency_min": raw_result.get("min_response_time", 0),
            "latency_max": raw_result.get("max_response_time", 0),
            
            # Crude percentile estimation (if not available)
            "latency_p50": avg_response,
            "latency_p95": raw_result.get("avg_95_percentile", avg_response * 1.5),
            "latency_p99": raw_result.get("avg_99_percentile", avg_response * 2),
            
            # Throughput
            "data_received_bytes": raw_result.get("total_bytes", 0),
            "throughput_bytes_per_second": raw_result.get("avg_bytes", 0),
            
            # Errors
            "error_count": total_errors,
            "error_rate": (total_errors / total_requests * 100) if total_requests > 0 else 0,
            
            # Timeline data for charts
            "timeline": [
                {
                    "timestamp": point.get("timestamp"),
                    "requests": point.get("count", 0),
                    "avg_response_time": point.get("avg_response_time", 0),
                    "errors": point.get("error_count", 0),
                    "success_rate": point.get("success_rate", 100),
                }
                for point in data_points
            ],
            
            # Test info
            "duration_seconds": raw_result.get("duration", 0),
            "started_at": raw_result.get("started_at"),
            "completed_at": datetime.utcnow().isoformat(),
            
            # Raw data for reference
            "raw_response": raw_result,
        }
    
    async def list_tests(self) -> List[Dict[str, Any]]:
        """Get list of all tests"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.BASE_URL}/tests",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    return await response.json()
                return []
    
    async def get_test(self, test_id: str) -> Dict[str, Any]:
        """Get test configuration"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.BASE_URL}/tests/{test_id}",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception("Test not found")
    
    async def delete_test(self, test_id: str) -> bool:
        """Delete a test"""
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f"{self.BASE_URL}/tests/{test_id}",
                headers=self.headers
            ) as response:
                return response.status == 200


# Singleton instance
_loader_service: Optional[LoaderIOService] = None


def get_loader_service(api_key: Optional[str] = None) -> Optional[LoaderIOService]:
    """Get or create Loader.io service instance"""
    global _loader_service
    if _loader_service is None and api_key:
        _loader_service = LoaderIOService(api_key=api_key)
    return _loader_service
