"""FastAPI service exposing Raphtory CRM graph analytics."""
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import graph as g_module

_GRAPH = None
_CONTACTS: list = []
_INTERACTIONS: list = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _GRAPH, _CONTACTS, _INTERACTIONS
    _CONTACTS, _INTERACTIONS = g_module.load_data()
    _GRAPH = g_module.build_graph(_CONTACTS, _INTERACTIONS)
    print(
        f"[pometry] Graph loaded: {_GRAPH.count_nodes()} nodes, "
        f"{_GRAPH.count_temporal_edges()} interactions"
    )
    yield


app = FastAPI(title="Pandora Pometry Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "nodes": _GRAPH.count_nodes() if _GRAPH else 0,
        "interactions": _GRAPH.count_temporal_edges() if _GRAPH else 0,
    }


@app.get("/network-overview")
def network_overview():
    return g_module.get_network_overview(_GRAPH)


@app.get("/contacts")
def contacts(company_id: Optional[str] = Query(None)):
    return {"contacts": g_module.get_contact_analytics(_GRAPH, company_id)}


@app.get("/contacts/{contact_id}")
def contact_detail(contact_id: str):
    all_contacts = g_module.get_contact_analytics(_GRAPH)
    match = next((c for c in all_contacts if c["id"] == contact_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Contact not found")
    timeline = g_module.get_interaction_timeline(_GRAPH, contact_id=contact_id, limit=10)
    return {**match, "recent_interactions": timeline}


@app.get("/timeline")
def timeline(
    contact_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    return {
        "interactions": g_module.get_interaction_timeline(_GRAPH, contact_id, limit)
    }


@app.get("/trends")
def trends():
    return {"monthly": g_module.get_monthly_trends(_GRAPH)}


@app.post("/reload")
def reload_graph():
    """Hot-reload graph from data files (dev utility)."""
    global _GRAPH, _CONTACTS, _INTERACTIONS
    _CONTACTS, _INTERACTIONS = g_module.load_data()
    _GRAPH = g_module.build_graph(_CONTACTS, _INTERACTIONS)
    return {
        "status": "reloaded",
        "nodes": _GRAPH.count_nodes(),
        "interactions": _GRAPH.count_temporal_edges(),
    }
