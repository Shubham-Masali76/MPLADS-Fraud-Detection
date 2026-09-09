"""
Evidence & Photo Verification REST API Router
Accepts physical inspection photos, verifies EXIF GPS tolerances, and detects image reuse.
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.models.schemas import PhotoVerificationResponse
from backend.services.evidence_service import evidence_service

router = APIRouter(prefix="/evidence", tags=["Evidence Verification"])


@router.post("/verify-photo", response_model=PhotoVerificationResponse)
async def verify_photo(
    file: UploadFile = File(..., description="JPEG or PNG inspection photograph"),
    claimed_latitude: float = Form(..., description="Official latitude of project site"),
    claimed_longitude: float = Form(..., description="Official longitude of project site"),
    tolerance_km: float = Form(5.0, description="Permissible distance tolerance in km"),
):
    """
    Performs multi-modal physical inspection verification:
    1. Extracts EXIF GPS coordinates and computes Haversine spatial discrepancy.
    2. Extracts photo capture timestamp.
    3. Computes cryptographic hash to flag duplicate/reused photos across works.
    """
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        res = evidence_service.verify_photo(
            image_bytes=image_bytes,
            claimed_latitude=claimed_latitude,
            claimed_longitude=claimed_longitude,
            tolerance_km=tolerance_km,
        )
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process inspection photo: {str(e)}"
        )

