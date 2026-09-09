"""
Backend Configuration Module
Defines file paths, server settings, and data locations.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUTPUTS_DIR = BASE_DIR / "outputs"
GRAPH_OUTPUTS_DIR = OUTPUTS_DIR / "graph"
MODEL_PATH = BASE_DIR / "mplads_fraud_model.joblib"
BLOCKCHAIN_LEDGER_PATH = OUTPUTS_DIR / "blockchain_ledger.json"

# API Server Settings
API_TITLE = "MPLADS AI Fraud Detection & Network Intelligence System"
API_DESCRIPTION = (
    "Production REST API delivering multi-signal AI anomaly detection, "
    "heterogeneous graph forensics, shell contractor syndicate discovery, "
    "and tamper-evident blockchain audit trails for CVC and CAG auditors."
)
API_VERSION = "1.0.0"

# CORS settings
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*",
]

# Pagination Defaults
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 500

