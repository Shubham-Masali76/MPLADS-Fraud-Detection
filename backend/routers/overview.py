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

@router.get("/district-risk")
def get_district_risk():
    """Dynamically aggregates risk by district from the loaded projects data."""
    if not data_service.is_loaded:
        data_service.load_data()
        
    districts = {}
    for p in data_service.projects_dict.values():
        d = p.get("Constituency", "Unknown")
        s = p.get("State", "Unknown")
        key = f"{d}-{s}"
        if key not in districts:
            districts[key] = {"district": d, "state": s, "critical": 0, "high": 0, "total_funds": 0.0, "vpi_sum": 0.0, "count": 0}
        
        tier = p.get("Priority_Tier", "")
        if tier == "CRITICAL": districts[key]["critical"] += 1
        elif tier == "HIGH": districts[key]["high"] += 1
        
        districts[key]["total_funds"] += float(p.get("Sanctioned_Amount", 0.0))
        districts[key]["vpi_sum"] += float(p.get("Vigilance_Priority_Index", 0.0))
        districts[key]["count"] += 1

    res = []
    for v in districts.values():
        if v["count"] > 0:
            v["avg_vpi"] = round(v["vpi_sum"] / v["count"], 2)
            del v["vpi_sum"]
            del v["count"]
            res.append(v)
            
    # Sort by risk (critical + high) descending
    return sorted(res, key=lambda x: (x["critical"] * 10 + x["high"]), reverse=True)[:20]


@router.get("/category-distribution")
def get_category_distribution():
    """Dynamically aggregates projects by category."""
    if not data_service.is_loaded:
        data_service.load_data()
        
    cats = {}
    for p in data_service.projects_dict.values():
        cat = p.get("Project_Category", "Unknown")
        if cat not in cats:
            cats[cat] = {"category": cat, "total": 0, "high_risk": 0}
            
        cats[cat]["total"] += 1
        tier = p.get("Priority_Tier", "")
        if tier in ["CRITICAL", "HIGH"]:
            cats[cat]["high_risk"] += 1
            
    total_projects = sum(c["total"] for c in cats.values())
    res = []
    for v in cats.values():
        v["percentage"] = round((v["total"] / total_projects) * 100) if total_projects > 0 else 0
        res.append(v)
        
    return sorted(res, key=lambda x: x["total"], reverse=True)


