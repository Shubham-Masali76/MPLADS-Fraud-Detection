"""
Pydantic Schemas for MPLADS AI Fraud Detection & Network Intelligence Backend
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ProjectSummary(BaseModel):
    project_id: str
    mp_id: str
    contractor_id: str
    sanctioned_amount: float
    project_category: str
    constituency: str
    state: str
    vpi: float
    priority_tier: str
    syndicate_id: str
    is_ringleader: bool
    is_split_work: bool
    forensic_explanation: str


class PaginatedProjectsResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[ProjectSummary]


class ProjectDossier(BaseModel):
    project_id: str
    mp_id: str
    contractor_id: str
    sanctioned_amount: float
    project_category: str
    project_description: Optional[str] = None
    constituency: str
    state: str
    sanction_date: Optional[str] = None
    expected_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    project_status: Optional[str] = None
    scores: Dict[str, float]
    priority_tier: str
    forensic_explanation: str
    syndicate_info: Optional[Dict[str, Any]] = None
    utilization_info: Optional[Dict[str, Any]] = None
    photo_evidence_info: Optional[Dict[str, Any]] = None
    audit_trail: List[str] = []


class SyndicateSummary(BaseModel):
    syndicate_id: str
    bank_account_id: str
    syndicate_size: int
    total_projects: int
    total_funds_inr: float
    collusion_risk_score: float
    ringleader_vendor_id: Optional[str] = None
    state_count: Optional[int] = None
    district_count: Optional[int] = None


class SyndicateDetail(BaseModel):
    syndicate_id: str
    bank_account_id: str
    syndicate_size: int
    total_projects: int
    total_funds_inr: float
    collusion_risk_score: float
    ringleader_vendor_id: Optional[str] = None
    members: List[Dict[str, Any]] = []
    awarded_projects: List[str] = []


class MPProfile(BaseModel):
    mp_id: str
    total_projects: int
    total_allocated_inr: float
    avg_project_vpi: float
    critical_projects: int
    high_projects: int
    syndicate_projects: int
    split_projects: int
    allocation_risk_score: float
    mp_vigilance_master_score: float
    hhi: Optional[float] = None
    cr1: Optional[float] = None
    cr3: Optional[float] = None


class WorkSplittingCluster(BaseModel):
    cluster_id: str
    effective_entity_id: str
    entity_type: str
    mp_id: str
    project_category: str
    project_count: int
    total_split_amount_inr: float
    average_amount_inr: float
    evades_gfr_threshold: bool
    timespan_days: int
    project_ids: List[str]
    contractor_ids: List[str]


class CytoscapeGraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class BlockchainBlock(BaseModel):
    index: int
    timestamp: str
    transaction_type: str
    payload: Dict[str, Any]
    payload_hash: str
    previous_hash: str
    block_hash: str
    nonce: int


class AuditDecisionRequest(BaseModel):
    project_id: str
    auditor_id: str
    decision: str = Field(..., description="Action: 'APPROVE', 'ESCALATE', or 'HOLD'")
    notes: Optional[str] = ""


class AuditDecisionResponse(BaseModel):
    success: bool
    block_index: int
    block_hash: str
    timestamp: str
    project_id: str
    auditor_id: str
    decision: str
    message: str


class ChainValidationResponse(BaseModel):
    is_valid: bool
    total_blocks: int
    latest_block_hash: str
    errors: List[str] = []


class PhotoVerificationResponse(BaseModel):
    success: bool
    claimed_latitude: float
    claimed_longitude: float
    photo_latitude: Optional[float] = None
    photo_longitude: Optional[float] = None
    distance_km: Optional[float] = None
    geo_mismatch: bool
    photo_timestamp: Optional[str] = None
    photo_hash: str
    duplicate_hash_detected: bool
    verdict: str
    details: str


class OverviewStats(BaseModel):
    total_projects: int
    total_sanctioned_funds_inr: float
    critical_priority_count: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    total_syndicates: int
    total_syndicate_vendors: int
    total_split_clusters: int
    total_split_funds_inr: float
    total_mps_monitored: int

