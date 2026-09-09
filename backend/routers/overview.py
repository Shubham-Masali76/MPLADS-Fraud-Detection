"""
Overview & Analytics Dashboard REST API Router
Provides high-level system KPIs, risk distributions, and fund tallies.
"""

from fastapi import APIRouter

from backend.models.schemas import OverviewStats
from backend.services.data_service import data_service

router = APIRouter(prefix="/overview", tags=["System Overview"])


@router.get("", response_model=OverviewStats)
def get_overview_kpis():
    """Returns top-level executive KPIs, fraud detection counts, and vigilance risk breakdowns."""
    return data_service.get_overview_stats()

