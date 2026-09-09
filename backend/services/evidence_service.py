"""
Evidence & Photo Verification Service
Extracts EXIF metadata, verifies GPS spatial tolerances, and detects image reuse.
"""

import hashlib
import io
import math
from typing import Any, Dict, Optional, Tuple
import pandas as pd
from PIL import Image, ExifTags

from backend.config import DATA_DIR


class EvidenceService:
    """
    Evidence verification engine for physical inspection photos.
    Validates GPS coordinates, timestamps, and image cryptographic hashes.
    """

    def __init__(self):
        self.known_hashes = set()
        self._load_known_evidence()

    def _load_known_evidence(self):
        photo_csv = DATA_DIR / "photo_evidence.csv"
        if photo_csv.exists():
            try:
                df = pd.read_csv(photo_csv, usecols=["Photo_Hash", "Duplicate_Photo_Flag"])
                # Index known hashes
                self.known_hashes = set(df["Photo_Hash"].dropna().astype(str))
            except Exception:
                pass

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes great-circle distance in kilometers between two GPS coordinates."""
        R = 6371.0  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)

    @staticmethod
    def _convert_dms_to_dd(dms: Tuple, ref: str) -> Optional[float]:
        """Converts degrees/minutes/seconds GPS rational tuple to decimal degrees."""
        try:
            degrees = float(dms[0])
            minutes = float(dms[1])
            seconds = float(dms[2])
            dd = degrees + minutes / 60.0 + seconds / 3600.0
            if ref in ["S", "W"]:
                dd = -dd
            return round(dd, 6)
        except Exception:
            return None

    def extract_exif(self, image_bytes: bytes) -> Dict[str, Any]:
        """Extracts EXIF GPS and timestamp metadata from image bytes."""
        result = {
            "latitude": None,
            "longitude": None,
            "timestamp": None,
            "has_exif": False,
        }
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                exif_data = img._getexif()
                if not exif_data:
                    return result

                result["has_exif"] = True
                exif_dict = {
                    ExifTags.TAGS.get(k, k): v
                    for k, v in exif_data.items()
                    if k in ExifTags.TAGS
                }

                # Extract timestamp
                if "DateTimeOriginal" in exif_dict:
                    result["timestamp"] = str(exif_dict["DateTimeOriginal"])
                elif "DateTime" in exif_dict:
                    result["timestamp"] = str(exif_dict["DateTime"])

                # Extract GPS
                gps_info = exif_dict.get("GPSInfo")
                if gps_info:
                    gps_tags = {}
                    for t in gps_info:
                        sub_tag = ExifTags.GPSTAGS.get(t, t)
                        gps_tags[sub_tag] = gps_info[t]

                    lat_dms = gps_tags.get("GPSLatitude")
                    lat_ref = gps_tags.get("GPSLatitudeRef")
                    lon_dms = gps_tags.get("GPSLongitude")
                    lon_ref = gps_tags.get("GPSLongitudeRef")

                    if lat_dms and lat_ref:
                        result["latitude"] = self._convert_dms_to_dd(lat_dms, lat_ref)
                    if lon_dms and lon_ref:
                        result["longitude"] = self._convert_dms_to_dd(lon_dms, lon_ref)
        except Exception:
            pass

        return result

    def verify_photo(
        self,
        image_bytes: bytes,
        claimed_latitude: float,
        claimed_longitude: float,
        tolerance_km: float = 5.0,
    ) -> Dict[str, Any]:
        """
        Conducts full evidence validation:
        1. Computes SHA-256 image content hash.
        2. Checks for duplicate image reuse across projects.
        3. Extracts EXIF GPS and verifies spatial distance against claimed location.
        """
        # Cryptographic hash
        photo_hash = hashlib.sha256(image_bytes).hexdigest()
        is_duplicate = photo_hash in self.known_hashes

        # EXIF analysis
        exif = self.extract_exif(image_bytes)
        photo_lat = exif.get("latitude")
        photo_lon = exif.get("longitude")
        photo_time = exif.get("timestamp")

        distance_km = None
        geo_mismatch = False
        verdict = "PASSED"
        reasons = []

        if photo_lat is not None and photo_lon is not None:
            distance_km = self.haversine_distance(
                claimed_latitude, claimed_longitude, photo_lat, photo_lon
            )
            if distance_km > tolerance_km:
                geo_mismatch = True
                if distance_km > 50.0:
                    verdict = "CRITICAL_GEO_FRAUD"
                    reasons.append(
                        f"Physical location discrepancy is {distance_km} km (exceeds maximum 50 km tolerance)"
                    )
                else:
                    verdict = "SUSPICIOUS_LOCATION"
                    reasons.append(
                        f"Photo taken {distance_km} km away from claimed site (tolerance: {tolerance_km} km)"
                    )
            else:
                reasons.append(f"Photo location verified within {distance_km} km of work site")
        else:
            reasons.append("Image lacks EXIF GPS tags (possible screenshot or metadata stripped)")
            verdict = "UNVERIFIED_GPS"

        if is_duplicate:
            verdict = "DUPLICATE_IMAGE_REUSE"
            reasons.append(
                f"Image hash {photo_hash[:12]}... matches previously submitted evidence from another project"
            )

        return {
            "success": True,
            "claimed_latitude": claimed_latitude,
            "claimed_longitude": claimed_longitude,
            "photo_latitude": photo_lat,
            "photo_longitude": photo_lon,
            "distance_km": distance_km,
            "geo_mismatch": geo_mismatch,
            "photo_timestamp": photo_time,
            "photo_hash": photo_hash,
            "duplicate_hash_detected": is_duplicate,
            "verdict": verdict,
            "details": "; ".join(reasons),
        }


# Global singleton instance
evidence_service = EvidenceService()

