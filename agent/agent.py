"""
Google ADK agent for the Pandora CRM chatbot.
Uses Claude via LiteLLM as the underlying model.
The Raphtory graph is loaded once at startup and queried by each tool.
"""

import os
from datetime import datetime, timedelta

from raphtory import Graph
from google.adk.agents import Agent

from agent.graph.schema import (
    EDGE_ATTENDED_EVENT,
    EDGE_HOSTED_EVENT,
    EDGE_IN_CAMPAIGN,
    EDGE_IN_DEAL,
    EDGE_INTERACTED_WITH,
    EDGE_MANAGING_DEAL,
    EDGE_NOMINATED_FOR,
    EDGE_SUBMITTED_NOMINATION,
    PROP_BANKER_BANK,
    PROP_BANKER_NAME,
    PROP_BANKER_ROLE,
    PROP_CAMPAIGN_NAME,
    PROP_CAMPAIGN_STATUS,
    PROP_CAMPAIGN_TYPE,
    PROP_CONTACT_COMPANY,
    PROP_CONTACT_NAME,
    PROP_CONTACT_SECTOR,
    PROP_CONTACT_TIER,
    PROP_CONTACT_TITLE,
    PROP_DEAL_NAME,
    PROP_DEAL_SECTOR,
    PROP_DEAL_STAGE,
    PROP_DEAL_TYPE,
    PROP_DEAL_VALUE,
    PROP_EVENT_DATE,
    PROP_EVENT_LOCATION,
    PROP_EVENT_NAME,
    PROP_EVENT_TYPE,
    PROP_INTERACTION_NOTES,
    PROP_INTERACTION_TYPE,
    PROP_NOMINATION_CATEGORY,
    PROP_NOMINATION_STATUS,
    PROP_NOMINATION_YEAR,
    VERTEX_BANKER,
    VERTEX_CAMPAIGN,
    VERTEX_CONTACT,
    VERTEX_DEAL,
    VERTEX_EVENT,
    VERTEX_NOMINATION,
)

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "graph", "pandora_graph.bin")

# ── Graph singleton ───────────────────────────────────────────────────────────

_graph: Graph | None = None


def _get_graph() -> Graph:
    global _graph
    if _graph is None:
        if not os.path.exists(GRAPH_PATH):
            raise FileNotFoundError(
                f"Graph not found at {GRAPH_PATH}. "
                "Run: python -m agent.graph.ingest"
            )
        _graph = Graph.load_from_file(GRAPH_PATH)
    return _graph


def _vertex_props(v) -> dict:
    """Flatten a Raphtory vertex's properties into a plain dict."""
    return {k: v.properties.get(k) for k in v.properties.keys()}


# ── Tool helpers ──────────────────────────────────────────────────────────────

def _ms_to_str(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000).strftime("%Y-%m-%d")


def _days_ago_ms(days: int) -> int:
    return int((datetime.now() - timedelta(days=days)).timestamp() * 1000)


# ── Tools ─────────────────────────────────────────────────────────────────────

def search_contacts(query: str = "", tier: str = "", sector: str = "", limit: int = 10) -> dict:
    """
    Search CRM contacts by name or company. Optionally filter by relationship
    tier (A, B, or C) and/or sector (e.g. Technology, Healthcare).
    Returns up to `limit` matching contacts with their profile details.
    """
    g = _get_graph()
    q = query.lower()
    results = []

    for v in g.vertices:
        props = _vertex_props(v)
        if props.get("vertex_type") != VERTEX_CONTACT:
            continue
        name = props.get(PROP_CONTACT_NAME, "")
        company = props.get(PROP_CONTACT_COMPANY, "")
        v_tier = props.get(PROP_CONTACT_TIER, "")
        v_sector = props.get(PROP_CONTACT_SECTOR, "")

        if q and q not in name.lower() and q not in company.lower():
            continue
        if tier and tier.upper() != v_tier:
            continue
        if sector and sector.lower() not in v_sector.lower():
            continue

        results.append({
            "id": str(v.id),
            "name": name,
            "company": company,
            "title": props.get(PROP_CONTACT_TITLE, ""),
            "tier": v_tier,
            "sector": v_sector,
            "email": props.get("email", ""),
        })
        if len(results) >= limit:
            break

    return {"count": len(results), "contacts": results}


def get_contact_interactions(contact_id: str, days_back: int = 365, limit: int = 20) -> dict:
    """
    Retrieve the interaction history for a contact (identified by their ID).
    `days_back` controls the time window (default: last 365 days).
    Returns banker names, interaction types, dates, and meeting notes.
    """
    g = _get_graph()
    cutoff_ms = _days_ago_ms(days_back)
    interactions = []

    # Find vertex by searching for the ID string in all vertices
    contact_vertex = None
    for v in g.vertices:
        if str(v.id) == contact_id:
            contact_vertex = v
            break

    if contact_vertex is None:
        return {"error": f"Contact {contact_id} not found", "interactions": []}

    # Walk in-edges of type INTERACTED_WITH
    for e in contact_vertex.in_edges:
        if e.properties.get("layer") != EDGE_INTERACTED_WITH:
            continue
        # Temporal filter
        history = [
            (ts, props)
            for ts, props in e.properties.temporal_values()
            if ts >= cutoff_ms
        ]
        for ts, props in sorted(history, reverse=True)[:limit]:
            banker_v = g.vertex(e.src)
            banker_name = banker_v.properties.get(PROP_BANKER_NAME, str(e.src)) if banker_v else str(e.src)
            interactions.append({
                "date": _ms_to_str(ts),
                "banker": banker_name,
                "type": props.get(PROP_INTERACTION_TYPE, ""),
                "notes": props.get(PROP_INTERACTION_NOTES, ""),
            })
        if len(interactions) >= limit:
            break

    interactions.sort(key=lambda x: x["date"], reverse=True)
    return {"contact_id": contact_id, "count": len(interactions), "interactions": interactions[:limit]}


def get_banker_portfolio(banker_name: str) -> dict:
    """
    Get a summary of a banker's portfolio: their top contacts, active deals,
    and recent events they've hosted. Use a partial name if the full name
    is unknown.
    """
    g = _get_graph()
    name_q = banker_name.lower()

    banker_vertex = None
    for v in g.vertices:
        props = _vertex_props(v)
        if props.get("vertex_type") == VERTEX_BANKER:
            if name_q in props.get(PROP_BANKER_NAME, "").lower():
                banker_vertex = v
                break

    if banker_vertex is None:
        return {"error": f"Banker '{banker_name}' not found"}

    bprops = _vertex_props(banker_vertex)
    contacts_reached = []
    deals = []
    events_hosted = []

    for e in banker_vertex.out_edges:
        layer = e.properties.get("layer", "")
        target = g.vertex(e.dst)
        if not target:
            continue
        tprops = _vertex_props(target)

        if layer == EDGE_INTERACTED_WITH:
            contacts_reached.append({
                "id": str(e.dst),
                "name": tprops.get(PROP_CONTACT_NAME, ""),
                "company": tprops.get(PROP_CONTACT_COMPANY, ""),
                "tier": tprops.get(PROP_CONTACT_TIER, ""),
            })
        elif layer == EDGE_MANAGING_DEAL:
            deals.append({
                "id": str(e.dst),
                "name": tprops.get(PROP_DEAL_NAME, ""),
                "type": tprops.get(PROP_DEAL_TYPE, ""),
                "stage": tprops.get(PROP_DEAL_STAGE, ""),
                "value_usd": tprops.get(PROP_DEAL_VALUE, 0),
                "sector": tprops.get(PROP_DEAL_SECTOR, ""),
            })
        elif layer == EDGE_HOSTED_EVENT:
            events_hosted.append({
                "id": str(e.dst),
                "name": tprops.get(PROP_EVENT_NAME, ""),
                "type": tprops.get(PROP_EVENT_TYPE, ""),
                "date": tprops.get(PROP_EVENT_DATE, ""),
            })

    # Deduplicate contacts by id
    seen = set()
    unique_contacts = []
    for c in contacts_reached:
        if c["id"] not in seen:
            seen.add(c["id"])
            unique_contacts.append(c)

    return {
        "banker": {
            "name": bprops.get(PROP_BANKER_NAME, ""),
            "bank": bprops.get(PROP_BANKER_BANK, ""),
            "role": bprops.get(PROP_BANKER_ROLE, ""),
        },
        "contacts_reached": len(unique_contacts),
        "top_contacts": unique_contacts[:10],
        "deals": deals[:10],
        "events_hosted": events_hosted[:10],
    }


def search_deals(query: str = "", stage: str = "", sector: str = "", deal_type: str = "", limit: int = 10) -> dict:
    """
    Search the deal pipeline. Filter by keyword (`query` matches deal name),
    pipeline stage (Discovery, Proposal, Negotiation, Closed Won, Closed Lost),
    sector (e.g. Technology), or deal type (M&A, IPO, Debt Financing, etc.).
    Returns deal name, value, stage, type, and sector.
    """
    g = _get_graph()
    q = query.lower()
    results = []

    for v in g.vertices:
        props = _vertex_props(v)
        if props.get("vertex_type") != VERTEX_DEAL:
            continue
        name = props.get(PROP_DEAL_NAME, "")
        v_stage = props.get(PROP_DEAL_STAGE, "")
        v_sector = props.get(PROP_DEAL_SECTOR, "")
        v_type = props.get(PROP_DEAL_TYPE, "")

        if q and q not in name.lower():
            continue
        if stage and stage.lower() not in v_stage.lower():
            continue
        if sector and sector.lower() not in v_sector.lower():
            continue
        if deal_type and deal_type.lower() not in v_type.lower():
            continue

        results.append({
            "id": str(v.id),
            "name": name,
            "type": v_type,
            "stage": v_stage,
            "sector": v_sector,
            "value_usd": props.get(PROP_DEAL_VALUE, 0),
        })
        if len(results) >= limit:
            break

    return {"count": len(results), "deals": results}


def get_campaign_overview(campaign_name: str = "", status: str = "", limit: int = 10) -> dict:
    """
    List CRM campaigns, optionally filtered by name keyword or status
    (Active, Completed, Planned). Returns campaign name, type, status,
    and contact count enrolled.
    """
    g = _get_graph()
    q = campaign_name.lower()
    results = []

    for v in g.vertices:
        props = _vertex_props(v)
        if props.get("vertex_type") != VERTEX_CAMPAIGN:
            continue
        name = props.get(PROP_CAMPAIGN_NAME, "")
        v_status = props.get(PROP_CAMPAIGN_STATUS, "")

        if q and q not in name.lower():
            continue
        if status and status.lower() not in v_status.lower():
            continue

        # Count enrolled contacts via in-edges
        enrolled = sum(1 for _ in v.in_edges)

        results.append({
            "id": str(v.id),
            "name": name,
            "type": props.get(PROP_CAMPAIGN_TYPE, ""),
            "status": v_status,
            "contacts_enrolled": enrolled,
        })
        if len(results) >= limit:
            break

    return {"count": len(results), "campaigns": results}


def search_events(query: str = "", event_type: str = "", location: str = "", limit: int = 10) -> dict:
    """
    Search CRM events (conferences, roadshows, dinners, webinars).
    Filter by name keyword, event type, or location.
    Returns event name, type, location, date, and attendee count.
    """
    g = _get_graph()
    q = query.lower()
    results = []

    for v in g.vertices:
        props = _vertex_props(v)
        if props.get("vertex_type") != VERTEX_EVENT:
            continue
        name = props.get(PROP_EVENT_NAME, "")
        v_type = props.get(PROP_EVENT_TYPE, "")
        v_loc = props.get(PROP_EVENT_LOCATION, "")

        if q and q not in name.lower():
            continue
        if event_type and event_type.lower() not in v_type.lower():
            continue
        if location and location.lower() not in v_loc.lower():
            continue

        attendees = sum(1 for _ in v.in_edges)

        results.append({
            "id": str(v.id),
            "name": name,
            "type": v_type,
            "location": v_loc,
            "date": props.get(PROP_EVENT_DATE, ""),
            "attendees": attendees,
        })
        if len(results) >= limit:
            break

    return {"count": len(results), "events": results}


def get_nominations(status: str = "", category: str = "", year: int = 0, limit: int = 10) -> dict:
    """
    List client nominations. Filter by status (Pending, Approved, Rejected),
    category (e.g. 'Top Client 2024', 'Deal of the Year'), or year.
    Returns nomination details with contact and category.
    """
    g = _get_graph()
    results = []

    for v in g.vertices:
        props = _vertex_props(v)
        if props.get("vertex_type") != VERTEX_NOMINATION:
            continue
        v_status = props.get(PROP_NOMINATION_STATUS, "")
        v_cat = props.get(PROP_NOMINATION_CATEGORY, "")
        v_year = props.get(PROP_NOMINATION_YEAR, 0)

        if status and status.lower() not in v_status.lower():
            continue
        if category and category.lower() not in v_cat.lower():
            continue
        if year and year != v_year:
            continue

        # Get the nominated contact
        contact_name = ""
        for e in v.in_edges:
            src = g.vertex(e.src)
            if src:
                src_props = _vertex_props(src)
                if src_props.get("vertex_type") == VERTEX_CONTACT:
                    contact_name = src_props.get(PROP_CONTACT_NAME, "")
                    break

        results.append({
            "id": str(v.id),
            "category": v_cat,
            "status": v_status,
            "year": v_year,
            "contact_name": contact_name,
        })
        if len(results) >= limit:
            break

    return {"count": len(results), "nominations": results}


# ── Agent definition ──────────────────────────────────────────────────────────

SYSTEM_INSTRUCTION = """You are a senior investment banking CRM assistant for Pandora,
a relationship management platform used by commercial bankers.

You have access to a comprehensive CRM graph containing real-time data on:
- **Contacts**: 50,000+ client contacts with tier ratings (A/B/C) across sectors
- **Interactions**: 50,000+ logged meetings, calls, and emails between bankers and clients
- **Deals**: Active and historical deal pipeline (M&A, IPO, Debt, Equity, Advisory)
- **Campaigns**: Outreach campaigns with enrolled contact lists
- **Events**: Conferences, roadshows, dinners, and webinars
- **Nominations**: Client award and recognition nominations

Answer questions with specific data from the graph. Always cite names, dates,
and numbers when available. If a query is ambiguous, make a reasonable assumption
and state it. Be concise and direct — bankers need actionable intelligence, not prose."""

root_agent = Agent(
    name="pandora_crm_agent",
    model="litellm/anthropic/claude-haiku-4-5-20251001",
    description="Investment banking CRM assistant powered by a Raphtory graph database",
    instruction=SYSTEM_INSTRUCTION,
    tools=[
        search_contacts,
        get_contact_interactions,
        get_banker_portfolio,
        search_deals,
        get_campaign_overview,
        search_events,
        get_nominations,
    ],
)
