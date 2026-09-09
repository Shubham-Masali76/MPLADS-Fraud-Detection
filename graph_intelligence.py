"""
MPLADS Graph & Network Intelligence Engine
Phase 3 — Task 2: Core Heterogeneous Graph Construction

This module provides the foundational graph intelligence infrastructure that represents
Member of Parliament Local Area Development Scheme (MPLADS) relational records as a
typed, connected heterogeneous graph.

Key Entities (Nodes):
- MP: Member of Parliament allocating public funds.
- PROJECT: Approved civic infrastructure project.
- VENDOR: Commercial contracting agency awarded project execution.
- BANK_ACCOUNT: Commercial bank account receiving disbursed treasury funds.

Key Relationships (Edges):
- MP --[ALLOCATED]--> PROJECT
- PROJECT --[AWARDED_TO]--> VENDOR
- VENDOR --[USES_BANK_ACCOUNT]--> BANK_ACCOUNT

Architecture Design:
- High-performance, dependency-light sparse adjacency representation (pure Python / NumPy).
- Constant-time O(1) node attribute and typed adjacency lookups.
- O(degree) traversal for multi-hop graph walks (MP -> Project -> Vendor -> Bank Account).
- Strict modularity: zero dependencies on Phase 2 ML models or classification logic.
"""

import json
import os
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import numpy as np
import pandas as pd


class MPLADSGraphBuilder:
    """
    Constructs, stores, and manages a typed heterogeneous graph representing MPLADS entities.

    Node Types:
        - "MP": Member of Parliament
        - "PROJECT": Sanctioned public work
        - "VENDOR": Executing contractor
        - "BANK_ACCOUNT": Beneficiary banking account

    Edge Types:
        - "ALLOCATED": (MP) -> (PROJECT)
        - "AWARDED_TO": (PROJECT) -> (VENDOR)
        - "USES_BANK_ACCOUNT": (VENDOR) -> (BANK_ACCOUNT)
    """

    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir

        # Raw relational DataFrames
        self.df_mps: Optional[pd.DataFrame] = None
        self.df_projects: Optional[pd.DataFrame] = None
        self.df_vendors: Optional[pd.DataFrame] = None
        self.df_payments: Optional[pd.DataFrame] = None
        self.df_relationships: Optional[pd.DataFrame] = None

        # Node storage: node_id -> {"type": node_type, "attributes": {...}}
        self.nodes: Dict[str, Dict[str, Any]] = {}

        # Type index: node_type -> set of node_ids
        self.nodes_by_type: Dict[str, Set[str]] = {
            "MP": set(),
            "PROJECT": set(),
            "VENDOR": set(),
            "BANK_ACCOUNT": set(),
        }

        # Directed adjacency mappings:
        # adj_out: source_id -> {edge_type: [(target_id, edge_attr), ...]}
        self.adj_out: Dict[str, Dict[str, List[Tuple[str, Dict[str, Any]]]]] = defaultdict(
            lambda: defaultdict(list)
        )

        # adj_in: target_id -> {edge_type: [(source_id, edge_attr), ...]}
        self.adj_in: Dict[str, Dict[str, List[Tuple[str, Dict[str, Any]]]]] = defaultdict(
            lambda: defaultdict(list)
        )

        # Edge counts by type
        self.edges_by_type: Dict[str, int] = defaultdict(int)
        self.total_edges: int = 0

        # State flags
        self.is_data_loaded: bool = False
        self.is_graph_built: bool = False

        # Benchmarking metrics
        self.benchmark_metrics: Dict[str, float] = {}

    # -----------------------------------------------------------------------
    # 1. Data Ingestion
    # -----------------------------------------------------------------------

    def load_data(self, data_dir: Optional[str] = None) -> "MPLADSGraphBuilder":
        """
        Loads the audited relational CSV tables from the specified data directory.
        Validates the presence of essential relational schema files and primary keys.
        """
        t0 = time.time()
        if data_dir is not None:
            self.data_dir = data_dir

        mp_path = os.path.join(self.data_dir, "mp_allocation.csv")
        projects_path = os.path.join(self.data_dir, "projects.csv")
        vendors_path = os.path.join(self.data_dir, "vendors.csv")
        payments_path = os.path.join(self.data_dir, "payments.csv")
        relationships_path = os.path.join(self.data_dir, "relationships.csv")

        # Validation of core required tables
        for path, name in [
            (mp_path, "mp_allocation.csv"),
            (projects_path, "projects.csv"),
            (vendors_path, "vendors.csv"),
        ]:
            if not os.path.exists(path):
                raise FileNotFoundError(
                    f"Required table '{name}' not found at: {path}. "
                    "Ensure Phase 1 dataset is generated in data/."
                )

        # Load Core Tables
        self.df_mps = pd.read_csv(mp_path)
        self.df_projects = pd.read_csv(projects_path)
        self.df_vendors = pd.read_csv(vendors_path)

        # Validate essential primary and foreign key columns
        self._validate_column_presence(self.df_mps, ["MP_ID", "State", "Constituency", "Allocated_Amount"], "mp_allocation.csv")
        self._validate_column_presence(self.df_projects, ["Project_ID", "MP_ID", "Contractor_ID", "Sanctioned_Amount"], "projects.csv")
        self._validate_column_presence(self.df_vendors, ["Vendor_ID", "Bank_Account_ID", "Vendor_Name"], "vendors.csv")

        # Load Supporting Tables (Payments & Relationships)
        if os.path.exists(payments_path):
            self.df_payments = pd.read_csv(payments_path)
            self._validate_column_presence(self.df_payments, ["Payment_ID", "Project_ID", "Vendor_ID", "Payment_Amount"], "payments.csv")

        if os.path.exists(relationships_path):
            self.df_relationships = pd.read_csv(relationships_path)
            self._validate_column_presence(self.df_relationships, ["Source_ID", "Relationship", "Target_ID"], "relationships.csv")

        self.is_data_loaded = True
        load_time = time.time() - t0
        self.benchmark_metrics["load_time"] = load_time
        return self

    def _validate_column_presence(self, df: pd.DataFrame, required_cols: List[str], table_name: str) -> None:
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise KeyError(
                f"Table '{table_name}' is missing required columns: {missing}. "
                f"Found columns: {list(df.columns)}"
            )

    # -----------------------------------------------------------------------
    # 2. Graph Construction
    # -----------------------------------------------------------------------

    def build_graph(self) -> "MPLADSGraphBuilder":
        """
        Constructs typed nodes and directed edges from the loaded relational tables.
        Uses vectorized batch operations for optimal performance on 100k+ records.
        """
        if not self.is_data_loaded:
            self.load_data()

        t0 = time.time()

        # Reset graph state
        self.nodes.clear()
        for k in self.nodes_by_type:
            self.nodes_by_type[k].clear()
        self.adj_out.clear()
        self.adj_in.clear()
        self.edges_by_type.clear()
        self.total_edges = 0

        # --- A. Construct MP Nodes ---
        for row in self.df_mps.itertuples(index=False):
            mp_id = str(row.MP_ID)
            attrs = {
                "MP_ID": mp_id,
                "State": getattr(row, "State", ""),
                "Constituency": getattr(row, "Constituency", ""),
                "MP_Name": getattr(row, "MP_Name", ""),
                "Allocated_Amount": int(getattr(row, "Allocated_Amount", 0)),
                "Financial_Year": getattr(row, "Financial_Year", ""),
            }
            self.nodes[mp_id] = {"type": "MP", "attributes": attrs}
            self.nodes_by_type["MP"].add(mp_id)

        # --- B. Compute Bank Account Membership & Construct Bank Nodes ---
        # Each vendor belongs to a Bank_Account_ID. We pre-compute member counts.
        bank_vendor_map = defaultdict(list)
        for row in self.df_vendors.itertuples(index=False):
            bank_id = str(row.Bank_Account_ID)
            vendor_id = str(row.Vendor_ID)
            bank_vendor_map[bank_id].append(vendor_id)

        for bank_id, members in bank_vendor_map.items():
            member_count = len(members)
            attrs = {
                "Bank_Account_ID": bank_id,
                "member_count": member_count,
                "is_shared_account": member_count > 1,
            }
            self.nodes[bank_id] = {"type": "BANK_ACCOUNT", "attributes": attrs}
            self.nodes_by_type["BANK_ACCOUNT"].add(bank_id)

        # --- C. Construct Vendor Nodes & Edge 3 (VENDOR -> BANK_ACCOUNT) ---
        for row in self.df_vendors.itertuples(index=False):
            vendor_id = str(row.Vendor_ID)
            bank_id = str(row.Bank_Account_ID)
            attrs = {
                "Vendor_ID": vendor_id,
                "Vendor_Name": getattr(row, "Vendor_Name", ""),
                "Registration_ID": getattr(row, "Registration_ID", ""),
                "State": getattr(row, "State", ""),
                "District": getattr(row, "District", ""),
                "Bank_Account_ID": bank_id,
                "Vendor_Address": getattr(row, "Vendor_Address", ""),
            }
            self.nodes[vendor_id] = {"type": "VENDOR", "attributes": attrs}
            self.nodes_by_type["VENDOR"].add(vendor_id)

            # Edge 3: VENDOR --[USES_BANK_ACCOUNT]--> BANK_ACCOUNT
            self._add_edge(
                source=vendor_id,
                target=bank_id,
                edge_type="USES_BANK_ACCOUNT",
                attributes={}
            )

        # --- D. Construct Project Nodes, Edge 1 (MP -> PROJECT), & Edge 2 (PROJECT -> VENDOR) ---
        for row in self.df_projects.itertuples(index=False):
            proj_id = str(row.Project_ID)
            mp_id = str(row.MP_ID)
            vendor_id = str(row.Contractor_ID)
            sanctioned_amt = int(getattr(row, "Sanctioned_Amount", 0))
            sanction_date = str(getattr(row, "Sanction_Date", ""))
            category = str(getattr(row, "Project_Category", ""))

            attrs = {
                "Project_ID": proj_id,
                "MP_ID": mp_id,
                "Contractor_ID": vendor_id,
                "Sanctioned_Amount": sanctioned_amt,
                "Sanction_Date": sanction_date,
                "Expected_Completion_Date": str(getattr(row, "Expected_Completion_Date", "")),
                "Actual_Completion_Date": str(getattr(row, "Actual_Completion_Date", "")),
                "Project_Category": category,
                "Project_Description": str(getattr(row, "Project_Description", "")),
                "State": str(getattr(row, "State", "")),
                "Constituency": str(getattr(row, "Constituency", "")),
                "Project_Status": str(getattr(row, "Project_Status", "")),
            }
            self.nodes[proj_id] = {"type": "PROJECT", "attributes": attrs}
            self.nodes_by_type["PROJECT"].add(proj_id)

            # Edge 1: MP --[ALLOCATED]--> PROJECT
            self._add_edge(
                source=mp_id,
                target=proj_id,
                edge_type="ALLOCATED",
                attributes={
                    "Sanctioned_Amount": sanctioned_amt,
                    "Sanction_Date": sanction_date,
                }
            )

            # Edge 2: PROJECT --[AWARDED_TO]--> VENDOR
            self._add_edge(
                source=proj_id,
                target=vendor_id,
                edge_type="AWARDED_TO",
                attributes={
                    "Sanctioned_Amount": sanctioned_amt,
                    "Project_Category": category,
                    "Sanction_Date": sanction_date,
                }
            )

        self.is_graph_built = True
        build_time = time.time() - t0
        self.benchmark_metrics["build_time"] = build_time
        return self

    def _add_edge(
        self,
        source: str,
        target: str,
        edge_type: str,
        attributes: Dict[str, Any]
    ) -> None:
        """Internal helper to insert forward and reverse edges."""
        self.adj_out[source][edge_type].append((target, attributes))
        self.adj_in[target][edge_type].append((source, attributes))
        self.edges_by_type[edge_type] += 1
        self.total_edges += 1

    def add_node(self, node_id: str, node_type: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """Adds a typed node to the graph in-memory."""
        if attributes is None:
            attributes = {}
        node_type = node_type.upper()
        self.nodes[node_id] = {"type": node_type, "attributes": attributes}
        self.nodes_by_type[node_type].add(node_id)

    def add_edge(
        self,
        source: str,
        target: str,
        edge_type: str,
        attributes: Optional[Dict[str, Any]] = None
    ) -> None:
        """Adds a directed typed edge to the graph in-memory."""
        if attributes is None:
            attributes = {}
        self._add_edge(source=source, target=target, edge_type=edge_type, attributes=attributes)

    # -----------------------------------------------------------------------
    # 3. Query API
    # -----------------------------------------------------------------------

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Returns node dictionary containing 'type' and 'attributes', or None if not found."""
        return self.nodes.get(node_id)

    def get_node_type(self, node_id: str) -> Optional[str]:
        """Returns the type string of the node ('MP', 'PROJECT', 'VENDOR', 'BANK_ACCOUNT')."""
        node = self.nodes.get(node_id)
        return node["type"] if node else None

    def get_node_attributes(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Returns the attributes dictionary of the specified node, or None."""
        node = self.nodes.get(node_id)
        return node["attributes"] if node else None

    def get_nodes_by_type(self, node_type: str) -> List[str]:
        """Returns a list of all node IDs belonging to the specified type."""
        return sorted(list(self.nodes_by_type.get(node_type.upper(), set())))

    def get_node_count(self, node_type: Optional[str] = None) -> int:
        """Returns the count of nodes globally or for a specific type."""
        if node_type is None:
            return len(self.nodes)
        return len(self.nodes_by_type.get(node_type.upper(), set()))

    def get_edge_count(self, edge_type: Optional[str] = None) -> int:
        """Returns the count of edges globally or for a specific relationship type."""
        if edge_type is None:
            return self.total_edges
        return self.edges_by_type.get(edge_type, 0)

    def get_neighbors(
        self,
        node_id: str,
        edge_type: Optional[str] = None,
        direction: str = "out"
    ) -> List[str]:
        """
        Retrieves connected neighbor node IDs.

        Args:
            node_id: Node identifier to query.
            edge_type: Optional specific edge predicate (e.g. 'ALLOCATED', 'AWARDED_TO', 'USES_BANK_ACCOUNT').
            direction: 'out' for outgoing edges, 'in' for incoming edges, 'both' for bidirectional neighbors.
        """
        neighbors: List[str] = []

        if direction in ("out", "both"):
            if node_id in self.adj_out:
                if edge_type is not None:
                    neighbors.extend([target for target, _ in self.adj_out[node_id].get(edge_type, [])])
                else:
                    for e_type in self.adj_out[node_id]:
                        neighbors.extend([target for target, _ in self.adj_out[node_id][e_type]])

        if direction in ("in", "both"):
            if node_id in self.adj_in:
                if edge_type is not None:
                    neighbors.extend([source for source, _ in self.adj_in[node_id].get(edge_type, [])])
                else:
                    for e_type in self.adj_in[node_id]:
                        neighbors.extend([source for source, _ in self.adj_in[node_id][e_type]])

        return neighbors

    def get_incident_edges(
        self,
        node_id: str,
        edge_type: Optional[str] = None,
        direction: str = "out"
    ) -> List[Tuple[str, str, Dict[str, Any]]]:
        """
        Retrieves connected edges with attributes.
        Returns list of (neighbor_id, edge_type, attributes).
        """
        results: List[Tuple[str, str, Dict[str, Any]]] = []

        if direction in ("out", "both"):
            if node_id in self.adj_out:
                types_to_query = [edge_type] if edge_type else list(self.adj_out[node_id].keys())
                for e_type in types_to_query:
                    for target, attr in self.adj_out[node_id].get(e_type, []):
                        results.append((target, e_type, attr))

        if direction in ("in", "both"):
            if node_id in self.adj_in:
                types_to_query = [edge_type] if edge_type else list(self.adj_in[node_id].keys())
                for e_type in types_to_query:
                    for source, attr in self.adj_in[node_id].get(e_type, []):
                        results.append((source, e_type, attr))

        return results

    # -----------------------------------------------------------------------
    # 4. Graph Validation & Integrity
    # -----------------------------------------------------------------------

    def validate_graph(self) -> Dict[str, Any]:
        """
        Rigorously validates the constructed graph against known Phase 3 Task 1 audit expectations.
        Checks:
        1. Exact node counts by type.
        2. Exact edge counts by type.
        3. Strict referential integrity (0 orphan projects, 0 orphan vendors, 0 invalid MPs).
        4. Structural integrity of shared bank account clusters.
        """
        if not self.is_graph_built:
            self.build_graph()

        t0 = time.time()
        report: Dict[str, Any] = {
            "status": "VALID",
            "violations": [],
            "node_counts": {t: len(self.nodes_by_type[t]) for t in self.nodes_by_type},
            "edge_counts": dict(self.edges_by_type),
            "total_nodes": len(self.nodes),
            "total_edges": self.total_edges,
        }

        # 1. Node Counts Validation
        if report["node_counts"]["MP"] != 100:
            report["violations"].append(f"Expected 100 MP nodes, found {report['node_counts']['MP']}")
        if report["node_counts"]["PROJECT"] != 100000:
            report["violations"].append(f"Expected 100,000 Project nodes, found {report['node_counts']['PROJECT']}")
        if report["node_counts"]["VENDOR"] != 50000:
            report["violations"].append(f"Expected 50,000 Vendor nodes, found {report['node_counts']['VENDOR']}")
        if report["node_counts"]["BANK_ACCOUNT"] != 49100:
            report["violations"].append(f"Expected 49,100 Bank Account nodes, found {report['node_counts']['BANK_ACCOUNT']}")

        # 2. Edge Counts Validation
        if report["edge_counts"].get("ALLOCATED", 0) != 100000:
            report["violations"].append(f"Expected 100,000 ALLOCATED edges, found {report['edge_counts'].get('ALLOCATED', 0)}")
        if report["edge_counts"].get("AWARDED_TO", 0) != 100000:
            report["violations"].append(f"Expected 100,000 AWARDED_TO edges, found {report['edge_counts'].get('AWARDED_TO', 0)}")
        if report["edge_counts"].get("USES_BANK_ACCOUNT", 0) != 50000:
            report["violations"].append(f"Expected 50,000 USES_BANK_ACCOUNT edges, found {report['edge_counts'].get('USES_BANK_ACCOUNT', 0)}")

        # 3. Referential Integrity Validation
        orphan_projects_mp = 0
        orphan_projects_vendor = 0
        for proj_id in self.nodes_by_type["PROJECT"]:
            # Check MP connection (incoming ALLOCATED edge)
            mps = self.get_neighbors(proj_id, edge_type="ALLOCATED", direction="in")
            if len(mps) != 1 or mps[0] not in self.nodes_by_type["MP"]:
                orphan_projects_mp += 1

            # Check Vendor connection (outgoing AWARDED_TO edge)
            vendors = self.get_neighbors(proj_id, edge_type="AWARDED_TO", direction="out")
            if len(vendors) != 1 or vendors[0] not in self.nodes_by_type["VENDOR"]:
                orphan_projects_vendor += 1

        orphan_vendors_bank = 0
        for vendor_id in self.nodes_by_type["VENDOR"]:
            banks = self.get_neighbors(vendor_id, edge_type="USES_BANK_ACCOUNT", direction="out")
            if len(banks) != 1 or banks[0] not in self.nodes_by_type["BANK_ACCOUNT"]:
                orphan_vendors_bank += 1

        report["orphan_projects_mp"] = orphan_projects_mp
        report["orphan_projects_vendor"] = orphan_projects_vendor
        report["orphan_vendors_bank"] = orphan_vendors_bank

        if orphan_projects_mp > 0:
            report["violations"].append(f"Found {orphan_projects_mp} projects without exactly 1 valid MP parent")
        if orphan_projects_vendor > 0:
            report["violations"].append(f"Found {orphan_projects_vendor} projects without exactly 1 valid Vendor target")
        if orphan_vendors_bank > 0:
            report["violations"].append(f"Found {orphan_vendors_bank} vendors without exactly 1 valid Bank Account target")

        # 4. Shared Bank Account Structural Verification
        shared_accounts = 0
        vendors_in_shared_accounts = 0
        for bank_id in self.nodes_by_type["BANK_ACCOUNT"]:
            member_vendors = self.get_neighbors(bank_id, edge_type="USES_BANK_ACCOUNT", direction="in")
            count = len(member_vendors)
            if count > 1:
                shared_accounts += 1
                vendors_in_shared_accounts += count

        report["shared_bank_accounts"] = shared_accounts
        report["vendors_in_shared_groups"] = vendors_in_shared_accounts

        if shared_accounts != 100:
            report["violations"].append(f"Expected exactly 100 shared bank accounts, found {shared_accounts}")
        if vendors_in_shared_accounts != 1000:
            report["violations"].append(f"Expected exactly 1,000 vendors in shared accounts, found {vendors_in_shared_accounts}")

        if report["violations"]:
            report["status"] = "INVALID"

        validation_time = time.time() - t0
        self.benchmark_metrics["validation_time"] = validation_time
        return report

    def get_summary(self) -> str:
        """Generates an ASCII summary of the graph topology and integrity."""
        val = self.validate_graph()
        node_counts = val["node_counts"]
        edge_counts = val["edge_counts"]
        total_time = sum(self.benchmark_metrics.values())

        summary = f"""====================================================
MPLADS GRAPH INTELLIGENCE -- CORE GRAPH SUMMARY
====================================================

Nodes
-----
MPs:                 {node_counts.get('MP', 0):>10,}
Projects:            {node_counts.get('PROJECT', 0):>10,}
Vendors:             {node_counts.get('VENDOR', 0):>10,}
Bank Accounts:       {node_counts.get('BANK_ACCOUNT', 0):>10,}

Total Nodes:         {val['total_nodes']:>10,}

Edges
-----
MP -> Project:       {edge_counts.get('ALLOCATED', 0):>10,}
Project -> Vendor:   {edge_counts.get('AWARDED_TO', 0):>10,}
Vendor -> Bank:      {edge_counts.get('USES_BANK_ACCOUNT', 0):>10,}

Total Edges:         {val['total_edges']:>10,}

Graph Integrity
---------------
Orphan Projects (MP):{val['orphan_projects_mp']:>10}
Orphan Projects (V): {val['orphan_projects_vendor']:>10}
Orphan Vendors:      {val['orphan_vendors_bank']:>10}

Shared Account Structure
------------------------
Shared Accounts:     {val['shared_bank_accounts']:>10}
Vendors in Groups:   {val['vendors_in_shared_groups']:>10,}

Performance
-----------
Data Ingestion:      {self.benchmark_metrics.get('load_time', 0.0):>9.2f}s
Graph Construction:  {self.benchmark_metrics.get('build_time', 0.0):>9.2f}s
Graph Validation:    {self.benchmark_metrics.get('validation_time', 0.0):>9.2f}s
Total Execution:     {total_time:>9.2f}s

Status:
GRAPH CONSTRUCTION VALIDATED: {val['status']} {'[PASS]' if val['status'] == 'VALID' else '[FAIL]'}
===================================================="""
        return summary

    def print_summary(self) -> None:
        """Prints graph summary."""
        print(self.get_summary())


# ---------------------------------------------------------------------------
# 5. Shell Contractor / Shared Bank Syndicate Detector (Phase 3 Task 3)
# ---------------------------------------------------------------------------

class VendorCollusionDetector:
    """
    Vendor Collusion & Shell Contractor Syndicate Detector (Phase 3 Task 3).

    Identifies, profiles, and scores suspicious contractor networks created through
    shared bank accounts directly from an MPLADSGraphBuilder heterogeneous graph.

    Key Capabilities:
    - O(V + B + P) degree-based discovery of shared bank accounts (member_count > 1).
    - Deterministic syndicate assignment (SYNDICATE_001, SYNDICATE_002, ...).
    - Comprehensive syndicate metrics: size, active vendors, project count, total funds,
      geographic spread (states, districts), project spread (MPs, constituencies).
    - Transparent, rule-based 0-100 Collusion Risk Score (Signal A: Shared Account,
      Signal B: Syndicate Size, Signal C: Economic Exposure, Signal D: Active Participation).
    - Data-driven, auditor-friendly explainable red-flag evidence generation.
    - Vendor-level collusion profiling and fast lookup APIs.
    """

    def __init__(self, graph: MPLADSGraphBuilder):
        self.graph = graph
        if not self.graph.is_graph_built:
            self.graph.build_graph()

        self.syndicates: Dict[str, Dict[str, Any]] = {}
        self.vendor_profiles: Dict[str, Dict[str, Any]] = {}
        self.df_syndicates: Optional[pd.DataFrame] = None
        self.df_vendor_collusion: Optional[pd.DataFrame] = None
        self.df_vendor_profiles: Optional[pd.DataFrame] = None

        self.is_detected: bool = False
        self.benchmark_metrics: Dict[str, float] = {}

    @staticmethod
    def calculate_collusion_risk(
        member_count: int,
        total_funds: float,
        active_vendor_count: int,
        syndicate_size: int,
        total_projects: int,
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculates a deterministic, rule-based 0-100 Collusion Risk Score:

        - Signal A (Shared Account Base - 30 pts):
          +30.0 if multiple vendors share an account; 0.0 for unique account.
        - Signal B (Syndicate Size - 25 pts):
          Scales with member count up to 16 members: min(25.0, (member_count / 16.0) * 25.0).
        - Signal C (Economic Exposure - 25 pts):
          Scales with total sanctioned funds funneled: min(25.0, (total_funds / 200,000,000.0) * 25.0).
        - Signal D (Active Participation - 20 pts):
          Scales with proportion of active vendors: (active_vendor_count / syndicate_size) * 20.0.
        """
        if member_count <= 1:
            return 0.0, {
                "signal_a_shared_account": 0.0,
                "signal_b_syndicate_size": 0.0,
                "signal_c_economic_exposure": 0.0,
                "signal_d_active_participation": 0.0,
            }

        score_a = 30.0
        score_b = round(min(25.0, (member_count / 16.0) * 25.0), 2)
        score_c = round(min(25.0, (total_funds / 200_000_000.0) * 25.0), 2)
        ratio = (active_vendor_count / syndicate_size) if syndicate_size > 0 else 0.0
        score_d = round(ratio * 20.0, 2) if total_projects > 0 else 0.0

        total_score = round(min(100.0, max(0.0, score_a + score_b + score_c + score_d)), 2)
        signals = {
            "signal_a_shared_account": score_a,
            "signal_b_syndicate_size": score_b,
            "signal_c_economic_exposure": score_c,
            "signal_d_active_participation": score_d,
        }
        return total_score, signals

    def generate_syndicate_evidence(
        self,
        bank_id: str,
        syndicate_size: int,
        active_vendor_count: int,
        total_projects: int,
        total_funds: int,
        district_count: int,
        state_count: int,
        mp_count: int,
    ) -> List[str]:
        """
        Generates transparent, auditor-friendly evidence statements.
        """
        reasons = [
            f"Shares bank account {bank_id} with {syndicate_size - 1} other registered contractors.",
            f"Belongs to a {syndicate_size}-member contractor network receiving government project awards.",
            f"The connected contractor group has collectively received INR {total_funds:,} in sanctioned project value across {total_projects} projects.",
            f"{active_vendor_count} of {syndicate_size} network members are actively receiving MPLADS projects.",
        ]
        if district_count > 0 and state_count > 0:
            reasons.append(
                f"The shared-account vendor structure spans {district_count} districts across {state_count} states involving {mp_count} MPs."
            )
        return reasons

    def detect_syndicates(self) -> "VendorCollusionDetector":
        """
        Discovers all shared bank accounts, computes syndicate metrics,
        calculates collusion risk scores, and profiles all syndicate vendors.
        """
        t0 = time.time()
        self.syndicates.clear()
        self.vendor_profiles.clear()

        # Step 1: Scan all BANK_ACCOUNT nodes deterministically
        bank_ids = sorted(self.graph.get_nodes_by_type("BANK_ACCOUNT"))
        shared_bank_groups: List[Tuple[str, List[str]]] = []

        for bank_id in bank_ids:
            members = sorted(self.graph.get_neighbors(bank_id, edge_type="USES_BANK_ACCOUNT", direction="in"))
            if len(members) > 1:
                shared_bank_groups.append((bank_id, members))

        # Sort shared groups deterministically by bank_id
        shared_bank_groups.sort(key=lambda x: x[0])

        syndicate_records = []
        vendor_syndicate_map: Dict[str, str] = {}
        vendor_exposure_cache: Dict[str, Tuple[int, int]] = {}

        # Step 2: Compute Syndicate Metrics
        for idx, (bank_id, members) in enumerate(shared_bank_groups, 1):
            syndicate_id = f"SYNDICATE_{idx:03d}"
            syndicate_size = len(members)

            states: Set[str] = set()
            districts: Set[str] = set()
            syndicate_projects: Set[str] = set()
            active_vendors: Set[str] = set()

            for v_id in members:
                vendor_syndicate_map[v_id] = syndicate_id
                v_attr = self.graph.get_node_attributes(v_id) or {}
                st = v_attr.get("State", "")
                dt = v_attr.get("District", "")
                if st:
                    states.add(st)
                if dt:
                    districts.add(dt)

                v_projects = self.graph.get_neighbors(v_id, edge_type="AWARDED_TO", direction="in")
                v_proj_count = len(v_projects)
                v_sanctioned = sum(
                    (self.graph.get_node_attributes(p) or {}).get("Sanctioned_Amount", 0)
                    for p in v_projects
                )
                vendor_exposure_cache[v_id] = (v_proj_count, v_sanctioned)
                syndicate_projects.update(v_projects)
                if v_proj_count > 0:
                    active_vendors.add(v_id)

            total_projects = len(syndicate_projects)
            total_funds = sum(
                (self.graph.get_node_attributes(p) or {}).get("Sanctioned_Amount", 0)
                for p in syndicate_projects
            )
            active_count = len(active_vendors)

            # Project Spread: MPs and Constituencies
            mps: Set[str] = set()
            constituencies: Set[str] = set()
            for p_id in syndicate_projects:
                p_attr = self.graph.get_node_attributes(p_id) or {}
                p_mps = self.graph.get_neighbors(p_id, edge_type="ALLOCATED", direction="in")
                mps.update(p_mps)
                c_name = p_attr.get("Constituency", "")
                if c_name:
                    constituencies.add(c_name)

            # Collusion Risk Scoring
            risk_score, signals = self.calculate_collusion_risk(
                member_count=syndicate_size,
                total_funds=total_funds,
                active_vendor_count=active_count,
                syndicate_size=syndicate_size,
                total_projects=total_projects,
            )

            # Evidence Reasons
            evidence = self.generate_syndicate_evidence(
                bank_id=bank_id,
                syndicate_size=syndicate_size,
                active_vendor_count=active_count,
                total_projects=total_projects,
                total_funds=total_funds,
                district_count=len(districts),
                state_count=len(states),
                mp_count=len(mps),
            )

            record = {
                "Syndicate_ID": syndicate_id,
                "Bank_Account_ID": bank_id,
                "Syndicate_Size": syndicate_size,
                "Member_Vendor_IDs": members,
                "Active_Vendor_Count": active_count,
                "Total_Projects": total_projects,
                "Total_Syndicate_Funds_INR": total_funds,
                "State_Count": len(states),
                "District_Count": len(districts),
                "MP_Count": len(mps),
                "Constituency_Count": len(constituencies),
                "Syndicate_Collusion_Risk": risk_score,
                "Evidence_Reasons": evidence,
                "States": sorted(list(states)),
                "Districts": sorted(list(districts)),
                "MPs": sorted(list(mps)),
            }
            self.syndicates[syndicate_id] = record
            syndicate_records.append(record)

        discovery_time = time.time() - t0
        self.benchmark_metrics["discovery_time"] = discovery_time

        # Step 3: Build Vendor Collusion Profiles
        t1 = time.time()
        vendor_collusion_records = []
        all_vendor_records = []

        all_vendors = sorted(self.graph.get_nodes_by_type("VENDOR"))
        for v_id in all_vendors:
            v_attr = self.graph.get_node_attributes(v_id) or {}
            bank_id = v_attr.get("Bank_Account_ID", "")
            is_shared = v_id in vendor_syndicate_map

            if v_id in vendor_exposure_cache:
                v_proj_count, v_sanctioned = vendor_exposure_cache[v_id]
            else:
                v_projects = self.graph.get_neighbors(v_id, edge_type="AWARDED_TO", direction="in")
                v_proj_count = len(v_projects)
                v_sanctioned = sum(
                    (self.graph.get_node_attributes(p) or {}).get("Sanctioned_Amount", 0)
                    for p in v_projects
                )
                vendor_exposure_cache[v_id] = (v_proj_count, v_sanctioned)

            if is_shared:
                synd_id = vendor_syndicate_map[v_id]
                synd_data = self.syndicates[synd_id]
                v_evidence = [
                    f"Shares bank account {bank_id} with {synd_data['Syndicate_Size'] - 1} other registered contractors.",
                    f"Belongs to {synd_id} ({synd_data['Syndicate_Size']} members) controlling {synd_data['Total_Projects']} projects.",
                    f"Contractor syndicate holds INR {synd_data['Total_Syndicate_Funds_INR']:,} in sanctioned public funds.",
                    f"Entity directly holds {v_proj_count} project(s) totaling INR {v_sanctioned:,}.",
                ]
                profile = {
                    "Vendor_ID": v_id,
                    "Vendor_Name": v_attr.get("Vendor_Name", ""),
                    "Bank_Account_ID": bank_id,
                    "Syndicate_ID": synd_id,
                    "Syndicate_Size": synd_data["Syndicate_Size"],
                    "Is_Shared_Account": True,
                    "Active_Project_Count": v_proj_count,
                    "Vendor_Total_Sanctioned_Amount": v_sanctioned,
                    "Syndicate_Total_Projects": synd_data["Total_Projects"],
                    "Syndicate_Total_Funds_INR": synd_data["Total_Syndicate_Funds_INR"],
                    "State": v_attr.get("State", ""),
                    "District": v_attr.get("District", ""),
                    "Collusion_Risk_Score": synd_data["Syndicate_Collusion_Risk"],
                    "Evidence_Reasons": v_evidence,
                }
                self.vendor_profiles[v_id] = profile
                vendor_collusion_records.append(profile)
                all_vendor_records.append(profile)
            else:
                profile = {
                    "Vendor_ID": v_id,
                    "Vendor_Name": v_attr.get("Vendor_Name", ""),
                    "Bank_Account_ID": bank_id,
                    "Syndicate_ID": "NONE",
                    "Syndicate_Size": 1,
                    "Is_Shared_Account": False,
                    "Active_Project_Count": v_proj_count,
                    "Vendor_Total_Sanctioned_Amount": v_sanctioned,
                    "Syndicate_Total_Projects": 0,
                    "Syndicate_Total_Funds_INR": 0,
                    "State": v_attr.get("State", ""),
                    "District": v_attr.get("District", ""),
                    "Collusion_Risk_Score": 0.0,
                    "Evidence_Reasons": ["Single unique contractor bank routing (no shared account detected)."],
                }
                self.vendor_profiles[v_id] = profile
                all_vendor_records.append(profile)

        exposure_time = time.time() - t1
        self.benchmark_metrics["exposure_time"] = exposure_time

        # Construct DataFrames
        self.df_syndicates = pd.DataFrame(syndicate_records).sort_values(
            by=["Syndicate_Collusion_Risk", "Total_Syndicate_Funds_INR"], ascending=[False, False]
        ).reset_index(drop=True)

        self.df_vendor_collusion = pd.DataFrame(vendor_collusion_records).sort_values(
            by=["Collusion_Risk_Score", "Vendor_Total_Sanctioned_Amount"], ascending=[False, False]
        ).reset_index(drop=True)

        self.df_vendor_profiles = pd.DataFrame(all_vendor_records).sort_values(
            by=["Collusion_Risk_Score", "Vendor_Total_Sanctioned_Amount"], ascending=[False, False]
        ).reset_index(drop=True)

        self.is_detected = True
        return self

    # -----------------------------------------------------------------------
    # Output and Query APIs
    # -----------------------------------------------------------------------

    def get_syndicate_summary(self) -> pd.DataFrame:
        """
        Returns structured DataFrame of all detected syndicates:
        [Syndicate_ID, Bank_Account_ID, Syndicate_Size, Active_Vendor_Count,
         Total_Projects, Total_Syndicate_Funds_INR, State_Count, District_Count,
         MP_Count, Constituency_Count, Syndicate_Collusion_Risk, Evidence_Reasons]
        """
        if not self.is_detected:
            self.detect_syndicates()

        cols = [
            "Syndicate_ID",
            "Bank_Account_ID",
            "Syndicate_Size",
            "Active_Vendor_Count",
            "Total_Projects",
            "Total_Syndicate_Funds_INR",
            "State_Count",
            "District_Count",
            "MP_Count",
            "Constituency_Count",
            "Syndicate_Collusion_Risk",
            "Evidence_Reasons",
        ]
        return self.df_syndicates[cols].copy()

    def get_vendor_collusion_summary(self) -> pd.DataFrame:
        """
        Returns structured DataFrame with one row per vendor involved in a shared-account syndicate:
        [Vendor_ID, Vendor_Name, Bank_Account_ID, Syndicate_ID, Syndicate_Size,
         Active_Project_Count, Vendor_Total_Sanctioned_Amount, Syndicate_Total_Funds_INR,
         Collusion_Risk_Score, Evidence_Reasons]
        """
        if not self.is_detected:
            self.detect_syndicates()

        cols = [
            "Vendor_ID",
            "Vendor_Name",
            "Bank_Account_ID",
            "Syndicate_ID",
            "Syndicate_Size",
            "Active_Project_Count",
            "Vendor_Total_Sanctioned_Amount",
            "Syndicate_Total_Funds_INR",
            "Collusion_Risk_Score",
            "Evidence_Reasons",
        ]
        return self.df_vendor_collusion[cols].copy()

    def get_vendor_syndicate_profiles(self, shared_only: bool = False) -> pd.DataFrame:
        """Backward-compatible alias for retrieving vendor profiles."""
        if shared_only:
            return self.get_vendor_collusion_summary()
        if not self.is_detected:
            self.detect_syndicates()
        return self.df_vendor_profiles.copy()

    def get_vendor_syndicate(self, vendor_id: str) -> Optional[Dict[str, Any]]:
        """
        Lookup API: Returns collusion profile for a specific vendor,
        or None if vendor does not belong to a shared-account syndicate.
        """
        if not self.is_detected:
            self.detect_syndicates()

        profile = self.vendor_profiles.get(vendor_id)
        if profile and profile.get("Is_Shared_Account", False):
            return profile.copy()
        return None

    def get_syndicate(self, syndicate_id: str) -> Optional[Dict[str, Any]]:
        """
        Lookup API: Returns the detailed profile for a specific syndicate ID, or None.
        """
        if not self.is_detected:
            self.detect_syndicates()

        syn = self.syndicates.get(syndicate_id)
        return syn.copy() if syn else None

    # -----------------------------------------------------------------------
    # Ground-Truth Validation & Export
    # -----------------------------------------------------------------------

    def validate_syndicate_detection(self) -> Dict[str, Any]:
        """
        Validates detected syndicates against known structural ground truth.
        """
        if not self.is_detected:
            self.detect_syndicates()

        t0 = time.time()
        df_syn = self.df_syndicates
        df_vend = self.df_vendor_collusion

        detected_shared_accounts = len(df_syn)
        expected_shared_accounts = 100

        detected_shared_vendors = len(df_vend)
        expected_shared_vendors = 1000

        vendor_nums = df_vend["Vendor_ID"].str.extract(r"(\d+)").astype(int)[0]
        false_shared_vendors = int((vendor_nums > 1000).sum())

        false_structures = max(0, detected_shared_accounts - expected_shared_accounts)
        missed_structures = max(0, expected_shared_accounts - detected_shared_accounts)

        # Economic Exposure
        detected_syndicate_projects = int(df_syn["Total_Projects"].sum())
        detected_total_exposure = int(df_syn["Total_Syndicate_Funds_INR"].sum())
        vendors_with_projects = int((df_vend["Active_Project_Count"] > 0).sum())
        vendors_without_projects = int((df_vend["Active_Project_Count"] == 0).sum())

        expected_projects = 1975
        expected_exposure = 10494870000
        expected_vendors_with_proj = 869
        expected_vendors_without_proj = 131

        violations = []
        if detected_shared_accounts != expected_shared_accounts:
            violations.append(f"Shared accounts mismatch: detected {detected_shared_accounts}, expected {expected_shared_accounts}")
        if detected_shared_vendors != expected_shared_vendors:
            violations.append(f"Shared vendors mismatch: detected {detected_shared_vendors}, expected {expected_shared_vendors}")
        if false_shared_vendors > 0:
            violations.append(f"Detected {false_shared_vendors} vendors outside expected V000001-V001000 range")
        if detected_syndicate_projects != expected_projects:
            violations.append(f"Syndicate projects mismatch: detected {detected_syndicate_projects}, expected {expected_projects}")
        if detected_total_exposure != expected_exposure:
            violations.append(f"Total exposure mismatch: detected {detected_total_exposure}, expected {expected_exposure}")
        if vendors_with_projects != expected_vendors_with_proj:
            violations.append(f"Vendors with projects mismatch: detected {vendors_with_projects}, expected {expected_vendors_with_proj}")

        val_time = time.time() - t0
        self.benchmark_metrics["validation_time"] = val_time

        return {
            "status": "VALID" if not violations else "INVALID",
            "violations": violations,
            "detected_shared_accounts": detected_shared_accounts,
            "expected_shared_accounts": expected_shared_accounts,
            "detected_shared_vendors": detected_shared_vendors,
            "expected_shared_vendors": expected_shared_vendors,
            "false_shared_structures": false_structures,
            "missed_shared_structures": missed_structures,
            "detected_syndicate_projects": detected_syndicate_projects,
            "expected_syndicate_projects": expected_projects,
            "detected_total_exposure": detected_total_exposure,
            "expected_total_exposure": expected_exposure,
            "vendors_with_projects": vendors_with_projects,
            "expected_vendors_with_projects": expected_vendors_with_proj,
            "vendors_without_projects": vendors_without_projects,
            "expected_vendors_without_projects": expected_vendors_without_proj,
        }

    def export_results(self, output_dir: str = "outputs/graph") -> Dict[str, str]:
        """
        Exports syndicate summary and vendor collusion profiles to CSV and JSON formats.
        """
        if not self.is_detected:
            self.detect_syndicates()

        os.makedirs(output_dir, exist_ok=True)
        paths = {
            "syndicate_summary_csv": os.path.join(output_dir, "syndicate_summary.csv"),
            "vendor_collusion_summary_csv": os.path.join(output_dir, "vendor_collusion_summary.csv"),
            "syndicate_summary_json": os.path.join(output_dir, "syndicate_summary.json"),
        }

        self.get_syndicate_summary().to_csv(paths["syndicate_summary_csv"], index=False)
        self.get_vendor_collusion_summary().to_csv(paths["vendor_collusion_summary_csv"], index=False)

        syndicate_list = self.get_syndicate_summary().to_dict(orient="records")
        with open(paths["syndicate_summary_json"], "w", encoding="utf-8") as f:
            json.dump(syndicate_list, f, indent=2)

        print(f"[+] Successfully exported Phase 3 graph intelligence outputs to: '{output_dir}/'")
        return paths


# Backward-compatible alias
VendorSyndicateDetector = VendorCollusionDetector


# ---------------------------------------------------------------------------
# 6. MP-Vendor Concentration & Favoritism Detector (Phase 3 Task 4)
# ---------------------------------------------------------------------------

class MPVendorConcentrationDetector:
    """
    MP-Vendor Concentration & Favoritism Detector (Phase 3 Task 4).

    Identifies suspicious allocation patterns where an MP's MPLADS projects or
    sanctioned funds are disproportionately concentrated among:
    1. A single vendor (CR1)
    2. A small group of vendors (CR3, HHI)
    3. Vendors belonging to the same shell/syndicate network (Syndicate-adjusted HHI / CR1 / CR3)

    Provides auditable concentration metrics and evidence under objective criteria
    ('Allocation concentration anomaly', 'Potential vendor favoritism', 'Requires auditor review').
    """

    def __init__(
        self,
        graph: MPLADSGraphBuilder,
        syndicate_detector: Optional[VendorCollusionDetector] = None
    ):
        self.graph = graph
        if not self.graph.is_graph_built:
            self.graph.build_graph()

        if syndicate_detector is None:
            self.syndicate_detector = VendorCollusionDetector(graph=self.graph)
        else:
            self.syndicate_detector = syndicate_detector

        if not self.syndicate_detector.is_detected:
            self.syndicate_detector.detect_syndicates()

        self.mp_records: List[Dict[str, Any]] = []
        self.df_mp_concentration: Optional[pd.DataFrame] = None
        self.baseline_statistics: Dict[str, Dict[str, float]] = {}
        self.is_calculated: bool = False
        self.benchmark_metrics: Dict[str, float] = {}

    def calculate_concentration(self) -> "MPVendorConcentrationDetector":
        """
        Calculates vendor-level and syndicate-adjusted allocation concentration metrics
        for every MP, derives dataset-level percentiles and anomaly flags, and computes
        the 0-100 Allocation Risk Score.
        """
        t0 = time.time()
        self.mp_records.clear()

        # Map vendors to their detected syndicate ID (or self if independent)
        df_vend = self.syndicate_detector.get_vendor_collusion_summary()
        vend_synd_map: Dict[str, str] = dict(zip(df_vend["Vendor_ID"], df_vend["Syndicate_ID"]))

        mp_ids = sorted(self.graph.get_nodes_by_type("MP"))
        records = []

        for mp_id in mp_ids:
            mp_attr = self.graph.get_node_attributes(mp_id) or {}
            mp_name = mp_attr.get("MP_Name", "")
            state = mp_attr.get("State", "")
            constituency = mp_attr.get("Constituency", "")

            # Projects allocated by this MP
            projects = self.graph.get_neighbors(mp_id, edge_type="ALLOCATED", direction="out")
            total_projects = len(projects)

            vendor_funds: Dict[str, int] = defaultdict(int)
            vendor_project_counts: Dict[str, int] = defaultdict(int)

            for p_id in projects:
                p_attr = self.graph.get_node_attributes(p_id) or {}
                sanctioned = int(p_attr.get("Sanctioned_Amount", 0))
                awarded = self.graph.get_neighbors(p_id, edge_type="AWARDED_TO", direction="out")
                if awarded:
                    v_id = awarded[0]
                    vendor_funds[v_id] += sanctioned
                    vendor_project_counts[v_id] += 1

            total_project_funds = sum(vendor_funds.values())
            unique_vendors = len(vendor_funds)

            if total_project_funds == 0 or unique_vendors == 0:
                rec = {
                    "MP_ID": mp_id,
                    "MP_Name": mp_name,
                    "State": state,
                    "Constituency": constituency,
                    "Total_Projects": total_projects,
                    "Unique_Vendors": unique_vendors,
                    "Total_Project_Funds": total_project_funds,
                    "Top_Vendor_ID": "NONE",
                    "Top_Vendor_Name": "NONE",
                    "Top_Vendor_Project_Count": 0,
                    "Top_Vendor_Funds": 0,
                    "Top_Vendor_Project_Share": 0.0,
                    "Top_Vendor_Fund_Share": 0.0,
                    "Vendor_HHI_Raw": 0.0,
                    "Vendor_HHI_Normalized": 0.0,
                    "Vendor_CR1": 0.0,
                    "Vendor_CR3": 0.0,
                    "Top_Syndicate_ID": "NONE",
                    "Top_Syndicate_Vendor_Count": 0,
                    "Top_Syndicate_Funds": 0,
                    "Top_Syndicate_Share": 0.0,
                    "Syndicate_HHI_Raw": 0.0,
                    "Syndicate_CR1": 0.0,
                    "Syndicate_CR3": 0.0,
                }
                records.append(rec)
                continue

            # 1. Vendor Shares & HHI
            vendor_shares = {v: amt / total_project_funds for v, amt in vendor_funds.items()}
            sorted_vendors = sorted(vendor_shares.items(), key=lambda x: (x[1], x[0]), reverse=True)

            vendor_hhi_raw = sum(s ** 2 for s in vendor_shares.values())
            if unique_vendors > 1:
                vendor_hhi_norm = (vendor_hhi_raw - (1.0 / unique_vendors)) / (1.0 - (1.0 / unique_vendors))
                vendor_hhi_norm = round(max(0.0, min(1.0, vendor_hhi_norm)), 6)
            else:
                vendor_hhi_norm = 1.0

            top_vendor_id, top_vendor_share = sorted_vendors[0]
            top_vendor_funds = vendor_funds[top_vendor_id]
            top_vendor_name = (self.graph.get_node_attributes(top_vendor_id) or {}).get("Vendor_Name", "")
            top_vendor_proj_count = vendor_project_counts[top_vendor_id]
            top_vendor_proj_share = top_vendor_proj_count / total_projects if total_projects > 0 else 0.0

            vendor_cr1 = top_vendor_share
            vendor_cr3 = sum(s for _, s in sorted_vendors[:3])

            # 2. Syndicate-adjusted Concentration (Level B)
            entity_funds: Dict[str, int] = defaultdict(int)
            entity_vendor_counts: Dict[str, Set[str]] = defaultdict(set)

            for v, amt in vendor_funds.items():
                e_id = vend_synd_map.get(v, v)
                entity_funds[e_id] += amt
                entity_vendor_counts[e_id].add(v)

            entity_shares = {e: amt / total_project_funds for e, amt in entity_funds.items()}
            sorted_entities = sorted(entity_shares.items(), key=lambda x: (x[1], x[0]), reverse=True)

            syndicate_hhi_raw = sum(s ** 2 for s in entity_shares.values())
            syndicate_cr1 = sorted_entities[0][1]
            syndicate_cr3 = sum(s for _, s in sorted_entities[:3])

            # Identify Top Task 3 Syndicate specifically (entities starting with SYNDICATE_)
            syndicate_only = [item for item in sorted_entities if item[0].startswith("SYNDICATE_")]
            if syndicate_only:
                top_synd_id, top_synd_share = syndicate_only[0]
                top_synd_funds = entity_funds[top_synd_id]
                top_synd_vendors = len(entity_vendor_counts[top_synd_id])
            else:
                top_synd_id = "NONE"
                top_synd_share = 0.0
                top_synd_funds = 0
                top_synd_vendors = 0

            rec = {
                "MP_ID": mp_id,
                "MP_Name": mp_name,
                "State": state,
                "Constituency": constituency,
                "Total_Projects": total_projects,
                "Unique_Vendors": unique_vendors,
                "Total_Project_Funds": total_project_funds,
                "Top_Vendor_ID": top_vendor_id,
                "Top_Vendor_Name": top_vendor_name,
                "Top_Vendor_Project_Count": top_vendor_proj_count,
                "Top_Vendor_Funds": top_vendor_funds,
                "Top_Vendor_Project_Share": round(top_vendor_proj_share, 4),
                "Top_Vendor_Fund_Share": round(top_vendor_share, 4),
                "Vendor_HHI_Raw": round(vendor_hhi_raw, 6),
                "Vendor_HHI_Normalized": vendor_hhi_norm,
                "Vendor_CR1": round(vendor_cr1, 4),
                "Vendor_CR3": round(vendor_cr3, 4),
                "Top_Syndicate_ID": top_synd_id,
                "Top_Syndicate_Vendor_Count": top_synd_vendors,
                "Top_Syndicate_Funds": top_synd_funds,
                "Top_Syndicate_Share": round(top_synd_share, 4),
                "Syndicate_HHI_Raw": round(syndicate_hhi_raw, 6),
                "Syndicate_CR1": round(syndicate_cr1, 4),
                "Syndicate_CR3": round(syndicate_cr3, 4),
            }
            records.append(rec)

        df = pd.DataFrame(records)

        # 3. Calculate Dataset-Level Baselines & Percentile Ranks
        metrics_to_rank = [
            "Vendor_HHI_Raw",
            "Vendor_CR1",
            "Vendor_CR3",
            "Syndicate_HHI_Raw",
            "Syndicate_CR1",
            "Syndicate_CR3",
        ]

        self.baseline_statistics.clear()
        for metric in metrics_to_rank:
            series = df[metric]
            self.baseline_statistics[metric] = {
                "mean": float(series.mean()),
                "median": float(series.median()),
                "std": float(series.std()),
                "p90": float(np.percentile(series, 90)),
                "p95": float(np.percentile(series, 95)),
                "p99": float(np.percentile(series, 99)),
            }
            pct_col = metric + "_Percentile"
            df[pct_col] = round(series.rank(pct=True) * 100.0, 2)

        # 4. Concentration Anomaly Flags (>= 90th percentile)
        df["High_Vendor_HHI_Flag"] = df["Vendor_HHI_Raw_Percentile"] >= 90.0
        df["High_Vendor_CR1_Flag"] = df["Vendor_CR1_Percentile"] >= 90.0
        df["High_Vendor_CR3_Flag"] = df["Vendor_CR3_Percentile"] >= 90.0
        df["High_Syndicate_HHI_Flag"] = df["Syndicate_HHI_Raw_Percentile"] >= 90.0
        df["High_Syndicate_CR1_Flag"] = df["Syndicate_CR1_Percentile"] >= 90.0
        df["High_Syndicate_CR3_Flag"] = df["Syndicate_CR3_Percentile"] >= 90.0

        # 5. Deterministic Allocation Risk Score (0-100)
        # Weights:
        # - Vendor CR1 Pct: 25%
        # - Vendor HHI Pct: 20%
        # - Vendor CR3 Pct: 15%
        # - Syndicate CR1 Pct: 20%
        # - Syndicate HHI Pct: 10%
        # - Syndicate CR3 Pct: 10%
        score_series = (
            0.25 * df["Vendor_CR1_Percentile"]
            + 0.20 * df["Vendor_HHI_Raw_Percentile"]
            + 0.15 * df["Vendor_CR3_Percentile"]
            + 0.20 * df["Syndicate_CR1_Percentile"]
            + 0.10 * df["Syndicate_HHI_Raw_Percentile"]
            + 0.10 * df["Syndicate_CR3_Percentile"]
        )
        df["Allocation_Risk_Score"] = score_series.clip(0.0, 100.0).round(2)

        # 6. Generate Evidence Reasons for each MP
        evidence_list = []
        for _, row in df.iterrows():
            reasons = []
            if row["High_Vendor_CR1_Flag"]:
                reasons.append(
                    f"Top vendor {row['Top_Vendor_ID']} captured {row['Vendor_CR1']:.2%} of funds (Percentile: {row['Vendor_CR1_Percentile']:.1f}%)."
                )
            if row["High_Vendor_HHI_Flag"]:
                reasons.append(
                    f"Vendor-level allocation HHI ({row['Vendor_HHI_Raw']:.6f}) is elevated above 90th percentile baseline."
                )
            if row["Top_Syndicate_ID"] != "NONE":
                reasons.append(
                    f"Shell syndicate {row['Top_Syndicate_ID']} received INR {row['Top_Syndicate_Funds']:,} ({row['Top_Syndicate_Share']:.2%}) across {row['Top_Syndicate_Vendor_Count']} member contractors."
                )
            if row["High_Syndicate_CR1_Flag"]:
                reasons.append(
                    f"Syndicate-adjusted CR1 ({row['Syndicate_CR1']:.2%}) indicates heightened network concentration."
                )
            if not reasons:
                reasons.append("Allocation distribution within normal decentralized parameters across contractors.")
            else:
                reasons.append("Allocation concentration anomaly detected; potential contractor favoritism requiring auditor review.")
            evidence_list.append(reasons)

        df["Evidence_Reasons"] = evidence_list

        # Sort descending by Allocation_Risk_Score
        self.df_mp_concentration = df.sort_values(by="Allocation_Risk_Score", ascending=False).reset_index(drop=True)
        self.mp_records = self.df_mp_concentration.to_dict(orient="records")

        self.mp_profiles = {r["MP_ID"]: r for r in self.mp_records}
        self.benchmark_metrics["calculation_time"] = time.time() - t0
        self.is_calculated = True
        return self

    def generate_mp_concentration_summary(self) -> pd.DataFrame:
        """Returns DataFrame containing complete concentration summary for all MPs."""
        if not self.is_calculated:
            self.calculate_concentration()
        return self.df_mp_concentration.copy()

    def get_mp_concentration(self, mp_id: str) -> Optional[Dict[str, Any]]:
        """Returns dictionary profile for a specific MP, or None if not found."""
        if not self.is_calculated:
            self.calculate_concentration()
        match = self.df_mp_concentration[self.df_mp_concentration["MP_ID"] == mp_id]
        if not match.empty:
            return match.iloc[0].to_dict()
        return None

    def explain_mp_concentration(self, mp_id: str) -> str:
        """
        Generates an auditor-friendly, transparent concentration and favoritism profile.
        """
        if not self.is_calculated:
            self.calculate_concentration()

        match = self.df_mp_concentration[self.df_mp_concentration["MP_ID"] == mp_id]
        if match.empty:
            return f"MP {mp_id} not found in concentration records."

        row = match.iloc[0]
        report = f"""======================================================================
MP ALLOCATION CONCENTRATION ANALYSIS: {row['MP_ID']} ({row['MP_Name']}, {row['State']} - {row['Constituency']})
======================================================================
Total Projects : {row['Total_Projects']:,}
Unique Vendors : {row['Unique_Vendors']:,}
Total Funds    : INR {row['Total_Project_Funds']:,}

Vendor Concentration:
- Top Vendor   : {row['Top_Vendor_Name']} ({row['Top_Vendor_ID']})
- Top Projects : {row['Top_Vendor_Project_Count']} ({row['Top_Vendor_Project_Share']:.2%})
- Top Funds    : INR {row['Top_Vendor_Funds']:,} ({row['Top_Vendor_Fund_Share']:.2%})
- HHI Raw      : {row['Vendor_HHI_Raw']:.6f} (Normalized: {row['Vendor_HHI_Normalized']:.4f}, Pct: {row['Vendor_HHI_Raw_Percentile']:.1f}%)
- CR1          : {row['Vendor_CR1']:.2%} (Percentile: {row['Vendor_CR1_Percentile']:.1f}%)
- CR3          : {row['Vendor_CR3']:.2%} (Percentile: {row['Vendor_CR3_Percentile']:.1f}%)

Syndicate-Adjusted Analysis:
- Top Syndicate: {row['Top_Syndicate_ID']} ({row['Top_Syndicate_Vendor_Count']} vendor members active under MP)
- Syn Funds    : INR {row['Top_Syndicate_Funds']:,} ({row['Top_Syndicate_Share']:.2%})
- Syn HHI Raw  : {row['Syndicate_HHI_Raw']:.6f} (Percentile: {row['Syndicate_HHI_Raw_Percentile']:.1f}%)
- Syn CR1      : {row['Syndicate_CR1']:.2%} (Percentile: {row['Syndicate_CR1_Percentile']:.1f}%)
- Syn CR3      : {row['Syndicate_CR3']:.2%} (Percentile: {row['Syndicate_CR3_Percentile']:.1f}%)

Risk Assessment:
- Allocation Risk Score: {row['Allocation_Risk_Score']:.2f}/100
- Flags:
  * High Vendor CR1   : {row['High_Vendor_CR1_Flag']}
  * High Vendor HHI   : {row['High_Vendor_HHI_Flag']}
  * High Syndicate CR1: {row['High_Syndicate_CR1_Flag']}
  * High Syndicate HHI: {row['High_Syndicate_HHI_Flag']}
- Evidence Trail:"""
        for ev in row["Evidence_Reasons"]:
            report += f"\n  * {ev}"
        report += "\n======================================================================"
        return report

    def get_baseline_statistics(self) -> Dict[str, Dict[str, float]]:
        """Returns baseline distribution statistics across all MPs."""
        if not self.is_calculated:
            self.calculate_concentration()
        return self.baseline_statistics.copy()

    def export_results(self, output_dir: str = "outputs/graph") -> Dict[str, str]:
        """Exports concentration summary to CSV and JSON."""
        if not self.is_calculated:
            self.calculate_concentration()

        os.makedirs(output_dir, exist_ok=True)
        paths = {
            "mp_concentration_summary_csv": os.path.join(output_dir, "mp_concentration_summary.csv"),
            "mp_concentration_summary_json": os.path.join(output_dir, "mp_concentration_summary.json"),
        }

        self.df_mp_concentration.to_csv(paths["mp_concentration_summary_csv"], index=False)
        records = self.df_mp_concentration.to_dict(orient="records")
        with open(paths["mp_concentration_summary_json"], "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)

        print(f"[+] Successfully exported MP concentration outputs to: '{output_dir}/'")
        return paths


# ---------------------------------------------------------------------------
# 4. Phase 3 — Task 5: Work Splitting / Tender Slicing Detector
# ---------------------------------------------------------------------------

class WorkSplittingDetector:
    """
    Phase 3 — Task 5: Work Splitting / Tender Slicing Detector

    Identifies public works contracts artificially divided into smaller packages to
    evade statutory e-tendering thresholds (e.g. INR 5,000,000 threshold under General
    Financial Rules / GFR).

    Detection Strategies:
    1. Direct Contractor Splitting:
       Same contractor awarded >= 2 projects in the same administrative jurisdiction
       (MP / Constituency) within a sliding time window (<= 60 days) for the same or
       closely related category.
    2. Syndicate Cross-Entity Splitting:
       Multiple distinct contractors belonging to the same shell syndicate (sharing a
       bank account) awarded projects in the same jurisdiction within the window,
       splitting work across sister puppet entities.
    3. Threshold Circumvention (Slicing):
       Individual contract amounts clustered near or below INR 5,000,000 whose aggregated
       sum exceeds the statutory threshold.
    """

    def __init__(
        self,
        graph: MPLADSGraphBuilder,
        syndicate_detector: Optional[VendorCollusionDetector] = None,
        threshold_amount: float = 5_000_000.0,
        time_window_days: int = 60,
    ):
        self.graph = graph
        self.syndicate_detector = syndicate_detector
        self.threshold_amount = threshold_amount
        self.time_window_days = time_window_days

        self.df_split_clusters: Optional[pd.DataFrame] = None
        self.df_project_split_scores: Optional[pd.DataFrame] = None
        self.split_clusters: List[Dict[str, Any]] = []
        self.project_split_map: Dict[str, Dict[str, Any]] = {}
        self.is_detected: bool = False

    def detect_work_splitting(self) -> "WorkSplittingDetector":
        """Executes work splitting and tender slicing detection across all graph projects."""
        if not self.graph.is_graph_built:
            self.graph.build_graph()

        # 1. Vendor to Syndicate lookup
        v_to_syn: Dict[str, str] = {}
        if self.syndicate_detector is not None:
            if not self.syndicate_detector.is_detected:
                self.syndicate_detector.detect_syndicates()
            for v_id, prof in self.syndicate_detector.vendor_profiles.items():
                if prof.get("Is_Shared_Account"):
                    v_to_syn[v_id] = prof.get("Syndicate_ID", "NONE")
        else:
            for v_id in self.graph.nodes_by_type.get("VENDOR", set()):
                for target_id, _ in self.graph.adj_out[v_id].get("USES_BANK_ACCOUNT", []):
                    b_attrs = self.graph.nodes.get(target_id, {}).get("attributes", {})
                    if b_attrs.get("is_shared_account", False):
                        v_to_syn[v_id] = f"SYNDICATE_{target_id}"

        # 2. Extract project attributes from graph
        records: List[Dict[str, Any]] = []
        for p_id in self.graph.nodes_by_type.get("PROJECT", set()):
            attrs = self.graph.nodes[p_id]["attributes"]
            v_id = attrs.get("Contractor_ID", "")
            if not v_id:
                edges = self.graph.adj_out[p_id].get("AWARDED_TO", [])
                if edges:
                    v_id = edges[0][0]
            mp_id = attrs.get("MP_ID", "")
            if not mp_id:
                in_edges = self.graph.adj_in[p_id].get("ALLOCATED", [])
                if in_edges:
                    mp_id = in_edges[0][0]

            amt = float(attrs.get("Sanctioned_Amount", 0))
            s_date = str(attrs.get("Sanction_Date", ""))
            cat = str(attrs.get("Project_Category", "General"))
            constituency = str(attrs.get("Constituency", ""))
            state = str(attrs.get("State", ""))

            records.append({
                "Project_ID": p_id,
                "MP_ID": mp_id,
                "Contractor_ID": v_id,
                "Sanctioned_Amount": amt,
                "Sanction_Date": s_date,
                "Project_Category": cat,
                "Constituency": constituency,
                "State": state,
                "Syndicate_ID": v_to_syn.get(v_id, "NONE"),
            })

        if not records:
            self.df_split_clusters = pd.DataFrame()
            self.df_project_split_scores = pd.DataFrame()
            self.is_detected = True
            return self

        df_p = pd.DataFrame(records)
        df_p["Effective_Entity_ID"] = np.where(
            df_p["Syndicate_ID"] != "NONE",
            df_p["Syndicate_ID"],
            df_p["Contractor_ID"]
        )
        df_p["Sanction_Date_DT"] = pd.to_datetime(df_p["Sanction_Date"], errors="coerce")

        # 3. Detect temporal chains per (Effective_Entity_ID, MP_ID, Project_Category)
        clusters: List[Dict[str, Any]] = []
        cluster_idx = 1
        df_valid = df_p.dropna(subset=["Sanction_Date_DT"]).copy()
        grouped = df_valid.groupby(["Effective_Entity_ID", "MP_ID", "Project_Category"])

        for (entity_id, mp_id, cat), grp in grouped:
            if len(grp) < 2:
                continue
            grp_sorted = grp.sort_values("Sanction_Date_DT")

            current_chain: List[pd.Series] = [grp_sorted.iloc[0]]
            for i in range(1, len(grp_sorted)):
                row = grp_sorted.iloc[i]
                prev_row = current_chain[-1]
                gap_days = (row["Sanction_Date_DT"] - prev_row["Sanction_Date_DT"]).days
                if gap_days <= self.time_window_days:
                    current_chain.append(row)
                else:
                    if len(current_chain) >= 2:
                        clusters.append(self._build_cluster(current_chain, f"SPLIT_{cluster_idx:05d}", entity_id, mp_id, cat))
                        cluster_idx += 1
                    current_chain = [row]

            if len(current_chain) >= 2:
                clusters.append(self._build_cluster(current_chain, f"SPLIT_{cluster_idx:05d}", entity_id, mp_id, cat))
                cluster_idx += 1

        self.split_clusters = clusters
        self.df_split_clusters = pd.DataFrame(clusters) if clusters else pd.DataFrame(columns=[
            "Cluster_ID", "Effective_Entity_ID", "Entity_Type", "MP_ID", "Project_Category",
            "Project_Count", "Total_Split_Amount_INR", "Average_Amount_INR", "Min_Date",
            "Max_Date", "Span_Days", "Unique_Vendors_Count", "Is_Syndicate_Split",
            "Threshold_Evasion_Flag", "Work_Splitting_Risk_Score", "Evidence_Reasons"
        ])

        # Map project to cluster
        self.project_split_map = {}
        for cl in clusters:
            for p_id in cl["Project_IDs"]:
                self.project_split_map[p_id] = {
                    "Is_Split_Work": True,
                    "Split_Cluster_ID": cl["Cluster_ID"],
                    "Split_Cluster_Size": cl["Project_Count"],
                    "Split_Cluster_Amount": cl["Total_Split_Amount_INR"],
                    "Split_Cluster_Span_Days": cl["Span_Days"],
                    "Split_Risk_Score": cl["Work_Splitting_Risk_Score"],
                    "Split_Reasons": "; ".join(cl["Evidence_Reasons"]),
                }

        # Build complete project-level DataFrame
        proj_scores: List[Dict[str, Any]] = []
        for _, row in df_p.iterrows():
            pid = row["Project_ID"]
            if pid in self.project_split_map:
                info = self.project_split_map[pid]
                proj_scores.append({
                    "Project_ID": pid,
                    "Contractor_ID": row["Contractor_ID"],
                    "MP_ID": row["MP_ID"],
                    "Sanctioned_Amount": row["Sanctioned_Amount"],
                    "Project_Category": row["Project_Category"],
                    "Is_Split_Work": True,
                    "Split_Cluster_ID": info["Split_Cluster_ID"],
                    "Split_Cluster_Size": info["Split_Cluster_Size"],
                    "Split_Cluster_Amount": info["Split_Cluster_Amount"],
                    "Split_Cluster_Span_Days": info["Split_Cluster_Span_Days"],
                    "Split_Risk_Score": info["Split_Risk_Score"],
                    "Split_Reasons": info["Split_Reasons"],
                })
            else:
                proj_scores.append({
                    "Project_ID": pid,
                    "Contractor_ID": row["Contractor_ID"],
                    "MP_ID": row["MP_ID"],
                    "Sanctioned_Amount": row["Sanctioned_Amount"],
                    "Project_Category": row["Project_Category"],
                    "Is_Split_Work": False,
                    "Split_Cluster_ID": "NONE",
                    "Split_Cluster_Size": 1,
                    "Split_Cluster_Amount": row["Sanctioned_Amount"],
                    "Split_Cluster_Span_Days": 0,
                    "Split_Risk_Score": 0.0,
                    "Split_Reasons": "Single independent project; no temporal or jurisdictional slicing detected.",
                })
        self.df_project_split_scores = pd.DataFrame(proj_scores)
        self.is_detected = True
        return self

    def _build_cluster(
        self,
        chain: List[pd.Series],
        cluster_id: str,
        entity_id: str,
        mp_id: str,
        cat: str
    ) -> Dict[str, Any]:
        p_ids = [r["Project_ID"] for r in chain]
        amts = [float(r["Sanctioned_Amount"]) for r in chain]
        vendors = list({r["Contractor_ID"] for r in chain})
        min_date = min(r["Sanction_Date_DT"] for r in chain)
        max_date = max(r["Sanction_Date_DT"] for r in chain)
        span_days = int((max_date - min_date).days)
        total_amt = float(sum(amts))
        avg_amt = total_amt / len(chain)
        k = len(chain)

        is_syndicate = str(entity_id).startswith("SYNDICATE")
        is_cross_vendor = len(vendors) > 1

        # Check threshold circumvention (Total >= threshold and individual contracts <= threshold)
        threshold_evasion = (total_amt >= self.threshold_amount) and any(a <= self.threshold_amount for a in amts)

        # Risk scoring
        score = 0.0
        reasons: List[str] = []

        # 1. Cluster size component (up to 25 pts)
        size_pts = min(25.0, 12.5 * (k - 1))
        score += size_pts
        reasons.append(f"Work split across {k} contracts in category '{cat}'")

        # 2. Temporal proximity component (up to 25 pts)
        if span_days <= 14:
            score += 25.0
            reasons.append(f"Sanctioned in rapid succession within {span_days} days (<= 14 days)")
        elif span_days <= 30:
            score += 20.0
            reasons.append(f"Sanctioned within short {span_days}-day window (<= 30 days)")
        elif span_days <= 60:
            score += 15.0
            reasons.append(f"Sanctioned within {span_days}-day window")
        else:
            score += 10.0

        # 3. Threshold evasion component (up to 30 pts)
        if threshold_evasion:
            score += 30.0
            reasons.append(
                f"Statutory tender threshold circumvention: Total INR {total_amt:,.0f} exceeds "
                f"threshold INR {self.threshold_amount:,.0f} while individual contracts remain below"
            )
        elif total_amt >= 2 * self.threshold_amount:
            score += 15.0
            reasons.append(f"High cumulative value INR {total_amt:,.0f}")

        # 4. Syndicate cross-vendor multiplier (up to 20 pts)
        if is_cross_vendor:
            score += 20.0
            reasons.append(f"Syndicate collusion: Split across {len(vendors)} sister shell contractors under same bank account")
        elif is_syndicate:
            score += 10.0
            reasons.append("Awarded to member of identified shell contractor syndicate")

        score = float(min(100.0, max(0.0, score)))

        return {
            "Cluster_ID": cluster_id,
            "Effective_Entity_ID": entity_id,
            "Entity_Type": "SYNDICATE" if is_syndicate else "VENDOR",
            "MP_ID": mp_id,
            "Project_Category": cat,
            "Project_Count": k,
            "Total_Split_Amount_INR": total_amt,
            "Average_Amount_INR": avg_amt,
            "Min_Date": min_date.strftime("%Y-%m-%d"),
            "Max_Date": max_date.strftime("%Y-%m-%d"),
            "Span_Days": span_days,
            "Unique_Vendors_Count": len(vendors),
            "Vendors_Involved": vendors,
            "Project_IDs": p_ids,
            "Is_Syndicate_Split": is_cross_vendor,
            "Threshold_Evasion_Flag": threshold_evasion,
            "Work_Splitting_Risk_Score": round(score, 2),
            "Evidence_Reasons": reasons,
        }

    def export_results(self, output_dir: str = "outputs/graph") -> Dict[str, str]:
        """Exports work splitting summaries to CSV and JSON."""
        if not self.is_detected:
            self.detect_work_splitting()

        os.makedirs(output_dir, exist_ok=True)
        paths = {
            "work_splitting_summary_csv": os.path.join(output_dir, "work_splitting_summary.csv"),
            "work_splitting_summary_json": os.path.join(output_dir, "work_splitting_summary.json"),
        }

        self.df_split_clusters.to_csv(paths["work_splitting_summary_csv"], index=False)
        records = self.df_split_clusters.to_dict(orient="records")
        with open(paths["work_splitting_summary_json"], "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)

        print(f"[+] Successfully exported work splitting outputs to: '{output_dir}/'")
        return paths


# ---------------------------------------------------------------------------
# 5. Phase 3 — Task 6: Network Topology & Cartel Centrality Analyzer
# ---------------------------------------------------------------------------

class NetworkCentralityAnalyzer:
    """
    Phase 3 — Task 6: Network Topology & Cartel Centrality Analyzer

    Evaluates structural power, systemic influence, and hub connectivity across the
    heterogeneous procurement graph.

    Core Capabilities:
    1. Cartel Ringleader Identification:
       Profiles each shell syndicate to isolate the primary orchestrator/ringleader
       (highest funding capture and project awards) vs dormant paper-bidding shell companies.
    2. Cross-Jurisdiction Spanning / Bridge Score:
       Measures whether a vendor operates across multiple states, districts, and MPs,
       distinguishing normal hyper-local vendors from multi-jurisdiction cartels.
    3. Capital Flow PageRank:
       Executes power-iteration PageRank over the MP-Vendor capital flow bipartite network
       to rank systemic capital concentration hubs.
    4. Composite Network Risk Score (0–100):
       Combines ringleader status, PageRank capital hub score, bridge score, and degree.
    """

    def __init__(
        self,
        graph: MPLADSGraphBuilder,
        syndicate_detector: Optional[VendorCollusionDetector] = None,
        concentration_detector: Optional[MPVendorConcentrationDetector] = None,
    ):
        self.graph = graph
        self.syndicate_detector = syndicate_detector
        self.concentration_detector = concentration_detector

        self.df_vendor_centrality: Optional[pd.DataFrame] = None
        self.vendor_centrality_profiles: Dict[str, Dict[str, Any]] = {}
        self.is_analyzed: bool = False

    def analyze_centrality(self) -> "NetworkCentralityAnalyzer":
        """Executes full network centrality, ringleader profiling, and PageRank analysis."""
        if not self.graph.is_graph_built:
            self.graph.build_graph()

        # Ensure syndicate detector is run if available
        if self.syndicate_detector is not None and not self.syndicate_detector.is_detected:
            self.syndicate_detector.detect_syndicates()

        # 1. Extract Vendor Basic Degree & Capital Metrics
        vendor_data: Dict[str, Dict[str, Any]] = {}
        for v_id in self.graph.nodes_by_type.get("VENDOR", set()):
            v_attrs = self.graph.nodes[v_id]["attributes"]
            incoming_projects = self.graph.adj_in[v_id].get("AWARDED_TO", [])
            proj_ids = [p[0] for p in incoming_projects]
            total_funds = sum(
                float(self.graph.nodes[p_id]["attributes"].get("Sanctioned_Amount", 0))
                for p_id in proj_ids if p_id in self.graph.nodes
            )

            awarding_mps = set()
            districts = set()
            states = set()

            for p_id in proj_ids:
                if p_id in self.graph.nodes:
                    p_attrs = self.graph.nodes[p_id]["attributes"]
                    mp_id = p_attrs.get("MP_ID")
                    if not mp_id:
                        in_edges = self.graph.adj_in[p_id].get("ALLOCATED", [])
                        if in_edges:
                            mp_id = in_edges[0][0]
                    if mp_id:
                        awarding_mps.add(mp_id)
                    d = p_attrs.get("Constituency") or p_attrs.get("District")
                    if d:
                        districts.add(d)
                    s = p_attrs.get("State")
                    if s:
                        states.add(s)

            # Include vendor home location
            if v_attrs.get("District"):
                districts.add(v_attrs.get("District"))
            if v_attrs.get("State"):
                states.add(v_attrs.get("State"))

            vendor_data[v_id] = {
                "Vendor_ID": v_id,
                "Vendor_Name": v_attrs.get("Vendor_Name", v_id),
                "Bank_Account_ID": v_attrs.get("Bank_Account_ID", ""),
                "Project_Count": len(proj_ids),
                "Total_Sanctioned_Funds": total_funds,
                "MP_Count": len(awarding_mps),
                "District_Count": max(1, len(districts)),
                "State_Count": max(1, len(states)),
                "Syndicate_ID": "NONE",
                "Syndicate_Role": "INDEPENDENT",
                "Is_Ringleader": False,
                "Bridge_Score": 0.0,
                "PageRank": 0.0,
                "Capital_Hub_Score": 0.0,
                "Network_Risk_Score": 0.0,
            }

        # 2. Assign Syndicate Roles and Identify Primary Ringleaders
        if self.syndicate_detector is not None:
            for syn_id, syn_info in self.syndicate_detector.syndicates.items():
                members = syn_info.get("Member_Vendor_IDs") or syn_info.get("vendor_members") or []
                if not members:
                    continue

                # Sort members by (Total_Sanctioned_Funds, Project_Count) descending
                member_perf = []
                for m in members:
                    if m in vendor_data:
                        member_perf.append((
                            m,
                            vendor_data[m]["Total_Sanctioned_Funds"],
                            vendor_data[m]["Project_Count"]
                        ))
                    else:
                        member_perf.append((m, 0.0, 0))

                member_perf.sort(key=lambda x: (x[1], x[2]), reverse=True)
                top_member, top_funds, top_proj = member_perf[0]

                for m, funds, projs in member_perf:
                    if m not in vendor_data:
                        continue
                    vendor_data[m]["Syndicate_ID"] = syn_id
                    if funds > 0 and (m == top_member or funds == top_funds):
                        vendor_data[m]["Syndicate_Role"] = "PRIMARY_RINGLEADER"
                        vendor_data[m]["Is_Ringleader"] = True
                    elif funds > 0:
                        vendor_data[m]["Syndicate_Role"] = "ACTIVE_PARTICIPANT"
                        vendor_data[m]["Is_Ringleader"] = False
                    else:
                        vendor_data[m]["Syndicate_Role"] = "SHELL_COVER_BIDDER"
                        vendor_data[m]["Is_Ringleader"] = False

        # 3. Compute Cross-Jurisdiction Spanning / Bridge Score
        for v_id, d in vendor_data.items():
            dist_pts = max(0, d["District_Count"] - 1) * 8.0
            state_pts = max(0, d["State_Count"] - 1) * 15.0
            mp_pts = max(0, d["MP_Count"] - 1) * 5.0
            bridge_score = float(min(100.0, dist_pts + state_pts + mp_pts))
            d["Bridge_Score"] = round(bridge_score, 2)

        # 4. Compute Pure-Python Capital Flow PageRank over MP -> Vendor Graph
        # Node index mapping
        all_nodes = list(self.graph.nodes_by_type.get("MP", set())) + list(self.graph.nodes_by_type.get("VENDOR", set()))
        node_idx = {nid: idx for idx, nid in enumerate(all_nodes)}
        n_total = len(all_nodes)

        if n_total > 0:
            # Build transition probabilities from MPs to Vendors
            # Outgoing weights from MP
            out_weights: Dict[int, Dict[int, float]] = defaultdict(lambda: defaultdict(float))
            out_totals: Dict[int, float] = defaultdict(float)

            for p_id in self.graph.nodes_by_type.get("PROJECT", set()):
                p_attrs = self.graph.nodes[p_id]["attributes"]
                v_id = p_attrs.get("Contractor_ID", "")
                if not v_id:
                    edges = self.graph.adj_out[p_id].get("AWARDED_TO", [])
                    if edges:
                        v_id = edges[0][0]
                mp_id = p_attrs.get("MP_ID", "")
                if not mp_id:
                    in_edges = self.graph.adj_in[p_id].get("ALLOCATED", [])
                    if in_edges:
                        mp_id = in_edges[0][0]

                amt = float(p_attrs.get("Sanctioned_Amount", 1.0))
                if mp_id in node_idx and v_id in node_idx:
                    u = node_idx[mp_id]
                    v = node_idx[v_id]
                    out_weights[u][v] += amt
                    out_totals[u] += amt

            # Power iteration
            d_factor = 0.85
            p = np.full(n_total, 1.0 / n_total, dtype=np.float64)

            for _ in range(25):
                p_next = np.full(n_total, (1.0 - d_factor) / n_total, dtype=np.float64)
                for u, neighbors in out_weights.items():
                    tot = out_totals[u]
                    if tot > 0:
                        contrib = d_factor * (p[u] / tot)
                        for v, wt in neighbors.items():
                            p_next[v] += contrib * wt
                    else:
                        # dangling
                        p_next += (d_factor * p[u]) / n_total
                p = p_next

            # Map PageRank back to vendor data and compute percentile Capital Hub Score
            vendor_prs = []
            for v_id in vendor_data:
                if v_id in node_idx:
                    idx = node_idx[v_id]
                    pr_val = float(p[idx])
                    vendor_data[v_id]["PageRank"] = pr_val
                    vendor_prs.append(pr_val)

            # Compute percentile ranks for vendors
            if vendor_prs:
                pr_array = np.array(vendor_prs)
                # Percentile rank scaling
                pr_min = float(pr_array.min())
                pr_max = float(pr_array.max())
                pr_range = pr_max - pr_min if pr_max > pr_min else 1.0

                for v_id, d in vendor_data.items():
                    pr_val = d["PageRank"]
                    hub_score = float(min(100.0, max(0.0, ((pr_val - pr_min) / pr_range) * 100.0)))
                    d["Capital_Hub_Score"] = round(hub_score, 2)

        # 5. Calculate Composite Network Risk Score (0–100)
        for v_id, d in vendor_data.items():
            ringleader_pts = 35.0 if d["Is_Ringleader"] else (15.0 if d["Syndicate_Role"] == "ACTIVE_PARTICIPANT" else 0.0)
            hub_pts = d["Capital_Hub_Score"] * 0.30
            bridge_pts = d["Bridge_Score"] * 0.20
            mp_deg_pts = min(100.0, max(0, d["MP_Count"] - 1) * 25.0) * 0.15

            net_score = float(min(100.0, max(0.0, ringleader_pts + hub_pts + bridge_pts + mp_deg_pts)))
            d["Network_Risk_Score"] = round(net_score, 2)

        self.vendor_centrality_profiles = vendor_data
        self.df_vendor_centrality = pd.DataFrame(list(vendor_data.values()))
        self.is_analyzed = True
        return self

    def export_results(self, output_dir: str = "outputs/graph") -> Dict[str, str]:
        """Exports network centrality profiles to CSV and JSON."""
        if not self.is_analyzed:
            self.analyze_centrality()

        os.makedirs(output_dir, exist_ok=True)
        paths = {
            "network_centrality_summary_csv": os.path.join(output_dir, "network_centrality_summary.csv"),
            "network_centrality_summary_json": os.path.join(output_dir, "network_centrality_summary.json"),
        }

        self.df_vendor_centrality.to_csv(paths["network_centrality_summary_csv"], index=False)
        records = self.df_vendor_centrality.to_dict(orient="records")
        with open(paths["network_centrality_summary_json"], "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)

        print(f"[+] Successfully exported network centrality outputs to: '{output_dir}/'")
        return paths


# ---------------------------------------------------------------------------
# 6. Phase 3 — Task 7: Unified Multi-Layer Governance Risk Fusion Engine
# ---------------------------------------------------------------------------

class UnifiedGraphRiskEngine:
    """
    Phase 3 — Task 7: Unified Multi-Layer Governance Risk Fusion Engine

    Synthesizes project-level tabular ML anomaly detection (Phase 2 Isolation Forest)
    with all multi-entity network intelligence signals from Phase 3 into a definitive,
    auditable Vigilance Priority Index (VPI).

    Risk Signal Layers:
    1. Project Physical & Financial ML Anomaly Score (Phase 2): 30% weight
    2. Shell Contractor Syndicate & Shared Bank Account Collusion (Task 3): 25% weight
    3. MP Allocation Concentration & Favoritism (Task 4): 15% weight
    4. Work Splitting & Tender Slicing (Task 5): 15% weight
    5. Network Centrality, Ringleader & Capital Hub Status (Task 6): 15% weight

    Outputs:
    - Comprehensive Project Risk Profiles (100,000 records)
    - Comprehensive Vendor Governance Profiles (50,000 records)
    - Comprehensive MP Allocation Profiles (100 records)
    - Markdown Executive Forensic Summary Report
    """

    def __init__(
        self,
        graph: MPLADSGraphBuilder,
        syndicate_detector: VendorCollusionDetector,
        concentration_detector: MPVendorConcentrationDetector,
        work_splitting_detector: WorkSplittingDetector,
        centrality_analyzer: NetworkCentralityAnalyzer,
        weights: Optional[Dict[str, float]] = None,
    ):
        self.graph = graph
        self.syndicate_detector = syndicate_detector
        self.concentration_detector = concentration_detector
        self.work_splitting_detector = work_splitting_detector
        self.centrality_analyzer = centrality_analyzer

        self.weights = weights or {
            "ml": 0.30,
            "syndicate": 0.25,
            "concentration": 0.15,
            "splitting": 0.15,
            "centrality": 0.15,
        }

        self.df_project_master_risk: Optional[pd.DataFrame] = None
        self.df_vendor_master_risk: Optional[pd.DataFrame] = None
        self.df_mp_master_risk: Optional[pd.DataFrame] = None
        self.is_fused: bool = False

    def fuse_risk_scores(self, ml_risk_scores: Optional[Dict[str, float]] = None) -> "UnifiedGraphRiskEngine":
        """Fuses all Phase 2 and Phase 3 risk components into a unified Vigilance Priority Index."""
        # 1. Ensure all upstream detectors have executed
        if not self.syndicate_detector.is_detected:
            self.syndicate_detector.detect_syndicates()
        if not self.concentration_detector.is_calculated:
            self.concentration_detector.calculate_concentration()
        if not self.work_splitting_detector.is_detected:
            self.work_splitting_detector.detect_work_splitting()
        if not self.centrality_analyzer.is_analyzed:
            self.centrality_analyzer.analyze_centrality()

        ml_scores = ml_risk_scores or {}

        # Build MP concentration profile map
        mp_prof_map: Dict[str, Dict[str, Any]] = {}
        if self.concentration_detector.df_mp_concentration is not None and not self.concentration_detector.df_mp_concentration.empty:
            for r in self.concentration_detector.df_mp_concentration.to_dict(orient="records"):
                mp_prof_map[r["MP_ID"]] = r
        elif hasattr(self.concentration_detector, "mp_records") and self.concentration_detector.mp_records:
            for r in self.concentration_detector.mp_records:
                mp_prof_map[r["MP_ID"]] = r

        # 2. Extract Project-level signals
        project_records: List[Dict[str, Any]] = []
        w_ml = self.weights["ml"]
        w_syn = self.weights["syndicate"]
        w_conc = self.weights["concentration"]
        w_split = self.weights["splitting"]
        w_cent = self.weights["centrality"]

        for p_id in self.graph.nodes_by_type.get("PROJECT", set()):
            attrs = self.graph.nodes[p_id]["attributes"]
            v_id = attrs.get("Contractor_ID", "")
            if not v_id:
                edges = self.graph.adj_out[p_id].get("AWARDED_TO", [])
                if edges:
                    v_id = edges[0][0]
            mp_id = attrs.get("MP_ID", "")
            if not mp_id:
                in_edges = self.graph.adj_in[p_id].get("ALLOCATED", [])
                if in_edges:
                    mp_id = in_edges[0][0]

            amt = float(attrs.get("Sanctioned_Amount", 0))
            category = str(attrs.get("Project_Category", "General"))
            constituency = str(attrs.get("Constituency", ""))
            state = str(attrs.get("State", ""))

            # Signal 1: ML Score
            s_ml = float(ml_scores.get(p_id, 15.0))  # 15.0 represents clean baseline

            # Signal 2: Syndicate Collusion Score
            v_prof = self.syndicate_detector.vendor_profiles.get(v_id, {})
            s_syn = float(v_prof.get("Collusion_Risk_Score", 0.0))
            syndicate_id = v_prof.get("Syndicate_ID", "NONE")

            # Signal 3: MP Allocation Concentration Score
            mp_prof = mp_prof_map.get(mp_id, {})
            s_conc = float(mp_prof.get("Allocation_Risk_Score", 0.0))

            # Signal 4: Work Splitting Score
            split_info = self.work_splitting_detector.project_split_map.get(p_id, {})
            s_split = float(split_info.get("Split_Risk_Score", 0.0))
            is_split = split_info.get("Is_Split_Work", False)

            # Signal 5: Network Centrality / Ringleader Score
            v_cent = self.centrality_analyzer.vendor_centrality_profiles.get(v_id, {})
            s_cent = float(v_cent.get("Network_Risk_Score", 0.0))
            is_ringleader = v_cent.get("Is_Ringleader", False)
            syn_role = v_cent.get("Syndicate_Role", "INDEPENDENT")

            # Unified VPI
            vpi = (w_ml * s_ml) + (w_syn * s_syn) + (w_conc * s_conc) + (w_split * s_split) + (w_cent * s_cent)
            vpi = float(min(100.0, max(0.0, vpi)))

            # Priority Tier
            if vpi >= 75.0:
                tier = "CRITICAL"
            elif vpi >= 50.0:
                tier = "HIGH"
            elif vpi >= 25.0:
                tier = "MEDIUM"
            else:
                tier = "LOW"

            # Explainability forensic triggers
            reasons: List[str] = []
            if s_ml >= 50.0:
                reasons.append(f"[ML_ANOMALY] Physical/financial anomaly score {s_ml:.1f}/100")
            if s_syn > 0.0:
                reasons.append(f"[SYNDICATE] Contractor in {syndicate_id} (Shared Bank Collusion Risk: {s_syn:.1f})")
            if is_ringleader:
                reasons.append("[RINGLEADER] Contractor is primary orchestrator of shell syndicate")
            elif syn_role == "SHELL_COVER_BIDDER":
                reasons.append("[SHELL_ENTITY] Contractor identified as paper-bidding shell entity")
            if is_split:
                reasons.append(f"[WORK_SPLIT] Contract part of split cluster {split_info.get('Split_Cluster_ID')} (Risk: {s_split:.1f})")
            if s_conc >= 70.0:
                reasons.append(f"[MP_FAVORITISM] Awarded by high-concentration MP {mp_id} (Allocation Risk: {s_conc:.1f})")

            if not reasons:
                reasons.append("Parameters within standard vigilance tolerances across all forensic layers")

            project_records.append({
                "Project_ID": p_id,
                "MP_ID": mp_id,
                "Contractor_ID": v_id,
                "Sanctioned_Amount": amt,
                "Project_Category": category,
                "Constituency": constituency,
                "State": state,
                "Syndicate_ID": syndicate_id,
                "Syndicate_Role": syn_role,
                "Is_Syndicate_Ringleader": is_ringleader,
                "Is_Split_Work": is_split,
                "Score_ML_Anomaly": round(s_ml, 2),
                "Score_Syndicate_Collusion": round(s_syn, 2),
                "Score_MP_Concentration": round(s_conc, 2),
                "Score_Work_Splitting": round(s_split, 2),
                "Score_Network_Centrality": round(s_cent, 2),
                "Vigilance_Priority_Index": round(vpi, 2),
                "Priority_Tier": tier,
                "Forensic_Explanation": "; ".join(reasons),
            })

        self.df_project_master_risk = pd.DataFrame(project_records)

        # 3. Aggregate to Vendor Master Profile
        vendor_agg = self.df_project_master_risk.groupby("Contractor_ID").agg(
            Project_Count=("Project_ID", "count"),
            Total_Sanctioned_INR=("Sanctioned_Amount", "sum"),
            Avg_VPI=("Vigilance_Priority_Index", "mean"),
            Max_VPI=("Vigilance_Priority_Index", "max"),
            Critical_Projects=("Priority_Tier", lambda s: (s == "CRITICAL").sum()),
            High_Projects=("Priority_Tier", lambda s: (s == "HIGH").sum()),
            Syndicate_ID=("Syndicate_ID", "first"),
            Syndicate_Role=("Syndicate_Role", "first"),
            Is_Ringleader=("Is_Syndicate_Ringleader", "first"),
        ).reset_index()

        vendor_agg["Vendor_Governance_Score"] = (
            vendor_agg["Avg_VPI"] * 0.40 +
            vendor_agg["Max_VPI"] * 0.40 +
            np.where(vendor_agg["Is_Ringleader"], 20.0, 0.0)
        ).clip(0.0, 100.0).round(2)

        self.df_vendor_master_risk = vendor_agg

        # 4. Aggregate to MP Master Profile
        mp_agg = self.df_project_master_risk.groupby("MP_ID").agg(
            Total_Projects=("Project_ID", "count"),
            Total_Allocated_INR=("Sanctioned_Amount", "sum"),
            Avg_Project_VPI=("Vigilance_Priority_Index", "mean"),
            Critical_Projects=("Priority_Tier", lambda s: (s == "CRITICAL").sum()),
            High_Projects=("Priority_Tier", lambda s: (s == "HIGH").sum()),
            Syndicate_Projects=("Syndicate_ID", lambda s: (s != "NONE").sum()),
            Split_Projects=("Is_Split_Work", "sum"),
        ).reset_index()

        # Merge Task 4 concentration score
        mp_conc_scores = {
            m: prof.get("Allocation_Risk_Score", 0.0)
            for m, prof in mp_prof_map.items()
        }
        mp_agg["Allocation_Risk_Score"] = mp_agg["MP_ID"].map(mp_conc_scores).fillna(0.0).round(2)
        mp_agg["MP_Vigilance_Master_Score"] = (
            mp_agg["Allocation_Risk_Score"] * 0.50 +
            mp_agg["Avg_Project_VPI"] * 0.30 +
            (mp_agg["Critical_Projects"] * 5.0).clip(0.0, 20.0)
        ).clip(0.0, 100.0).round(2)

        self.df_mp_master_risk = mp_agg
        self.is_fused = True
        return self

    def export_results(self, output_dir: str = "outputs/graph") -> Dict[str, str]:
        """Exports unified master risk profiles and markdown report."""
        if not self.is_fused:
            self.fuse_risk_scores()

        os.makedirs(output_dir, exist_ok=True)
        paths = {
            "project_master_risk_csv": os.path.join(output_dir, "comprehensive_project_risk.csv"),
            "vendor_master_risk_csv": os.path.join(output_dir, "comprehensive_vendor_risk.csv"),
            "mp_master_risk_csv": os.path.join(output_dir, "comprehensive_mp_risk.csv"),
            "final_report_md": os.path.join(output_dir, "phase3_final_report.md"),
        }

        self.df_project_master_risk.to_csv(paths["project_master_risk_csv"], index=False)
        self.df_vendor_master_risk.to_csv(paths["vendor_master_risk_csv"], index=False)
        self.df_mp_master_risk.to_csv(paths["mp_master_risk_csv"], index=False)

        # Generate Executive Markdown Report
        n_proj = len(self.df_project_master_risk)
        n_crit = int((self.df_project_master_risk["Priority_Tier"] == "CRITICAL").sum())
        n_high = int((self.df_project_master_risk["Priority_Tier"] == "HIGH").sum())
        n_med = int((self.df_project_master_risk["Priority_Tier"] == "MEDIUM").sum())
        n_low = int((self.df_project_master_risk["Priority_Tier"] == "LOW").sum())

        report_content = f"""# MPLADS AI Fraud Detection & Network Intelligence System
## Phase 3 — Executive Master Forensic Report

**Date:** {time.strftime('%B %d, %Y')}  
**Total Projects Analyzed:** {n_proj:,}  
**Total Public Works Expenditure Tracked:** INR {self.df_project_master_risk['Sanctioned_Amount'].sum():,.0f}  

---

### 1. Vigilance Priority Index (VPI) Distribution
- **CRITICAL Risk Projects (>= 75.0 VPI):** {n_crit:,} ({n_crit/n_proj*100:.2f}%)
- **HIGH Risk Projects (50.0 - 74.9 VPI):** {n_high:,} ({n_high/n_proj*100:.2f}%)
- **MEDIUM Risk Projects (25.0 - 49.9 VPI):** {n_med:,} ({n_med/n_proj*100:.2f}%)
- **LOW Risk Projects (< 25.0 VPI):** {n_low:,} ({n_low/n_proj*100:.2f}%)

---

### 2. Multi-Layer Intelligence Summary
- **Shell Contractor Cartels (Task 3):** Exactly {len(self.syndicate_detector.syndicates)} shared bank cartels identifying {len(self.syndicate_detector.vendor_profiles)} vendors.
- **MP Allocation Favoritism (Task 4):** Identified {len(self.df_mp_master_risk)} MP portfolios analyzed for HHI and cartel capture.
- **Work Splitting / Tender Slicing (Task 5):** {len(self.work_splitting_detector.split_clusters)} split clusters identified evading GFR procurement thresholds.
- **Cartel Ringleaders (Task 6):** {int((self.df_vendor_master_risk['Is_Ringleader']).sum())} primary cartel orchestrators isolated.

---
*Report automatically generated by UnifiedGraphRiskEngine (Phase 3 Complete).*
"""
        with open(paths["final_report_md"], "w", encoding="utf-8") as f:
            f.write(report_content)

        print(f"[+] Successfully exported Unified Master Risk outputs to: '{output_dir}/'")
        return paths


# ---------------------------------------------------------------------------
# 7. Standalone Self-Tests
# ---------------------------------------------------------------------------

def test_graph_builder(data_dir: str = "data") -> bool:
    """
    Executes a comprehensive functional self-test on the real dataset for MPLADSGraphBuilder.
    """
    print("\n[Self-Test 1/3] Initializing MPLADSGraphBuilder test on data/...")
    print("\n[Self-Test 1/6] Initializing MPLADSGraphBuilder test on data/...")
    builder = MPLADSGraphBuilder(data_dir=data_dir)
    builder.load_data()
    builder.build_graph()

    val = builder.validate_graph()
    assert val["status"] == "VALID", f"Graph validation failed with violations: {val['violations']}"
    assert builder.get_node_count("MP") == 100, "MP count must be 100"
    assert builder.get_node_count("PROJECT") == 100000, "Project count must be 100,000"
    assert builder.get_node_count("VENDOR") == 50000, "Vendor count must be 50,000"
    assert builder.get_node_count("BANK_ACCOUNT") == 49100, "Bank account count must be 49,100"
    assert builder.get_edge_count() == 250000, "Total edges must be 250,000"

    print("[Self-Test 1/3] MPLADSGraphBuilder passed successfully! [PASS]")
    print("[Self-Test 1/6] MPLADSGraphBuilder passed successfully! [PASS]")
    return True


def test_vendor_collusion_detector() -> bool:
    """
    Executes an in-memory self-test of VendorCollusionDetector on a synthetic topology:
    
    Shared Syndicate:
    Vendor A ─┐
    Vendor B ─┼── BANK_SHARED
    Vendor C ─┘

    Legitimate Vendor:
    Vendor D ─── BANK_UNIQUE
    """
    print("\n[Self-Test 2/3] Initializing VendorCollusionDetector in-memory test...")
    print("\n[Self-Test 2/6] Initializing VendorCollusionDetector in-memory test...")
    builder = MPLADSGraphBuilder(data_dir="")
    
    # 1. Add Bank Account nodes
    builder.add_node("BANK_SHARED", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_SHARED", "is_shared_account": True, "member_count": 3})
    builder.add_node("BANK_UNIQUE", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_UNIQUE", "is_shared_account": False, "member_count": 1})
    
    # 2. Add Vendor nodes
    builder.add_node("V_A", "VENDOR", {"Vendor_ID": "V_A", "Vendor_Name": "Vendor A", "Bank_Account_ID": "BANK_SHARED", "State": "State-1", "District": "District-1"})
    builder.add_node("V_B", "VENDOR", {"Vendor_ID": "V_B", "Vendor_Name": "Vendor B", "Bank_Account_ID": "BANK_SHARED", "State": "State-1", "District": "District-2"})
    builder.add_node("V_C", "VENDOR", {"Vendor_ID": "V_C", "Vendor_Name": "Vendor C", "Bank_Account_ID": "BANK_SHARED", "State": "State-2", "District": "District-3"})
    builder.add_node("V_D", "VENDOR", {"Vendor_ID": "V_D", "Vendor_Name": "Vendor D", "Bank_Account_ID": "BANK_UNIQUE", "State": "State-1", "District": "District-1"})
    
    # 3. Add USES_BANK_ACCOUNT edges
    builder.add_edge("V_A", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_B", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_C", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_D", "BANK_UNIQUE", "USES_BANK_ACCOUNT")

    # 4. Add Project and MP nodes with allocations
    builder.add_node("MP_1", "MP", {"MP_ID": "MP_1", "Constituency": "Constituency-1"})
    builder.add_node("P_1", "PROJECT", {"Project_ID": "P_1", "Sanctioned_Amount": 5000000, "Constituency": "Constituency-1"})
    builder.add_edge("MP_1", "P_1", "ALLOCATED")
    builder.add_edge("P_1", "V_A", "AWARDED_TO", {"Sanctioned_Amount": 5000000})

    builder.is_graph_built = True

    # 5. Run Detector
    detector = VendorCollusionDetector(graph=builder)
    detector.detect_syndicates()

    # Assertion 1: Shared bank group is detected
    assert len(detector.syndicates) == 1, "Must detect exactly 1 shared bank group"

    # Assertion 2: Correct number of members is detected
    synd_summary = detector.get_syndicate_summary()
    assert synd_summary.iloc[0]["Syndicate_Size"] == 3, "Detected syndicate size must be exactly 3"
    assert synd_summary.iloc[0]["Bank_Account_ID"] == "BANK_SHARED"

    # Assertion 3: All shared-account vendors receive a syndicate ID
    for v_id in ["V_A", "V_B", "V_C"]:
        prof = detector.get_vendor_syndicate(v_id)
        assert prof is not None, f"Shared vendor {v_id} must receive a profile"
        assert prof["Syndicate_ID"] == "SYNDICATE_001", f"{v_id} must be assigned to SYNDICATE_001"
        assert prof["Is_Shared_Account"] is True

    # Assertion 4: Unique-bank vendor is NOT assigned to a syndicate
    v_d_prof = detector.get_vendor_syndicate("V_D")
    assert v_d_prof is None, "Unique-bank vendor V_D must NOT be assigned to a syndicate"

    # Assertion 5: Shared group receives a higher collusion risk than unique vendor baseline (0.0)
    shared_risk = synd_summary.iloc[0]["Syndicate_Collusion_Risk"]
    unique_risk = detector.vendor_profiles["V_D"]["Collusion_Risk_Score"]
    assert shared_risk > unique_risk, f"Shared risk ({shared_risk}) must be higher than unique baseline ({unique_risk})"
    assert unique_risk == 0.0, "Unique vendor baseline risk must be 0.0"

    # Assertion 6: Risk scores remain within 0 <= score <= 100
    assert 0.0 <= shared_risk <= 100.0, f"Shared risk ({shared_risk}) must be between 0 and 100"
    for v_prof in detector.vendor_profiles.values():
        score = v_prof["Collusion_Risk_Score"]
        assert 0.0 <= score <= 100.0, f"Score {score} out of bounds"

    print("[Self-Test 2/3] VendorCollusionDetector in-memory assertions passed successfully! [PASS]")
    print("[Self-Test 2/6] VendorCollusionDetector in-memory assertions passed successfully! [PASS]")
    return True


def test_mp_concentration_detector() -> bool:
    """
    Executes an in-memory test of MPVendorConcentrationDetector on a synthetic multi-MP topology:
    
    MP_A:
    - Project 1: INR 100,000,000 to Vendor_A
    - Project 2: INR 100,000,000 to Vendor_B
    - Project 3: INR 100,000,000 to Vendor_C
    Total: INR 300,000,000.
    Vendor_A and Vendor_B belong to the same syndicate (BANK_SHARED).
    Vendor_C belongs to BANK_UNIQUE_C.
    Expected:
    - Vendor CR1 = 33.33% (1/3)
    - Syndicate CR1 = 66.67% (2/3)
    - Syndicate CR1 > Vendor CR1

    MP_B:
    - 10 projects of INR 10,000,000 each awarded to 10 unique vendors.
    Expected:
    - Low concentration, Vendor CR1 = 10.0%, Vendor HHI = 0.10.
    Executes an in-memory test of MPVendorConcentrationDetector on a synthetic multi-MP topology.
    """
    print("\n[Self-Test 3/3] Initializing MPVendorConcentrationDetector in-memory test...")
    print("\n[Self-Test 3/6] Initializing MPVendorConcentrationDetector in-memory test...")
    builder = MPLADSGraphBuilder(data_dir="")

    # Add Bank Account nodes
    builder.add_node("BANK_SHARED", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_SHARED", "is_shared_account": True, "member_count": 2})
    builder.add_node("BANK_UNIQUE_C", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_UNIQUE_C", "is_shared_account": False, "member_count": 1})

    # Add MP nodes
    builder.add_node("MP_A", "MP", {"MP_ID": "MP_A", "MP_Name": "Representative A", "State": "State-1", "Constituency": "Const-A"})
    builder.add_node("MP_B", "MP", {"MP_ID": "MP_B", "MP_Name": "Representative B", "State": "State-2", "Constituency": "Const-B"})

    # MP_A Vendors & Projects
    builder.add_node("V_A", "VENDOR", {"Vendor_ID": "V_A", "Vendor_Name": "Vendor A", "Bank_Account_ID": "BANK_SHARED"})
    builder.add_node("V_B", "VENDOR", {"Vendor_ID": "V_B", "Vendor_Name": "Vendor B", "Bank_Account_ID": "BANK_SHARED"})
    builder.add_node("V_C", "VENDOR", {"Vendor_ID": "V_C", "Vendor_Name": "Vendor C", "Bank_Account_ID": "BANK_UNIQUE_C"})

    builder.add_edge("V_A", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_B", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_C", "BANK_UNIQUE_C", "USES_BANK_ACCOUNT")

    builder.add_node("P_A1", "PROJECT", {"Project_ID": "P_A1", "Sanctioned_Amount": 100000000})
    builder.add_node("P_A2", "PROJECT", {"Project_ID": "P_A2", "Sanctioned_Amount": 100000000})
    builder.add_node("P_A3", "PROJECT", {"Project_ID": "P_A3", "Sanctioned_Amount": 100000000})

    builder.add_edge("MP_A", "P_A1", "ALLOCATED")
    builder.add_edge("MP_A", "P_A2", "ALLOCATED")
    builder.add_edge("MP_A", "P_A3", "ALLOCATED")

    builder.add_edge("P_A1", "V_A", "AWARDED_TO", {"Sanctioned_Amount": 100000000})
    builder.add_edge("P_A2", "V_B", "AWARDED_TO", {"Sanctioned_Amount": 100000000})
    builder.add_edge("P_A3", "V_C", "AWARDED_TO", {"Sanctioned_Amount": 100000000})

    # MP_B Vendors & Projects (10 equal vendors)
    for i in range(1, 11):
        v_id = f"V_B{i}"
        b_id = f"BANK_B{i}"
        p_id = f"P_B{i}"
        builder.add_node(b_id, "BANK_ACCOUNT", {"Bank_Account_ID": b_id, "is_shared_account": False, "member_count": 1})
        builder.add_node(v_id, "VENDOR", {"Vendor_ID": v_id, "Vendor_Name": f"Vendor B{i}", "Bank_Account_ID": b_id})
        builder.add_edge(v_id, b_id, "USES_BANK_ACCOUNT")
        builder.add_node(p_id, "PROJECT", {"Project_ID": p_id, "Sanctioned_Amount": 10000000})
        builder.add_edge("MP_B", p_id, "ALLOCATED")
        builder.add_edge(p_id, v_id, "AWARDED_TO", {"Sanctioned_Amount": 10000000})

    builder.is_graph_built = True

    # Run syndicate detector first
    syn_detector = VendorCollusionDetector(graph=builder)
    syn_detector.detect_syndicates()

    # Run concentration detector
    conc_detector = MPVendorConcentrationDetector(graph=builder, syndicate_detector=syn_detector)
    conc_detector.calculate_concentration()

    df_res = conc_detector.generate_mp_concentration_summary()
    assert len(df_res) == 2, "Must process exactly 2 MPs"

    # Inspect MP_A
    row_a = df_res[df_res["MP_ID"] == "MP_A"].iloc[0]
    assert abs(row_a["Vendor_CR1"] - (1.0 / 3.0)) < 1e-3, f"Vendor CR1 should be 33.33%, got {row_a['Vendor_CR1']}"
    assert abs(row_a["Syndicate_CR1"] - (2.0 / 3.0)) < 1e-3, f"Syndicate CR1 should be 66.67%, got {row_a['Syndicate_CR1']}"
    assert row_a["Syndicate_CR1"] > row_a["Vendor_CR1"], "Syndicate CR1 must exceed Vendor CR1 for shared account"
    assert row_a["Top_Syndicate_ID"] == "SYNDICATE_001"
    assert row_a["Top_Syndicate_Vendor_Count"] == 2
    assert row_a["Top_Syndicate_Funds"] == 200000000
    assert abs(row_a["Vendor_CR1"] - (1.0 / 3.0)) < 1e-3
    assert abs(row_a["Syndicate_CR1"] - (2.0 / 3.0)) < 1e-3
    assert row_a["Syndicate_CR1"] > row_a["Vendor_CR1"]

    # Inspect MP_B
    row_b = df_res[df_res["MP_ID"] == "MP_B"].iloc[0]
    assert abs(row_b["Vendor_CR1"] - 0.10) < 1e-3, f"Vendor CR1 should be 10%, got {row_b['Vendor_CR1']}"
    assert abs(row_b["Vendor_HHI_Raw"] - 0.10) < 1e-3, f"Vendor HHI should be 0.10, got {row_b['Vendor_HHI_Raw']}"
    assert row_b["Top_Syndicate_ID"] == "NONE"
    assert row_b["Top_Syndicate_Funds"] == 0
    assert abs(row_b["Vendor_CR1"] - 0.10) < 1e-3

    # General Mathematical bounds
    for _, r in df_res.iterrows():
        assert 0.0 <= r["Vendor_HHI_Raw"] <= 1.0
        assert 0.0 <= r["Vendor_CR1"] <= 1.0
        assert 0.0 <= r["Vendor_CR3"] <= 1.0
        assert r["Vendor_CR3"] >= r["Vendor_CR1"] - 1e-5
        assert 0.0 <= r["Allocation_Risk_Score"] <= 100.0

    print("[Self-Test 3/3] MPVendorConcentrationDetector in-memory assertions passed successfully! [PASS]")
    print("[Self-Test 3/6] MPVendorConcentrationDetector in-memory assertions passed successfully! [PASS]")
    return True


def test_work_splitting_detector() -> bool:
    """
    Executes an in-memory self-test of WorkSplittingDetector on a synthetic topology:
    
    Vendor 1 receives 2 projects in category 'Road' within 10 days:
    - P_1: INR 4,500,000 (Sanction: 2025-02-01)
    - P_2: INR 4,800,000 (Sanction: 2025-02-10)
    Total: INR 9,300,000 > INR 5,000,000 (Threshold evasion!)
    
    Vendor 2 receives 1 project in category 'Water' 100 days later:
    - P_3: INR 3,000,000 (Sanction: 2025-06-01)
    """
    print("\n[Self-Test 4/6] Initializing WorkSplittingDetector in-memory test...")
    builder = MPLADSGraphBuilder(data_dir="")

    builder.add_node("MP_TEST", "MP", {"MP_ID": "MP_TEST", "Constituency": "Constituency-1"})
    builder.add_node("V_SPLIT", "VENDOR", {"Vendor_ID": "V_SPLIT", "Vendor_Name": "Split Contractor", "Bank_Account_ID": "B_1"})
    builder.add_node("V_CLEAN", "VENDOR", {"Vendor_ID": "V_CLEAN", "Vendor_Name": "Clean Contractor", "Bank_Account_ID": "B_2"})
    builder.add_node("B_1", "BANK_ACCOUNT", {"Bank_Account_ID": "B_1", "is_shared_account": False, "member_count": 1})
    builder.add_node("B_2", "BANK_ACCOUNT", {"Bank_Account_ID": "B_2", "is_shared_account": False, "member_count": 1})

    builder.add_edge("V_SPLIT", "B_1", "USES_BANK_ACCOUNT")
    builder.add_edge("V_CLEAN", "B_2", "USES_BANK_ACCOUNT")

    # Add projects
    builder.add_node("P_1", "PROJECT", {
        "Project_ID": "P_1", "MP_ID": "MP_TEST", "Contractor_ID": "V_SPLIT",
        "Sanctioned_Amount": 4500000, "Sanction_Date": "2025-02-01",
        "Project_Category": "Road", "Constituency": "Constituency-1"
    })
    builder.add_node("P_2", "PROJECT", {
        "Project_ID": "P_2", "MP_ID": "MP_TEST", "Contractor_ID": "V_SPLIT",
        "Sanctioned_Amount": 4800000, "Sanction_Date": "2025-02-10",
        "Project_Category": "Road", "Constituency": "Constituency-1"
    })
    builder.add_node("P_3", "PROJECT", {
        "Project_ID": "P_3", "MP_ID": "MP_TEST", "Contractor_ID": "V_CLEAN",
        "Sanctioned_Amount": 3000000, "Sanction_Date": "2025-06-01",
        "Project_Category": "Water", "Constituency": "Constituency-1"
    })

    builder.add_edge("MP_TEST", "P_1", "ALLOCATED")
    builder.add_edge("MP_TEST", "P_2", "ALLOCATED")
    builder.add_edge("MP_TEST", "P_3", "ALLOCATED")
    builder.add_edge("P_1", "V_SPLIT", "AWARDED_TO")
    builder.add_edge("P_2", "V_SPLIT", "AWARDED_TO")
    builder.add_edge("P_3", "V_CLEAN", "AWARDED_TO")

    builder.is_graph_built = True

    detector = WorkSplittingDetector(graph=builder, threshold_amount=5000000.0, time_window_days=60)
    detector.detect_work_splitting()

    assert len(detector.split_clusters) == 1, f"Expected 1 cluster, got {len(detector.split_clusters)}"
    cl = detector.split_clusters[0]
    assert cl["Project_Count"] == 2
    assert cl["Total_Split_Amount_INR"] == 9300000.0
    assert cl["Threshold_Evasion_Flag"] is True
    assert cl["Span_Days"] == 9
    assert cl["Work_Splitting_Risk_Score"] >= 50.0

    # Check project-level mappings
    df_scores = detector.df_project_split_scores
    assert len(df_scores) == 3
    p1_row = df_scores[df_scores["Project_ID"] == "P_1"].iloc[0]
    p3_row = df_scores[df_scores["Project_ID"] == "P_3"].iloc[0]
    assert bool(p1_row["Is_Split_Work"]) is True
    assert bool(p3_row["Is_Split_Work"]) is False
    assert float(p3_row["Split_Risk_Score"]) == 0.0

    print("[Self-Test 4/6] WorkSplittingDetector in-memory assertions passed successfully! [PASS]")
    return True


def test_network_centrality_analyzer() -> bool:
    """
    Executes an in-memory self-test of NetworkCentralityAnalyzer:
    - Shared Syndicate: V_A (INR 30M across 2 states) & V_B (INR 0M, shell cover bidder)
    - Independent: V_C (INR 5M)
    """
    print("\n[Self-Test 5/6] Initializing NetworkCentralityAnalyzer in-memory test...")
    builder = MPLADSGraphBuilder(data_dir="")

    builder.add_node("BANK_SHARED", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_SHARED", "is_shared_account": True, "member_count": 2})
    builder.add_node("BANK_IND", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_IND", "is_shared_account": False, "member_count": 1})

    builder.add_node("V_A", "VENDOR", {"Vendor_ID": "V_A", "Vendor_Name": "Ringleader A", "Bank_Account_ID": "BANK_SHARED", "State": "State-1", "District": "Dist-1"})
    builder.add_node("V_B", "VENDOR", {"Vendor_ID": "V_B", "Vendor_Name": "Cover Bidder B", "Bank_Account_ID": "BANK_SHARED", "State": "State-1", "District": "Dist-1"})
    builder.add_node("V_C", "VENDOR", {"Vendor_ID": "V_C", "Vendor_Name": "Indep C", "Bank_Account_ID": "BANK_IND", "State": "State-2", "District": "Dist-2"})

    builder.add_edge("V_A", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_B", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_C", "BANK_IND", "USES_BANK_ACCOUNT")

    builder.add_node("MP_1", "MP", {"MP_ID": "MP_1", "Constituency": "Const-1"})
    builder.add_node("MP_2", "MP", {"MP_ID": "MP_2", "Constituency": "Const-2"})

    builder.add_node("P_1", "PROJECT", {"Project_ID": "P_1", "Sanctioned_Amount": 20000000, "State": "State-1", "Constituency": "Const-1"})
    builder.add_node("P_2", "PROJECT", {"Project_ID": "P_2", "Sanctioned_Amount": 10000000, "State": "State-2", "Constituency": "Const-2"})
    builder.add_node("P_3", "PROJECT", {"Project_ID": "P_3", "Sanctioned_Amount": 5000000, "State": "State-2", "Constituency": "Const-2"})

    builder.add_edge("MP_1", "P_1", "ALLOCATED")
    builder.add_edge("MP_2", "P_2", "ALLOCATED")
    builder.add_edge("MP_2", "P_3", "ALLOCATED")

    builder.add_edge("P_1", "V_A", "AWARDED_TO")
    builder.add_edge("P_2", "V_A", "AWARDED_TO")
    builder.add_edge("P_3", "V_C", "AWARDED_TO")

    builder.is_graph_built = True

    syn_detector = VendorCollusionDetector(graph=builder)
    syn_detector.detect_syndicates()

    analyzer = NetworkCentralityAnalyzer(graph=builder, syndicate_detector=syn_detector)
    analyzer.analyze_centrality()

    prof_a = analyzer.vendor_centrality_profiles["V_A"]
    prof_b = analyzer.vendor_centrality_profiles["V_B"]
    prof_c = analyzer.vendor_centrality_profiles["V_C"]

    assert prof_a["Is_Ringleader"] is True
    assert prof_a["Syndicate_Role"] == "PRIMARY_RINGLEADER"
    assert prof_b["Is_Ringleader"] is False
    assert prof_b["Syndicate_Role"] == "SHELL_COVER_BIDDER"
    assert prof_c["Syndicate_Role"] == "INDEPENDENT"

    assert prof_a["Bridge_Score"] > prof_c["Bridge_Score"], "V_A spans 2 states/districts, must have higher bridge score"
    assert prof_a["Network_Risk_Score"] > prof_c["Network_Risk_Score"]

    print("[Self-Test 5/6] NetworkCentralityAnalyzer in-memory assertions passed successfully! [PASS]")
    return True


def test_unified_risk_engine() -> bool:
    """
    Executes an in-memory self-test of UnifiedGraphRiskEngine:
    Validates end-to-end multi-layer fusion of ML, Syndicate, Concentration,
    Work Splitting, and Centrality scores.
    """
    print("\n[Self-Test 6/6] Initializing UnifiedGraphRiskEngine in-memory test...")
    builder = MPLADSGraphBuilder(data_dir="")

    builder.add_node("BANK_SHARED", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_SHARED", "is_shared_account": True, "member_count": 2})
    builder.add_node("BANK_IND", "BANK_ACCOUNT", {"Bank_Account_ID": "BANK_IND", "is_shared_account": False, "member_count": 1})

    builder.add_node("V_A", "VENDOR", {"Vendor_ID": "V_A", "Vendor_Name": "Ringleader A", "Bank_Account_ID": "BANK_SHARED", "State": "State-1", "District": "Dist-1"})
    builder.add_node("V_B", "VENDOR", {"Vendor_ID": "V_B", "Vendor_Name": "Cover Bidder B", "Bank_Account_ID": "BANK_SHARED", "State": "State-1", "District": "Dist-1"})
    builder.add_node("V_C", "VENDOR", {"Vendor_ID": "V_C", "Vendor_Name": "Indep C", "Bank_Account_ID": "BANK_IND", "State": "State-2", "District": "Dist-2"})

    builder.add_edge("V_A", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_B", "BANK_SHARED", "USES_BANK_ACCOUNT")
    builder.add_edge("V_C", "BANK_IND", "USES_BANK_ACCOUNT")

    builder.add_node("MP_1", "MP", {"MP_ID": "MP_1", "Constituency": "Const-1"})
    builder.add_node("P_1", "PROJECT", {
        "Project_ID": "P_1", "MP_ID": "MP_1", "Contractor_ID": "V_A",
        "Sanctioned_Amount": 4500000, "Sanction_Date": "2025-01-01",
        "Project_Category": "Road", "Constituency": "Const-1"
    })
    builder.add_node("P_2", "PROJECT", {
        "Project_ID": "P_2", "MP_ID": "MP_1", "Contractor_ID": "V_A",
        "Sanctioned_Amount": 4800000, "Sanction_Date": "2025-01-10",
        "Project_Category": "Road", "Constituency": "Const-1"
    })
    builder.add_node("P_3", "PROJECT", {
        "Project_ID": "P_3", "MP_ID": "MP_1", "Contractor_ID": "V_C",
        "Sanctioned_Amount": 2000000, "Sanction_Date": "2025-06-01",
        "Project_Category": "Water", "Constituency": "Const-1"
    })

    builder.add_edge("MP_1", "P_1", "ALLOCATED")
    builder.add_edge("MP_1", "P_2", "ALLOCATED")
    builder.add_edge("MP_1", "P_3", "ALLOCATED")

    builder.add_edge("P_1", "V_A", "AWARDED_TO")
    builder.add_edge("P_2", "V_A", "AWARDED_TO")
    builder.add_edge("P_3", "V_C", "AWARDED_TO")

    builder.is_graph_built = True

    syn_detector = VendorCollusionDetector(graph=builder)
    conc_detector = MPVendorConcentrationDetector(graph=builder, syndicate_detector=syn_detector)
    split_detector = WorkSplittingDetector(graph=builder, syndicate_detector=syn_detector)
    cent_analyzer = NetworkCentralityAnalyzer(graph=builder, syndicate_detector=syn_detector)

    engine = UnifiedGraphRiskEngine(
        graph=builder,
        syndicate_detector=syn_detector,
        concentration_detector=conc_detector,
        work_splitting_detector=split_detector,
        centrality_analyzer=cent_analyzer,
    )

    # Pass synthetic ML score for P_1
    engine.fuse_risk_scores(ml_risk_scores={"P_1": 85.0, "P_2": 80.0, "P_3": 10.0})

    df_p = engine.df_project_master_risk
    assert len(df_p) == 3

    p1 = df_p[df_p["Project_ID"] == "P_1"].iloc[0]
    p3 = df_p[df_p["Project_ID"] == "P_3"].iloc[0]

    assert p1["Vigilance_Priority_Index"] > p3["Vigilance_Priority_Index"]
    assert p1["Priority_Tier"] in ["CRITICAL", "HIGH"]
    assert p3["Priority_Tier"] in ["LOW", "MEDIUM"]
    assert "[SYNDICATE]" in p1["Forensic_Explanation"]
    assert "[WORK_SPLIT]" in p1["Forensic_Explanation"]

    # Verify Vendor and MP master tables
    assert len(engine.df_vendor_master_risk) == 2  # V_A and V_C have projects
    assert len(engine.df_mp_master_risk) == 1

    for _, r in df_p.iterrows():
        assert 0.0 <= r["Vigilance_Priority_Index"] <= 100.0

    print("[Self-Test 6/6] UnifiedGraphRiskEngine in-memory assertions passed successfully! [PASS]")
    return True


if __name__ == "__main__":
    test_graph_builder()
    test_vendor_collusion_detector()
    test_mp_concentration_detector()
    test_work_splitting_detector()
    test_network_centrality_analyzer()
    test_unified_risk_engine()


