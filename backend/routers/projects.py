"""
Projects REST API Router
Provides multi-criteria search, pagination, and comprehensive forensic dossiers.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import PaginatedProjectsResponse, ProjectDossier
from backend.services.data_service import data_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=PaginatedProjectsResponse)
def list_projects(
    priority_tier: Optional[str] = Query(None, description="Filter by risk tier: CRITICAL, HIGH, MEDIUM, LOW"),
    min_vpi: Optional[float] = Query(None, ge=0.0, le=100.0, description="Minimum VPI score"),
    max_vpi: Optional[float] = Query(None, ge=0.0, le=100.0, description="Maximum VPI score"),
    mp_id: Optional[str] = Query(None, description="Filter by awarding MP ID"),
    vendor_id: Optional[str] = Query(None, description="Filter by contractor ID"),
    category: Optional[str] = Query(None, description="Filter by work category"),
    syndicate_id: Optional[str] = Query(None, description="Filter by shell syndicate ID"),
    is_split_work: Optional[bool] = Query(None, description="Filter by work splitting flag"),
    search: Optional[str] = Query(None, description="Search term across ID, description, or constituency"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=500, description="Page size"),
    sort_by: str = Query("vpi", description="Field to sort by: vpi, amount, ml_anomaly, collusion"),
    sort_desc: bool = Query(True, description="Sort descending if true"),
):
    """Retrieves paginated list of projects with multi-criteria forensic filtering."""
    total, items = data_service.query_projects(
        priority_tier=priority_tier,
        min_vpi=min_vpi,
        max_vpi=max_vpi,
        mp_id=mp_id,
        vendor_id=vendor_id,
        category=category,
        syndicate_id=syndicate_id,
        is_split_work=is_split_work,
        search_query=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_desc=sort_desc,
    )
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "items": items,
    }


@router.get("/{project_id}", response_model=ProjectDossier)
def get_project_dossier(project_id: str):
    """Retrieves full 360-degree forensic dossier and root-cause explainability trail for a project."""
    dossier = data_service.get_project_dossier(project_id)
    if not dossier:
        raise HTTPException(
            status_code=404,
            detail=f"Project '{project_id}' not found in MPLADS master database.",
        )
    return dossier

