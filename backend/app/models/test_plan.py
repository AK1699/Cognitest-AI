from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Enum as SQLEnum, Integer, Float, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class GenerationType(str, enum.Enum):
    AI = "ai"
    MANUAL = "manual"
    HYBRID = "hybrid"

class TestPlanType(str, enum.Enum):
    REGRESSION = "regression"
    SANITY = "sanity"
    SMOKE = "smoke"
    UAT = "uat"
    PERFORMANCE = "performance"
    SECURITY = "security"
    INTEGRATION = "integration"
    UNIT = "unit"
    E2E = "e2e"
    API = "api"
    MOBILE = "mobile"
    OTHER = "other"

class ReviewStatus(str, enum.Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class ReportingFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    END_OF_CYCLE = "end_of_cycle"
    ON_DEMAND = "on_demand"

class TestPlan(Base):
    __tablename__ = "test_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # ========== 1. BASIC INFORMATION ==========
    name = Column(String(255), nullable=False, index=True)
    version = Column(String(100), nullable=True)  # Version/Release
    modules = Column(JSON, default=list)  # List of modules/features covered
    test_plan_type = Column(SQLEnum(TestPlanType), default=TestPlanType.REGRESSION)

    # ========== 2. OBJECTIVES & SCOPE ==========
    objective = Column(Text, nullable=True)  # Purpose/Goal
    description = Column(Text, nullable=True)  # Additional description
    scope_in = Column(JSON, default=list)  # Features/areas in scope
    scope_out = Column(JSON, default=list)  # Explicitly excluded areas
    assumptions = Column(Text, nullable=True)  # Assumptions made
    constraints_risks = Column(Text, nullable=True)  # Constraints and risks

    # Legacy objectives field (kept for backward compatibility)
    objectives = Column(JSON, default=list)  # List of objectives

    # ========== 3. TEST STRATEGY & APPROACH ==========
    testing_approach = Column(Text, nullable=True)  # High-level methodology
    test_levels = Column(JSON, default=list)  # Unit, Integration, System, UAT, etc.
    test_types = Column(JSON, default=list)  # Functional, Non-Functional, etc.
    entry_criteria = Column(Text, nullable=True)  # Conditions before testing begins
    exit_criteria = Column(Text, nullable=True)  # Conditions for completion
    defect_management_approach = Column(Text, nullable=True)  # How defects are handled

    # ========== 4. ENVIRONMENT & TOOLS ==========
    test_environments = Column(JSON, default=list)  # DEV, QA, STAGE, UAT, PROD, etc.
    environment_urls = Column(JSON, default=dict)  # URLs/access details for environments
    tools_used = Column(JSON, default=list)  # Cypress, Playwright, Jenkins, etc.
    data_setup = Column(Text, nullable=True)  # Test data setup/configuration

    # ========== 5. ROLES & RESPONSIBILITIES ==========
    test_manager_id = Column(UUID(as_uuid=True), nullable=True)  # Test Manager
    qa_lead_ids = Column(JSON, default=list)  # QA Leads
    qa_engineer_ids = Column(JSON, default=list)  # QA Engineers/Testers
    stakeholder_ids = Column(JSON, default=list)  # Stakeholders/Approvers

    # ========== 6. SCHEDULE & MILESTONES ==========
    planned_start_date = Column(Date, nullable=True)
    planned_end_date = Column(Date, nullable=True)
    actual_start_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    milestones = Column(JSON, default=list)  # List of milestone objects

    # ========== 7. METRICS & REPORTING ==========
    test_coverage_target = Column(Float, nullable=True)  # Target coverage %
    automation_coverage_target = Column(Float, nullable=True)  # Target automation %
    defect_density_target = Column(Float, nullable=True)  # Expected quality threshold
    reporting_frequency = Column(SQLEnum(ReportingFrequency), default=ReportingFrequency.WEEKLY)
    dashboard_links = Column(JSON, default=list)  # Links to dashboards/reports

    # ========== 8. REVIEW & APPROVAL ==========
    review_status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.DRAFT)
    reviewed_by_ids = Column(JSON, default=list)  # List of reviewer IDs
    review_comments = Column(Text, nullable=True)  # Reviewer feedback
    approval_date = Column(DateTime(timezone=True), nullable=True)

    # ========== AI GENERATION ==========
    generated_by = Column(SQLEnum(GenerationType), default=GenerationType.MANUAL)
    source_documents = Column(JSON, default=list)  # List of source doc URLs/paths
    confidence_score = Column(String(50), nullable=True)  # AI confidence

    # ========== IEEE 829 COMPREHENSIVE SECTIONS ==========
    # These store structured JSON data following IEEE 829 standard
    test_objectives_ieee = Column(JSON, default=list)  # List of detailed objectives with success criteria
    scope_of_testing_ieee = Column(JSON, default=dict)  # Comprehensive scope definition
    test_approach_ieee = Column(JSON, default=dict)  # Testing approach and methodology
    assumptions_constraints_ieee = Column(JSON, default=list)  # Assumptions and constraints
    test_schedule_ieee = Column(JSON, default=dict)  # Detailed schedule with phases
    resources_roles_ieee = Column(JSON, default=list)  # Resource allocation and roles
    test_environment_ieee = Column(JSON, default=dict)  # Environment specifications
    entry_exit_criteria_ieee = Column(JSON, default=dict)  # Entry/exit criteria
    risk_management_ieee = Column(JSON, default=dict)  # Risk management with matrix
    deliverables_reporting_ieee = Column(JSON, default=dict)  # Deliverables and reporting
    approval_signoff_ieee = Column(JSON, default=dict)  # Approval and sign-off process

    # ========== METADATA ==========
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # ========== TIMESTAMPS & AUDIT ==========
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)
    last_updated_by = Column(String(255), nullable=True)

    # ========== RELATIONSHIPS ==========
    project = relationship("Project", back_populates="test_plans")
    test_suites = relationship("TestSuite", back_populates="test_plan", cascade="all, delete-orphan")
    approval = relationship("TestPlanApproval", back_populates="test_plan", uselist=False,
                           cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestPlan {self.name}>"
