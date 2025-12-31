"""
CI/CD Integration Service
Pipeline integration with webhooks and quality gates
"""
import secrets
import hmac
import hashlib
import json
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.security_advanced_models import (
    CICDPipeline, CICDPipelineRun, CICDProvider
)

logger = logging.getLogger(__name__)


class CICDIntegrationService:
    """CI/CD pipeline security integration"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_pipeline(
        self,
        project_id: UUID,
        organisation_id: UUID,
        name: str,
        provider: CICDProvider,
        policy_id: UUID = None,
        **config
    ) -> CICDPipeline:
        """Register a CI/CD pipeline for security scanning"""
        
        webhook_token = secrets.token_urlsafe(32)
        webhook_secret = secrets.token_hex(32)
        
        pipeline = CICDPipeline(
            project_id=project_id,
            organisation_id=organisation_id,
            name=name,
            provider=provider,
            webhook_token=webhook_token,
            webhook_secret=webhook_secret,
            trigger_on_push=config.get("trigger_on_push", True),
            trigger_on_pr=config.get("trigger_on_pr", True),
            trigger_branches=config.get("trigger_branches", ["main", "master", "develop"]),
            run_sast=config.get("run_sast", True),
            run_sca=config.get("run_sca", True),
            run_secrets=config.get("run_secrets", True),
            policy_id=policy_id,
            is_enabled=True,
            created_by=config.get("created_by")
        )
        self.db.add(pipeline)
        await self.db.commit()
        await self.db.refresh(pipeline)
        return pipeline

    async def get_pipeline(self, pipeline_id: UUID) -> Optional[CICDPipeline]:
        result = await self.db.execute(select(CICDPipeline).where(CICDPipeline.id == pipeline_id))
        return result.scalar_one_or_none()

    async def get_pipeline_by_token(self, token: str) -> Optional[CICDPipeline]:
        result = await self.db.execute(
            select(CICDPipeline).where(CICDPipeline.webhook_token == token)
        )
        return result.scalar_one_or_none()

    def verify_webhook_signature(self, pipeline: CICDPipeline, payload: bytes, signature: str) -> bool:
        """Verify webhook signature for GitHub/GitLab"""
        if not pipeline.webhook_secret:
            return True
        
        expected = hmac.new(
            pipeline.webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Handle different signature formats
        if signature.startswith("sha256="):
            signature = signature[7:]
        
        return hmac.compare_digest(expected, signature)

    async def handle_github_webhook(self, pipeline: CICDPipeline, payload: Dict) -> CICDPipelineRun:
        """Handle GitHub Actions webhook"""
        event_type = payload.get("action", "push")
        
        # Determine trigger type
        trigger_type = "push"
        pr_number = None
        branch = None
        commit_sha = None
        author = None
        
        if "pull_request" in payload:
            trigger_type = "pull_request"
            pr = payload["pull_request"]
            pr_number = pr.get("number")
            branch = pr.get("head", {}).get("ref")
            commit_sha = pr.get("head", {}).get("sha")
            author = pr.get("user", {}).get("login")
        elif "head_commit" in payload:
            commit = payload["head_commit"]
            commit_sha = commit.get("id")
            author = commit.get("author", {}).get("name")
            branch = payload.get("ref", "").replace("refs/heads/", "")
        
        return await self._create_run(
            pipeline, trigger_type, commit_sha, branch, pr_number, author
        )

    async def handle_gitlab_webhook(self, pipeline: CICDPipeline, payload: Dict) -> CICDPipelineRun:
        """Handle GitLab CI webhook"""
        event_type = payload.get("object_kind", "push")
        
        trigger_type = "push" if event_type == "push" else "pull_request"
        commit_sha = payload.get("checkout_sha") or payload.get("after")
        branch = payload.get("ref", "").replace("refs/heads/", "")
        author = payload.get("user_name")
        pr_number = payload.get("object_attributes", {}).get("iid") if event_type == "merge_request" else None
        
        return await self._create_run(
            pipeline, trigger_type, commit_sha, branch, pr_number, author
        )

    async def _create_run(
        self,
        pipeline: CICDPipeline,
        trigger_type: str,
        commit_sha: str = None,
        branch: str = None,
        pr_number: int = None,
        author: str = None
    ) -> CICDPipelineRun:
        """Create pipeline run record"""
        
        # Check branch filter
        if pipeline.trigger_branches and branch:
            if not any(b in branch for b in pipeline.trigger_branches):
                return None
        
        run = CICDPipelineRun(
            pipeline_id=pipeline.id,
            trigger_type=trigger_type,
            commit_sha=commit_sha,
            branch=branch,
            pr_number=pr_number,
            author=author,
            status="pending",
            started_at=datetime.utcnow()
        )
        self.db.add(run)
        
        # Update pipeline stats
        pipeline.total_runs = (pipeline.total_runs or 0) + 1
        pipeline.last_run_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(run)
        return run

    async def update_run_status(
        self,
        run_id: UUID,
        status: str,
        gate_passed: bool = None,
        gate_details: Dict = None,
        sast_scan_id: UUID = None,
        sca_scan_id: UUID = None
    ) -> CICDPipelineRun:
        """Update pipeline run status"""
        result = await self.db.execute(select(CICDPipelineRun).where(CICDPipelineRun.id == run_id))
        run = result.scalar_one_or_none()
        
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        run.status = status
        if gate_passed is not None:
            run.gate_passed = gate_passed
        if gate_details:
            run.gate_details = gate_details
        if sast_scan_id:
            run.sast_scan_id = sast_scan_id
        if sca_scan_id:
            run.sca_scan_id = sca_scan_id
        if status in ["passed", "failed", "error"]:
            run.completed_at = datetime.utcnow()
            if run.started_at:
                run.duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)
        
        await self.db.commit()
        return run

    async def generate_sarif_output(self, run_id: UUID) -> str:
        """Generate SARIF output for GitHub Security tab"""
        result = await self.db.execute(select(CICDPipelineRun).where(CICDPipelineRun.id == run_id))
        run = result.scalar_one_or_none()
        
        sarif = {
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "Cognitest Security",
                        "version": "1.0.0",
                        "informationUri": "https://cognitest.ai"
                    }
                },
                "results": []
            }]
        }
        
        # TODO: Add actual findings from SAST/SCA scans
        
        return json.dumps(sarif, indent=2)

    async def get_run(self, run_id: UUID) -> Optional[CICDPipelineRun]:
        result = await self.db.execute(select(CICDPipelineRun).where(CICDPipelineRun.id == run_id))
        return result.scalar_one_or_none()

    async def list_runs(self, pipeline_id: UUID, limit: int = 50) -> List[CICDPipelineRun]:
        result = await self.db.execute(
            select(CICDPipelineRun)
            .where(CICDPipelineRun.pipeline_id == pipeline_id)
            .order_by(CICDPipelineRun.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def list_pipelines(self, project_id: UUID) -> List[CICDPipeline]:
        result = await self.db.execute(
            select(CICDPipeline).where(CICDPipeline.project_id == project_id)
        )
        return result.scalars().all()
