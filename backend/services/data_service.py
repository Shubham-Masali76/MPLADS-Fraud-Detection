"""
Data Service Layer
Provides in-memory indexed caching, high-speed filtering, and forensic dossier aggregation.
"""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd

from backend.config import DATA_DIR, GRAPH_OUTPUTS_DIR

logger = logging.getLogger("mplads.data_service")


class DataService:
    """
    High-performance in-memory data store for the MPLADS Fraud Intelligence API.
    Pre-indexes 100,000 projects, 100 syndicates, 100 MPs, and 45 split clusters.
    """

    def __init__(self):
        self.is_loaded = False
        self.projects_df: Optional[pd.DataFrame] = None
        self.projects_dict: Dict[str, Dict[str, Any]] = {}

        # Inverted index lookups
        self.index_priority_tier: Dict[str, List[str]] = {
            "CRITICAL": [],
            "HIGH": [],
            "MEDIUM": [],
            "LOW": [],
        }
        self.index_mp: Dict[str, List[str]] = {}
        self.index_vendor: Dict[str, List[str]] = {}
        self.index_category: Dict[str, List[str]] = {}
        self.index_syndicate: Dict[str, List[str]] = {}

        # Auxiliary data collections
        self.syndicates_list: List[Dict[str, Any]] = []
        self.syndicates_dict: Dict[str, Dict[str, Any]] = {}
        self.mps_list: List[Dict[str, Any]] = []
        self.mps_dict: Dict[str, Dict[str, Any]] = {}
        self.splitting_list: List[Dict[str, Any]] = []
        self.splitting_dict: Dict[str, Dict[str, Any]] = {}
        self.vendors_dict: Dict[str, Dict[str, Any]] = {}
        self.utilization_dict: Dict[str, Dict[str, Any]] = {}
        self.photo_dict: Dict[str, Dict[str, Any]] = {}

        # System KPIs
        self.overview_stats: Dict[str, Any] = {}

    def load_data(self) -> None:
        """Loads and pre-indexes all relational datasets and forensic artifacts."""
        if self.is_loaded:
            return

        logger.info("Initializing MPLADS Data Service in-memory indexing...")

        # 1. Load Master Project Risk Dataset
        risk_csv = GRAPH_OUTPUTS_DIR / "comprehensive_project_risk.csv"
        if not risk_csv.exists():
            raise FileNotFoundError(f"Master project risk file missing: {risk_csv}")

        risk_df = pd.read_csv(risk_csv)

        # 2. Join additional fields from raw data/projects.csv
        raw_projects_csv = DATA_DIR / "projects.csv"
        if raw_projects_csv.exists():
            raw_p_df = pd.read_csv(
                raw_projects_csv,
                usecols=[
                    "Project_ID",
                    "Project_Description",
                    "Sanction_Date",
                    "Expected_Completion_Date",
                    "Actual_Completion_Date",
                    "Project_Status",
                ],
            )
            merged_df = risk_df.merge(raw_p_df, on="Project_ID", how="left")
        else:
            merged_df = risk_df

        self.projects_df = merged_df

        # Build in-memory project dictionary and inverted indices
        for row in merged_df.to_dict(orient="records"):
            pid = str(row["Project_ID"])
            self.projects_dict[pid] = row

            tier = str(row.get("Priority_Tier", "LOW")).upper()
            if tier in self.index_priority_tier:
                self.index_priority_tier[tier].append(pid)

            mp = str(row.get("MP_ID", ""))
            self.index_mp.setdefault(mp, []).append(pid)

            vnd = str(row.get("Contractor_ID", ""))
            self.index_vendor.setdefault(vnd, []).append(pid)

            cat = str(row.get("Project_Category", ""))
            self.index_category.setdefault(cat, []).append(pid)

            syn = str(row.get("Syndicate_ID", "NONE"))
            if syn and syn != "NONE":
                self.index_syndicate.setdefault(syn, []).append(pid)

        # 3. Load Auxiliary Vendor Data & Map Syndicate Membership
        self.syndicate_members: Dict[str, List[Dict[str, Any]]] = {}
        self.syndicate_ringleaders: Dict[str, str] = {}

        vendor_csv = GRAPH_OUTPUTS_DIR / "comprehensive_vendor_risk.csv"
        if vendor_csv.exists():
            v_df = pd.read_csv(vendor_csv)
            for row in v_df.to_dict(orient="records"):
                vid = str(row["Contractor_ID"])
                self.vendors_dict[vid] = row
                syn_id = str(row.get("Syndicate_ID", "NONE"))
                if syn_id and syn_id != "NONE":
                    self.syndicate_members.setdefault(syn_id, []).append(row)
                    if bool(row.get("Is_Ringleader", False)):
                        self.syndicate_ringleaders[syn_id] = vid

        # 4. Load Auxiliary MP Data
        mp_csv = GRAPH_OUTPUTS_DIR / "comprehensive_mp_risk.csv"
        if mp_csv.exists():
            mp_df = pd.read_csv(mp_csv)
            self.mps_list = mp_df.to_dict(orient="records")
            for row in self.mps_list:
                self.mps_dict[str(row["MP_ID"])] = row

        # 5. Load Syndicates
        syn_json = GRAPH_OUTPUTS_DIR / "syndicate_summary.json"
        if syn_json.exists():
            with open(syn_json, "r", encoding="utf-8") as f:
                self.syndicates_list = json.load(f)
            for s in self.syndicates_list:
                self.syndicates_dict[s["Syndicate_ID"]] = s

        # 6. Load Work Splitting Clusters
        split_json = GRAPH_OUTPUTS_DIR / "work_splitting_summary.json"
        if split_json.exists():
            with open(split_json, "r", encoding="utf-8") as f:
                self.splitting_list = json.load(f)
            for c in self.splitting_list:
                self.splitting_dict[c["Cluster_ID"]] = c

        # 7. Load Utilization & Photo Evidence Details
        util_csv = DATA_DIR / "utilization.csv"
        if util_csv.exists():
            u_df = pd.read_csv(util_csv)
            for row in u_df.to_dict(orient="records"):
                self.utilization_dict[str(row["Project_ID"])] = row

        photo_csv = DATA_DIR / "photo_evidence.csv"
        if photo_csv.exists():
            ph_df = pd.read_csv(photo_csv)
            for row in ph_df.to_dict(orient="records"):
                self.photo_dict[str(row["Project_ID"])] = row

        # 8. Compute Master Overview Stats
        critical_cnt = len(self.index_priority_tier.get("CRITICAL", []))
        high_cnt = len(self.index_priority_tier.get("HIGH", []))
        med_cnt = len(self.index_priority_tier.get("MEDIUM", []))
        low_cnt = len(self.index_priority_tier.get("LOW", []))
        total_funds = float(merged_df["Sanctioned_Amount"].sum())
        split_funds = sum(c.get("Total_Split_Amount_INR", 0) for c in self.splitting_list)

        self.overview_stats = {
            "total_projects": len(merged_df),
            "total_sanctioned_funds_inr": total_funds,
            "critical_priority_count": critical_cnt,
            "high_priority_count": high_cnt,
            "medium_priority_count": med_cnt,
            "low_priority_count": low_cnt,
            "total_syndicates": len(self.syndicates_list),
            "total_syndicate_vendors": sum(s.get("Syndicate_Size", 0) for s in self.syndicates_list),
            "total_split_clusters": len(self.splitting_list),
            "total_split_funds_inr": split_funds,
            "total_mps_monitored": len(self.mps_list),
        }

        self.is_loaded = True
        logger.info(
            f"MPLADS Data Service initialized successfully: "
            f"{len(self.projects_dict):,} projects, {len(self.syndicates_list)} syndicates, "
            f"{len(self.mps_list)} MPs, {len(self.splitting_list)} split clusters."
        )

    def query_projects(
        self,
        priority_tier: Optional[str] = None,
        min_vpi: Optional[float] = None,
        max_vpi: Optional[float] = None,
        mp_id: Optional[str] = None,
        vendor_id: Optional[str] = None,
        category: Optional[str] = None,
        syndicate_id: Optional[str] = None,
        is_split_work: Optional[bool] = None,
        search_query: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
        sort_by: str = "vpi",
        sort_desc: bool = True,
    ) -> Tuple[int, List[Dict[str, Any]]]:
        """High-performance multi-criteria search and pagination over 100k projects."""
        if not self.is_loaded:
            self.load_data()

        # Narrow candidate pool using inverted indexes where available
        candidate_ids = None

        if priority_tier:
            tier_key = priority_tier.strip().upper()
            candidate_ids = set(self.index_priority_tier.get(tier_key, []))

        if mp_id:
            mp_set = set(self.index_mp.get(mp_id.strip(), []))
            candidate_ids = mp_set if candidate_ids is None else candidate_ids.intersection(mp_set)

        if vendor_id:
            vnd_set = set(self.index_vendor.get(vendor_id.strip(), []))
            candidate_ids = vnd_set if candidate_ids is None else candidate_ids.intersection(vnd_set)

        if category:
            cat_set = set(self.index_category.get(category.strip(), []))
            candidate_ids = cat_set if candidate_ids is None else candidate_ids.intersection(cat_set)

        if syndicate_id:
            syn_set = set(self.index_syndicate.get(syndicate_id.strip(), []))
            candidate_ids = syn_set if candidate_ids is None else candidate_ids.intersection(syn_set)

        # Filter candidates
        pool = (
            [self.projects_dict[pid] for pid in candidate_ids if pid in self.projects_dict]
            if candidate_ids is not None
            else list(self.projects_dict.values())
        )

        filtered = []
        for p in pool:
            vpi = float(p.get("Vigilance_Priority_Index", 0.0))
            if min_vpi is not None and vpi < min_vpi:
                continue
            if max_vpi is not None and vpi > max_vpi:
                continue

            if is_split_work is not None:
                p_split = bool(p.get("Is_Split_Work", False))
                if p_split != is_split_work:
                    continue

            if search_query:
                sq = search_query.lower()
                pid = str(p.get("Project_ID", "")).lower()
                desc = str(p.get("Project_Description", "")).lower()
                loc = str(p.get("Constituency", "")).lower()
                if sq not in pid and sq not in desc and sq not in loc:
                    continue

            filtered.append(p)

        # Sorting
        sort_map = {
            "vpi": "Vigilance_Priority_Index",
            "amount": "Sanctioned_Amount",
            "ml_anomaly": "Score_ML_Anomaly",
            "collusion": "Score_Syndicate_Collusion",
            "project_id": "Project_ID",
        }
        sort_col = sort_map.get(sort_by.lower(), "Vigilance_Priority_Index")

        filtered.sort(
            key=lambda x: (x.get(sort_col) is not None, x.get(sort_col, 0)),
            reverse=sort_desc,
        )

        total = len(filtered)
        start = (page - 1) * limit
        end = start + limit
        page_items = filtered[start:end]

        # Map to summary schema
        summaries = []
        for row in page_items:
            summaries.append(
                {
                    "project_id": str(row["Project_ID"]),
                    "mp_id": str(row.get("MP_ID", "")),
                    "contractor_id": str(row.get("Contractor_ID", "")),
                    "sanctioned_amount": float(row.get("Sanctioned_Amount", 0.0)),
                    "project_category": str(row.get("Project_Category", "")),
                    "constituency": str(row.get("Constituency", "")),
                    "state": str(row.get("State", "")),
                    "vpi": float(row.get("Vigilance_Priority_Index", 0.0)),
                    "priority_tier": str(row.get("Priority_Tier", "LOW")),
                    "syndicate_id": str(row.get("Syndicate_ID", "NONE")),
                    "is_ringleader": bool(row.get("Is_Syndicate_Ringleader", False)),
                    "is_split_work": bool(row.get("Is_Split_Work", False)),
                    "forensic_explanation": str(row.get("Forensic_Explanation", "")),
                }
            )

        return total, summaries

    def get_project_dossier(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a 360-degree forensic dossier for a project."""
        if not self.is_loaded:
            self.load_data()

        row = self.projects_dict.get(project_id.strip())
        if not row:
            return None

        # Build scores dict
        scores = {
            "ml_anomaly": float(row.get("Score_ML_Anomaly", 0.0)),
            "syndicate_collusion": float(row.get("Score_Syndicate_Collusion", 0.0)),
            "mp_concentration": float(row.get("Score_MP_Concentration", 0.0)),
            "work_splitting": float(row.get("Score_Work_Splitting", 0.0)),
            "network_centrality": float(row.get("Score_Network_Centrality", 0.0)),
            "vpi": float(row.get("Vigilance_Priority_Index", 0.0)),
        }

        # Parse explainability trail into bullet points
        raw_exp = str(row.get("Forensic_Explanation", ""))
        audit_trail = [e.strip() for e in raw_exp.split(";") if e.strip()]

        # Syndicate info if present
        syn_id = str(row.get("Syndicate_ID", "NONE"))
        syn_info = None
        if syn_id != "NONE" and syn_id in self.syndicates_dict:
            syn_info = self.syndicates_dict[syn_id]

        util_info = self.utilization_dict.get(project_id)
        photo_info = self.photo_dict.get(project_id)

        return {
            "project_id": str(row["Project_ID"]),
            "mp_id": str(row.get("MP_ID", "")),
            "contractor_id": str(row.get("Contractor_ID", "")),
            "sanctioned_amount": float(row.get("Sanctioned_Amount", 0.0)),
            "project_category": str(row.get("Project_Category", "")),
            "project_description": row.get("Project_Description"),
            "constituency": str(row.get("Constituency", "")),
            "state": str(row.get("State", "")),
            "sanction_date": row.get("Sanction_Date"),
            "expected_completion_date": row.get("Expected_Completion_Date"),
            "actual_completion_date": row.get("Actual_Completion_Date"),
            "project_status": row.get("Project_Status"),
            "scores": scores,
            "priority_tier": str(row.get("Priority_Tier", "LOW")),
            "forensic_explanation": raw_exp,
            "syndicate_info": syn_info,
            "utilization_info": util_info,
            "photo_evidence_info": photo_info,
            "audit_trail": audit_trail,
        }

    def get_syndicates(
        self,
        sort_by: str = "funds",
        sort_desc: bool = True,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Returns sorted list of shell contractor syndicates."""
        if not self.is_loaded:
            self.load_data()

        sort_key_map = {
            "funds": "Total_Syndicate_Funds_INR",
            "size": "Syndicate_Size",
            "projects": "Total_Projects",
            "risk": "Collusion_Risk_Score",
        }
        key = sort_key_map.get(sort_by.lower(), "Total_Syndicate_Funds_INR")

        sorted_list = sorted(
            self.syndicates_list, key=lambda x: x.get(key, 0), reverse=sort_desc
        )

        res = []
        for s in sorted_list[offset : offset + limit]:
            syn_id = s["Syndicate_ID"]
            ringleader = self.syndicate_ringleaders.get(syn_id)
            collusion_score = float(
                s.get("Syndicate_Collusion_Risk", s.get("Collusion_Risk_Score", 90.0))
            )
            res.append(
                {
                    "syndicate_id": syn_id,
                    "bank_account_id": s["Bank_Account_ID"],
                    "syndicate_size": s["Syndicate_Size"],
                    "total_projects": s.get("Total_Projects", 0),
                    "total_funds_inr": float(s.get("Total_Syndicate_Funds_INR", 0)),
                    "collusion_risk_score": collusion_score,
                    "ringleader_vendor_id": ringleader,
                    "state_count": s.get("State_Count"),
                    "district_count": s.get("District_Count"),
                }
            )
        return res

    def get_syndicate_detail(self, syndicate_id: str) -> Optional[Dict[str, Any]]:
        """Returns detailed dossier for a shell contractor syndicate."""
        if not self.is_loaded:
            self.load_data()

        syn_id_norm = syndicate_id.strip().upper()
        syn = self.syndicates_dict.get(syn_id_norm)
        if not syn:
            return None

        ringleader_id = self.syndicate_ringleaders.get(syn_id_norm)
        collusion_score = float(
            syn.get("Syndicate_Collusion_Risk", syn.get("Collusion_Risk_Score", 90.0))
        )

        # Collect members with their individual governance stats
        members = []
        member_rows = self.syndicate_members.get(syn_id_norm, [])
        for v in member_rows:
            v_id = str(v["Contractor_ID"])
            members.append(
                {
                    "contractor_id": v_id,
                    "is_ringleader": (v_id == ringleader_id),
                    "project_count": int(v.get("Project_Count", 0)),
                    "total_sanctioned_inr": float(v.get("Total_Sanctioned_INR", 0.0)),
                    "governance_score": float(v.get("Vendor_Governance_Score", 0.0)),
                }
            )

        # Sort members: ringleader first, then by project count descending
        members.sort(key=lambda x: (x["is_ringleader"], x["project_count"]), reverse=True)

        # Find all projects won by this syndicate
        awarded_projects = self.index_syndicate.get(syn_id_norm, [])

        return {
            "syndicate_id": syn["Syndicate_ID"],
            "bank_account_id": syn["Bank_Account_ID"],
            "syndicate_size": syn["Syndicate_Size"],
            "total_projects": syn.get("Total_Projects", len(awarded_projects)),
            "total_funds_inr": float(syn.get("Total_Syndicate_Funds_INR", 0)),
            "collusion_risk_score": collusion_score,
            "ringleader_vendor_id": ringleader_id,
            "members": members,
            "awarded_projects": awarded_projects,
        }

    def get_mps(
        self,
        sort_by: str = "master_score",
        sort_desc: bool = True,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Returns list of all 100 MPs with concentration and favoritism scores."""
        if not self.is_loaded:
            self.load_data()

        sort_map = {
            "master_score": "MP_Vigilance_Master_Score",
            "allocation_risk": "Allocation_Risk_Score",
            "projects": "Total_Projects",
            "funds": "Total_Allocated_INR",
            "vpi": "Avg_Project_VPI",
        }
        key = sort_map.get(sort_by.lower(), "MP_Vigilance_Master_Score")

        sorted_mps = sorted(self.mps_list, key=lambda x: x.get(key, 0), reverse=sort_desc)

        res = []
        for m in sorted_mps[offset : offset + limit]:
            res.append(
                {
                    "mp_id": str(m["MP_ID"]),
                    "total_projects": int(m.get("Total_Projects", 0)),
                    "total_allocated_inr": float(m.get("Total_Allocated_INR", 0)),
                    "avg_project_vpi": float(m.get("Avg_Project_VPI", 0)),
                    "critical_projects": int(m.get("Critical_Projects", 0)),
                    "high_projects": int(m.get("High_Projects", 0)),
                    "syndicate_projects": int(m.get("Syndicate_Projects", 0)),
                    "split_projects": int(m.get("Split_Projects", 0)),
                    "allocation_risk_score": float(m.get("Allocation_Risk_Score", 0)),
                    "mp_vigilance_master_score": float(m.get("MP_Vigilance_Master_Score", 0)),
                }
            )
        return res

    def get_mp_detail(self, mp_id: str) -> Optional[Dict[str, Any]]:
        """Returns comprehensive allocation and concentration dossier for an MP."""
        if not self.is_loaded:
            self.load_data()

        mp_info = self.mps_dict.get(mp_id.strip().upper())
        if not mp_info:
            return None

        # Also get top vendor recipients for this MP
        mp_projects = self.index_mp.get(mp_id, [])
        vendor_tallies: Dict[str, Dict[str, Any]] = {}
        for pid in mp_projects:
            p = self.projects_dict.get(pid, {})
            vid = p.get("Contractor_ID")
            if not vid:
                continue
            amt = float(p.get("Sanctioned_Amount", 0.0))
            if vid not in vendor_tallies:
                vendor_tallies[vid] = {
                    "contractor_id": vid,
                    "project_count": 0,
                    "total_amount_inr": 0.0,
                    "syndicate_id": p.get("Syndicate_ID", "NONE"),
                }
            vendor_tallies[vid]["project_count"] += 1
            vendor_tallies[vid]["total_amount_inr"] += amt

        top_vendors = sorted(
            vendor_tallies.values(), key=lambda x: x["total_amount_inr"], reverse=True
        )[:10]

        return {
            "mp_id": str(mp_info["MP_ID"]),
            "total_projects": int(mp_info.get("Total_Projects", 0)),
            "total_allocated_inr": float(mp_info.get("Total_Allocated_INR", 0)),
            "avg_project_vpi": float(mp_info.get("Avg_Project_VPI", 0)),
            "critical_projects": int(mp_info.get("Critical_Projects", 0)),
            "high_projects": int(mp_info.get("High_Projects", 0)),
            "syndicate_projects": int(mp_info.get("Syndicate_Projects", 0)),
            "split_projects": int(mp_info.get("Split_Projects", 0)),
            "allocation_risk_score": float(mp_info.get("Allocation_Risk_Score", 0)),
            "mp_vigilance_master_score": float(mp_info.get("MP_Vigilance_Master_Score", 0)),
            "top_vendors": top_vendors,
            "awarded_project_ids": mp_projects,
        }

    def get_work_splitting_clusters(
        self, evades_gfr_only: bool = False, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Returns list of tender-slicing work-splitting clusters."""
        if not self.is_loaded:
            self.load_data()

        pool = self.splitting_list
        if evades_gfr_only:
            pool = [
                c
                for c in pool
                if bool(c.get("Threshold_Evasion_Flag", c.get("Evades_GFR_Threshold", False)))
            ]

        res = []
        for c in pool[offset : offset + limit]:
            evades_flag = bool(
                c.get("Threshold_Evasion_Flag", c.get("Evades_GFR_Threshold", False))
            )
            span = int(c.get("Span_Days", c.get("Timespan_Days", 0)))
            vendors = c.get("Vendors_Involved", c.get("Contractor_IDs", []))
            res.append(
                {
                    "cluster_id": c["Cluster_ID"],
                    "effective_entity_id": c["Effective_Entity_ID"],
                    "entity_type": c["Entity_Type"],
                    "mp_id": c["MP_ID"],
                    "project_category": c["Project_Category"],
                    "project_count": c["Project_Count"],
                    "total_split_amount_inr": float(c["Total_Split_Amount_INR"]),
                    "average_amount_inr": float(c["Average_Amount_INR"]),
                    "evades_gfr_threshold": evades_flag,
                    "timespan_days": span,
                    "project_ids": c.get("Project_IDs", []),
                    "contractor_ids": vendors,
                }
            )
        return res

    def get_work_splitting_detail(self, cluster_id: str) -> Optional[Dict[str, Any]]:
        """Returns details for a specific tender slicing cluster."""
        if not self.is_loaded:
            self.load_data()

        c = self.splitting_dict.get(cluster_id.strip().upper())
        if not c:
            return None

        # Fetch project summaries for the cluster
        projects = []
        for pid in c.get("Project_IDs", []):
            p = self.projects_dict.get(pid)
            if p:
                projects.append(
                    {
                        "project_id": pid,
                        "sanctioned_amount": float(p.get("Sanctioned_Amount", 0.0)),
                        "sanction_date": p.get("Sanction_Date"),
                        "contractor_id": p.get("Contractor_ID"),
                        "syndicate_id": p.get("Syndicate_ID", "NONE"),
                        "vpi": float(p.get("Vigilance_Priority_Index", 0.0)),
                    }
                )

        detail = dict(c)
        detail["projects"] = projects
        return detail

    def get_overview_stats(self) -> Dict[str, Any]:
        """Returns master system KPIs for the auditor dashboard."""
        if not self.is_loaded:
            self.load_data()
        return self.overview_stats


# Global singleton instance
data_service = DataService()
