"""
Work Splitting & Tender Slicing REST API Router
Detects artificial project fragmentation evading the statutory GFR Rs 50 Lakh tender limit.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import WorkSplittingCluster
from backend.services.data_service import data_service

router = APIRouter(prefix="/work-splitting", tags=["Work Splitting"])


@router.get("", response_model=List[WorkSplittingCluster])
def list_work_splitting_clusters(
    evades_gfr_threshold: bool = Query(False, description="Filter for clusters evading the statutory Rs 50 Lakh limit"),
    limit: int = Query(100, ge=1, le=200, description="Number of clusters to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """Retrieves detected tender-slicing work-splitting clusters."""
    return data_service.get_work_splitting_clusters(
        evades_gfr_only=evades_gfr_threshold, limit=limit, offset=offset
    )


@router.get("/{cluster_id}", response_model=Dict[str, Any])
def get_work_splitting_detail(cluster_id: str):
    """Retrieves full cluster breakdown including member projects, amounts, and dates."""
    detail = data_service.get_work_splitting_detail(cluster_id)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Work splitting cluster '{cluster_id}' not found.",
        )
    return detail

