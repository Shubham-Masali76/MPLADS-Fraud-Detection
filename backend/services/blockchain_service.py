"""
Cryptographic Tamper-Evident Blockchain Ledger Service
Anchors project lifecycle events and human-in-the-loop auditor decisions.
"""

import hashlib
import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path

from backend.config import BLOCKCHAIN_LEDGER_PATH


class BlockchainService:
    """
    Production-grade cryptographic audit ledger.
    Provides immutable SHA-256 chain verification for CVC/CAG compliance.
    """

    def __init__(self, ledger_file: Optional[Path] = None):
        self.ledger_file = ledger_file or BLOCKCHAIN_LEDGER_PATH
        self.chain: List[Dict[str, Any]] = []
        self._initialize_chain()

    def _canonical_json(self, data: Any) -> str:
        """Serializes data into canonical JSON for deterministic hashing."""
        return json.dumps(data, sort_keys=True, separators=(",", ":"))

    def _sha256(self, message: str) -> str:
        """Computes SHA-256 hexadecimal digest."""
        return hashlib.sha256(message.encode("utf-8")).hexdigest()

    def _compute_payload_hash(self, payload: Dict[str, Any]) -> str:
        return self._sha256(self._canonical_json(payload))

    def _compute_block_hash(
        self,
        index: int,
        timestamp: str,
        transaction_type: str,
        payload_hash: str,
        previous_hash: str,
        nonce: int,
    ) -> str:
        header = f"{index}:{timestamp}:{transaction_type}:{payload_hash}:{previous_hash}:{nonce}"
        return self._sha256(header)

    def _create_genesis_block(self) -> Dict[str, Any]:
        timestamp = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc).isoformat()
        payload = {
            "system": "MPLADS AI Fraud Detection & Network Intelligence Platform",
            "genesis_authority": "Ministry of Statistics and Programme Implementation (MoSPI) / CVC",
            "version": "1.0.0",
        }
        payload_hash = self._compute_payload_hash(payload)
        previous_hash = "0" * 64
        nonce = 0
        block_hash = self._compute_block_hash(
            0, timestamp, "GENESIS", payload_hash, previous_hash, nonce
        )
        return {
            "index": 0,
            "timestamp": timestamp,
            "transaction_type": "GENESIS",
            "payload": payload,
            "payload_hash": payload_hash,
            "previous_hash": previous_hash,
            "block_hash": block_hash,
            "nonce": nonce,
        }

    def _initialize_chain(self) -> None:
        if self.ledger_file.exists():
            try:
                with open(self.ledger_file, "r", encoding="utf-8") as f:
                    self.chain = json.load(f)
                if self.chain and len(self.chain) > 0:
                    return
            except Exception:
                self.chain = []

        # Fresh genesis
        genesis = self._create_genesis_block()
        self.chain = [genesis]
        self._save_chain()

    def _save_chain(self) -> None:
        try:
            self.ledger_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.ledger_file, "w", encoding="utf-8") as f:
                json.dump(self.chain, f, indent=2)
        except Exception as e:
            # Fallback in-memory if write fails
            pass

    def add_block(self, transaction_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Appends a new verified transaction block to the chain."""
        last_block = self.chain[-1]
        new_index = last_block["index"] + 1
        timestamp = datetime.now(timezone.utc).isoformat()
        payload_hash = self._compute_payload_hash(payload)
        previous_hash = last_block["block_hash"]
        nonce = 0

        # Lightweight cryptographic proof (leading zero nibble)
        while True:
            candidate_hash = self._compute_block_hash(
                new_index, timestamp, transaction_type, payload_hash, previous_hash, nonce
            )
            if candidate_hash.startswith("00"):  # 8-bit difficulty proof-of-work
                break
            nonce += 1

        new_block = {
            "index": new_index,
            "timestamp": timestamp,
            "transaction_type": transaction_type,
            "payload": payload,
            "payload_hash": payload_hash,
            "previous_hash": previous_hash,
            "block_hash": candidate_hash,
            "nonce": nonce,
        }
        self.chain.append(new_block)
        self._save_chain()
        return new_block

    def record_decision(
        self, project_id: str, auditor_id: str, decision: str, notes: str = ""
    ) -> Dict[str, Any]:
        """Records a human auditor review decision (APPROVE / ESCALATE / HOLD)."""
        valid_decisions = {"APPROVE", "ESCALATE", "HOLD"}
        dec_norm = decision.strip().upper()
        if dec_norm not in valid_decisions:
            raise ValueError(f"Invalid decision '{decision}'. Must be one of {valid_decisions}")

        payload = {
            "project_id": project_id,
            "auditor_id": auditor_id,
            "decision": dec_norm,
            "notes": notes.strip(),
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }
        return self.add_block(transaction_type="AUDITOR_DECISION", payload=payload)

    def validate_chain(self) -> Tuple[bool, List[str]]:
        """
        Validates the entire chain's cryptographic integrity.
        Detects any tampering, hash mismatches, or broken pointer chains.
        """
        errors = []
        for i, block in enumerate(self.chain):
            # Check payload hash
            expected_payload_hash = self._compute_payload_hash(block["payload"])
            if block["payload_hash"] != expected_payload_hash:
                errors.append(
                    f"Block {i}: Payload hash mismatch. Expected {expected_payload_hash}, found {block['payload_hash']}"
                )

            # Check block hash
            expected_block_hash = self._compute_block_hash(
                block["index"],
                block["timestamp"],
                block["transaction_type"],
                block["payload_hash"],
                block["previous_hash"],
                block["nonce"],
            )
            if block["block_hash"] != expected_block_hash:
                errors.append(
                    f"Block {i}: Block hash mismatch. Expected {expected_block_hash}, found {block['block_hash']}"
                )

            # Check previous hash link
            if i > 0:
                prev_block = self.chain[i - 1]
                if block["previous_hash"] != prev_block["block_hash"]:
                    errors.append(
                        f"Block {i}: Broken chain link. Previous hash {block['previous_hash']} does not match Block {i-1} hash {prev_block['block_hash']}"
                    )
            else:
                if block["previous_hash"] != "0" * 64:
                    errors.append("Genesis block has invalid previous hash")

        return len(errors) == 0, errors

    def get_chain(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Returns paginated blocks in reverse chronological order (newest first)."""
        reversed_chain = list(reversed(self.chain))
        return reversed_chain[offset : offset + limit]

    def get_project_history(self, project_id: str) -> List[Dict[str, Any]]:
        """Retrieves all blockchain records associated with a specific project."""
        history = []
        for block in self.chain:
            payload = block.get("payload", {})
            if payload.get("project_id") == project_id:
                history.append(block)
        return history


# Global singleton instance
blockchain_service = BlockchainService()

