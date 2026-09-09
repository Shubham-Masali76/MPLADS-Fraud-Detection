"""
Graph Subgraph Extractor Service
Extracts dynamic 1-hop and 2-hop ego-networks tailored for Cytoscape.js visualization.
"""

from typing import Any, Dict, List, Set
from backend.services.data_service import data_service


class GraphService:
    """
    Constructs localized subgraphs around projects, contractors, MPs, and syndicates
    for real-time visual inspection on the frontend.
    """

    def __init__(self):
        self.data_svc = data_service

    def get_subgraph(self, entity_type: str, entity_id: str, depth: int = 2) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extracts an ego-subgraph around any entity.
        Supported entity_types: 'project', 'vendor', 'mp', 'syndicate'.
        """
        if not self.data_svc.is_loaded:
            self.data_svc.load_data()

        entity_type_norm = entity_type.strip().lower()
        entity_id_norm = entity_id.strip()

        nodes: Dict[str, Dict[str, Any]] = {}
        edges: List[Dict[str, Any]] = []
        edge_ids: Set[str] = set()

        def add_node(
            nid: str,
            label: str,
            ntype: str,
            risk_tier: str = "LOW",
            risk_score: float = 0.0,
            extra: Dict[str, Any] = None,
        ):
            if nid not in nodes:
                data = {
                    "id": nid,
                    "label": label,
                    "type": ntype,
                    "risk_tier": risk_tier,
                    "risk_score": round(risk_score, 1),
                }
                if extra:
                    data.update(extra)
                nodes[nid] = {"data": data}

        def add_edge(src: str, tgt: str, label: str, weight: float = 1.0, extra: Dict[str, Any] = None):
            eid = f"{src}->{tgt}:{label}"
            if eid not in edge_ids:
                edge_ids.add(eid)
                data = {
                    "id": eid,
                    "source": src,
                    "target": tgt,
                    "label": label,
                    "weight": weight,
                }
                if extra:
                    data.update(extra)
                edges.append({"data": data})

        if entity_type_norm == "project":
            p = self.data_svc.projects_dict.get(entity_id_norm)
            if not p:
                return {"nodes": [], "edges": []}

            vpi = float(p.get("Vigilance_Priority_Index", 0.0))
            tier = str(p.get("Priority_Tier", "LOW"))
            pid = str(p["Project_ID"])

            # 1. Root Project Node
            add_node(
                pid,
                f"{pid} ({vpi:.1f})",
                "project",
                risk_tier=tier,
                risk_score=vpi,
                extra={"category": p.get("Project_Category"), "amount": p.get("Sanctioned_Amount")},
            )

            # 2. MP Node & Edge
            mp_id = str(p.get("MP_ID"))
            if mp_id:
                mp_info = self.data_svc.mps_dict.get(mp_id, {})
                mp_score = float(mp_info.get("MP_Vigilance_Master_Score", 0.0))
                add_node(mp_id, f"MP: {mp_id}", "mp", risk_tier="HIGH" if mp_score > 50 else "LOW", risk_score=mp_score)
                add_edge(mp_id, pid, "SANCTIONED", weight=2.0)

            # 3. Location / District Node
            constituency = str(p.get("Constituency", ""))
            if constituency:
                dist_id = f"DIST_{constituency}"
                add_node(dist_id, constituency, "district", risk_tier="LOW")
                add_edge(pid, dist_id, "LOCATED_IN", weight=1.0)

            # 4. Contractor Node
            vendor_id = str(p.get("Contractor_ID"))
            if vendor_id:
                v_stats = self.data_svc.vendors_dict.get(vendor_id, {})
                v_gov = float(v_stats.get("Vendor_Governance_Score", 0.0))
                is_ringleader = bool(p.get("Is_Syndicate_Ringleader", False))
                syn_id = str(p.get("Syndicate_ID", "NONE"))

                v_label = f"Vendor: {vendor_id}"
                if is_ringleader:
                    v_label += " [RINGLEADER]"

                v_tier = "CRITICAL" if is_ringleader else ("HIGH" if v_gov > 50 else "LOW")
                add_node(
                    vendor_id,
                    v_label,
                    "vendor",
                    risk_tier=v_tier,
                    risk_score=v_gov,
                    extra={"is_ringleader": is_ringleader, "syndicate_id": syn_id},
                )
                add_edge(pid, vendor_id, "AWARDED_TO", weight=2.0)

                # 5. Expand 2-Hop Syndicate Network if vendor belongs to cartel
                if syn_id != "NONE" and depth >= 2:
                    syn_info = self.data_svc.syndicates_dict.get(syn_id, {})
                    bank_acc = syn_info.get("Bank_Account_ID")
                    if bank_acc:
                        add_node(bank_acc, f"Bank Acc: {bank_acc}", "bank_account", risk_tier="CRITICAL", risk_score=95.0)
                        add_edge(vendor_id, bank_acc, "DEPOSITS_TO", weight=3.0)

                        # Add up to 5 sister syndicate vendors
                        for mv in syn_info.get("Member_Vendors", [])[:6]:
                            m_vid = mv.get("Contractor_ID")
                            if m_vid and m_vid != vendor_id:
                                m_is_ring = (m_vid == syn_info.get("Primary_Ringleader_Vendor_ID"))
                                m_tier = "CRITICAL" if m_is_ring else "HIGH"
                                m_label = f"{m_vid} [RINGLEADER]" if m_is_ring else m_vid
                                add_node(m_vid, m_label, "vendor", risk_tier=m_tier, risk_score=80.0, extra={"is_ringleader": m_is_ring})
                                add_edge(m_vid, bank_acc, "DEPOSITS_TO", weight=2.0)

        elif entity_type_norm == "syndicate":
            syn_info = self.data_svc.syndicates_dict.get(entity_id_norm.upper())
            if not syn_info:
                return {"nodes": [], "edges": []}

            bank_acc = syn_info.get("Bank_Account_ID", "UNKNOWN_BANK")
            add_node(bank_acc, f"Shared Bank: {bank_acc}", "bank_account", risk_tier="CRITICAL", risk_score=95.0)

            ringleader_id = syn_info.get("Primary_Ringleader_Vendor_ID")
            members = syn_info.get("Member_Vendors", [])

            for mv in members:
                m_vid = mv.get("Contractor_ID")
                if not m_vid:
                    continue
                is_ring = (m_vid == ringleader_id)
                m_tier = "CRITICAL" if is_ring else "HIGH"
                m_label = f"{m_vid} [RINGLEADER]" if is_ring else m_vid
                add_node(m_vid, m_label, "vendor", risk_tier=m_tier, risk_score=85.0 if is_ring else 70.0, extra={"is_ringleader": is_ring})
                add_edge(m_vid, bank_acc, "SHARED_ACCOUNT", weight=3.0)

                # Connect projects won by this member
                if depth >= 2:
                    pids = self.data_svc.index_vendor.get(m_vid, [])[:3]
                    for pid in pids:
                        p = self.data_svc.projects_dict.get(pid, {})
                        vpi = float(p.get("Vigilance_Priority_Index", 0.0))
                        tier = str(p.get("Priority_Tier", "LOW"))
                        add_node(pid, f"{pid} ({vpi:.1f})", "project", risk_tier=tier, risk_score=vpi)
                        add_edge(pid, m_vid, "AWARDED_TO", weight=1.5)

        elif entity_type_norm == "vendor":
            v_id = entity_id_norm
            v_stats = self.data_svc.vendors_dict.get(v_id, {})
            syn_id = str(v_stats.get("Syndicate_ID", "NONE"))
            is_ring = bool(v_stats.get("Is_Ringleader", False))
            gov_score = float(v_stats.get("Vendor_Governance_Score", 0.0))

            v_label = f"{v_id} [RINGLEADER]" if is_ring else v_id
            v_tier = "CRITICAL" if is_ring else ("HIGH" if gov_score > 50 else "LOW")
            add_node(v_id, v_label, "vendor", risk_tier=v_tier, risk_score=gov_score, extra={"is_ringleader": is_ring})

            if syn_id != "NONE":
                syn_info = self.data_svc.syndicates_dict.get(syn_id, {})
                bank_acc = syn_info.get("Bank_Account_ID")
                if bank_acc:
                    add_node(bank_acc, f"Bank Acc: {bank_acc}", "bank_account", risk_tier="CRITICAL", risk_score=95.0)
                    add_edge(v_id, bank_acc, "DEPOSITS_TO", weight=3.0)

            # Connected projects
            pids = self.data_svc.index_vendor.get(v_id, [])[:10]
            for pid in pids:
                p = self.data_svc.projects_dict.get(pid, {})
                vpi = float(p.get("Vigilance_Priority_Index", 0.0))
                tier = str(p.get("Priority_Tier", "LOW"))
                add_node(pid, f"{pid} ({vpi:.1f})", "project", risk_tier=tier, risk_score=vpi)
                add_edge(pid, v_id, "AWARDED_TO", weight=2.0)

                mp_id = p.get("MP_ID")
                if mp_id and depth >= 2:
                    add_node(mp_id, f"MP: {mp_id}", "mp", risk_tier="LOW")
                    add_edge(mp_id, pid, "SANCTIONED", weight=1.0)

        elif entity_type_norm == "mp":
            mp_id = entity_id_norm.upper()
            mp_info = self.data_svc.mps_dict.get(mp_id, {})
            mp_score = float(mp_info.get("MP_Vigilance_Master_Score", 0.0))
            add_node(mp_id, f"MP: {mp_id}", "mp", risk_tier="HIGH" if mp_score > 50 else "LOW", risk_score=mp_score)

            # Connect top projects
            pids = self.data_svc.index_mp.get(mp_id, [])[:10]
            for pid in pids:
                p = self.data_svc.projects_dict.get(pid, {})
                vpi = float(p.get("Vigilance_Priority_Index", 0.0))
                tier = str(p.get("Priority_Tier", "LOW"))
                add_node(pid, f"{pid} ({vpi:.1f})", "project", risk_tier=tier, risk_score=vpi)
                add_edge(mp_id, pid, "SANCTIONED", weight=2.0)

                vid = p.get("Contractor_ID")
                if vid and depth >= 2:
                    is_ring = bool(p.get("Is_Syndicate_Ringleader", False))
                    add_node(vid, f"{vid} [RINGLEADER]" if is_ring else vid, "vendor", risk_tier="CRITICAL" if is_ring else "LOW")
                    add_edge(pid, vid, "AWARDED_TO", weight=1.5)

        return {"nodes": list(nodes.values()), "edges": edges}


# Global singleton instance
graph_service = GraphService()

