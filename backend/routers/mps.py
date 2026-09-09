"""
MPs Concentration & Favoritism REST API Router
Profiles political capital allocation, HHI concentration, and vendor favoritism.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import MPProfile
from backend.services.data_service import data_service

router = APIRouter(prefix="/mps", tags=["MPs & Favoritism"])


@router.get("", response_model=List[MPProfile])
def list_mps(
    sort_by: str = Query("master_score", description="Sort by: master_score, allocation_risk, projects, funds, vpi"),
    sort_desc: bool = Query(True, description="Sort descending if true"),
    limit: int = Query(100, ge=1, le=200, description="Number of MPs to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """Retrieves all 100 MPs with HHI concentration and political favoritism vigilance scores."""
    return data_service.get_mps(
        sort_by=sort_by, sort_desc=sort_desc, limit=limit, offset=offset
    )


@router.get("/{mp_id}", response_model=Dict[str, Any])
def get_mp_detail(mp_id: str):
    """Retrieves comprehensive MP allocation dossier including top vendor beneficiaries and risk flags."""
    detail = data_service.get_mp_detail(mp_id)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"MP '{mp_id}' not found.",
        )
    return detail

