"""
MPLADS AI Fraud Detection & Network Intelligence System
Production Backend FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import API_DESCRIPTION, API_TITLE, API_VERSION, CORS_ORIGINS
from backend.routers.blockchain import router as blockchain_router
from backend.routers.evidence import router as evidence_router
from backend.routers.graph import router as graph_router
from backend.routers.mps import router as mps_router
from backend.routers.overview import router as overview_router
from backend.routers.projects import router as projects_router
from backend.routers.splitting import router as splitting_router
from backend.routers.syndicates import router as syndicates_router
from backend.services.blockchain_service import blockchain_service
from backend.services.data_service import data_service

# Configure standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mplads.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler: pre-indexes datasets and verifies cryptographic chain."""
    logger.info("=" * 70)
    logger.info("STARTING MPLADS FRAUD DETECTION & NETWORK INTELLIGENCE API")
    logger.info("=" * 70)

    # 1. Preload master datasets
    data_service.load_data()

    # 2. Verify blockchain integrity
    is_valid, errors = blockchain_service.validate_chain()
    if is_valid:
        logger.info(
            f"Blockchain Audit Ledger: VERIFIED ({len(blockchain_service.chain)} blocks intact)."
        )
    else:
        logger.error(f"Blockchain Audit Ledger: INTEGRITY ERROR: {errors}")

    logger.info("API Server Ready: Accepting connections.")
    yield
    logger.info("Shutting down MPLADS API server...")


# Create FastAPI application
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "ONLINE",
        "service": API_TITLE,
        "version": API_VERSION,
        "indexed_projects": len(data_service.projects_dict),
        "blockchain_blocks": len(blockchain_service.chain),
    }


# Register REST API Routers under /api
app.include_router(overview_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(syndicates_router, prefix="/api")
app.include_router(mps_router, prefix="/api")
app.include_router(splitting_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(blockchain_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)

