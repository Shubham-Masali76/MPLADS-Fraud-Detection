"""
Blockchain Audit Ledger REST API Router
Provides immutable SHA-256 chain inspection and anchors human-in-the-loop auditor decisions.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import (
    AuditDecisionRequest,
    AuditDecisionResponse,
    ChainValidationResponse,
)
from backend.services.blockchain_service import blockchain_service

router = APIRouter(prefix="/blockchain", tags=["Blockchain Audit Ledger"])


@router.get("/blocks", response_model=List[Dict[str, Any]])
def get_blocks(
    limit: int = Query(50, ge=1, le=200, description="Number of blocks to retrieve"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """Retrieves immutable blocks from the SHA-256 cryptographic audit ledger."""
    return blockchain_service.get_chain(limit=limit, offset=offset)


@router.get("/validate", response_model=ChainValidationResponse)
def validate_ledger():
    """
    Verifies the cryptographic integrity of every block and hash link in the chain.
    Instantly detects any manual modification, deletion, or record forgery.
    """
    is_valid, errors = blockchain_service.validate_chain()
    latest_hash = blockchain_service.chain[-1]["block_hash"] if blockchain_service.chain else ""
    return {
        "is_valid": is_valid,
        "total_blocks": len(blockchain_service.chain),
        "latest_block_hash": latest_hash,
        "errors": errors,
    }


@router.post("/decision", response_model=AuditDecisionResponse)
def record_auditor_decision(request: AuditDecisionRequest):
    """
    Human-in-the-loop endpoint:
    Anchors a vigilance officer's review decision (APPROVE / ESCALATE / HOLD)
    as an immutable cryptographic block on the blockchain.
    """
    try:
        block = blockchain_service.record_decision(
            project_id=request.project_id,
            auditor_id=request.auditor_id,
            decision=request.decision,
            notes=request.notes or "",
        )
        return {
            "success": True,
            "block_index": block["index"],
            "block_hash": block["block_hash"],
            "timestamp": block["timestamp"],
            "project_id": request.project_id,
            "auditor_id": request.auditor_id,
            "decision": request.decision.upper(),
            "message": f"Decision '{request.decision.upper()}' cryptographically anchored in Block #{block['index']}.",
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to anchor decision: {str(e)}")


@router.get("/history/{project_id}", response_model=List[Dict[str, Any]])
def get_project_blockchain_history(project_id: str):
    """Retrieves all blockchain ledger events anchored for a specific project."""
    return blockchain_service.get_project_history(project_id=project_id)

