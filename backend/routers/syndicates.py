"""
Syndicates REST API Router
Provides shell contractor cartel discovery and ringleader profiling.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import SyndicateSummary, SyndicateDetail
from backend.services.data_service import data_service

router = APIRouter(prefix="/syndicates", tags=["Syndicates"])


@router.get("", response_model=List[SyndicateSummary])
def list_syndicates(
    sort_by: str = Query("funds", description="Sort by: funds, size, projects, risk"),
    sort_desc: bool = Query(True, description="Sort descending if true"),
    limit: int = Query(100, ge=1, le=200, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """Retrieves all 100 shell contractor syndicates operating under shared bank accounts."""
    return data_service.get_syndicates(
        sort_by=sort_by, sort_desc=sort_desc, limit=limit, offset=offset
    )


@router.get("/{syndicate_id}", response_model=SyndicateDetail)
def get_syndicate_detail(syndicate_id: str):
    """Retrieves detailed cartel profile, member contractors, ringleader, and awarded contracts."""
    detail = data_service.get_syndicate_detail(syndicate_id)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Syndicate '{syndicate_id}' not found.",
        )
    return detail

