"""
Graph & Network Intelligence REST API Router
Serves dynamic Cytoscape.js compatible ego-subgraphs for interactive visual exploration.
"""

from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import CytoscapeGraphResponse
from backend.services.graph_service import graph_service

router = APIRouter(prefix="/graph", tags=["Graph Visualizer"])


@router.get("/subgraph/{entity_type}/{entity_id}", response_model=CytoscapeGraphResponse)
def get_entity_subgraph(
    entity_type: str,
    entity_id: str,
    depth: int = Query(2, ge=1, le=3, description="Graph expansion depth (1 or 2 hops)"),
):
    """
    Extracts an interactive ego-subgraph tailored for Cytoscape.js rendering.
    Supported entity_types: 'project', 'vendor', 'mp', 'syndicate'.
    """
    valid_types = {"project", "vendor", "mp", "syndicate"}
    if entity_type.lower() not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid entity_type '{entity_type}'. Must be one of {valid_types}",
        )

    subgraph = graph_service.get_subgraph(entity_type=entity_type, entity_id=entity_id, depth=depth)
    if not subgraph["nodes"]:
        raise HTTPException(
            status_code=404,
            detail=f"No graph neighborhood found for {entity_type} '{entity_id}'.",
        )
    return subgraph

