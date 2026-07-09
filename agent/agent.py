"""
Google ADK agent for the Pandora CRM chatbot.
Uses Claude via LiteLLM as the underlying model.
The Raphtory graph is loaded once at startup and queried by each tool.
"""

import os
from datetime import datetime, timedelta

from raphtory import Graph
from raphtory.graphql import RaphtoryClient
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm

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

RAPHTORY_URL = os.environ.get(
    "RAPHTORY_URL", "http://raphtory-service.ai-agents.svc.cluster.local:1736"
)
RAPHTORY_GRAPH_PATH = os.environ.get("RAPHTORY_GRAPH_PATH", "graph-data")

# ── Graph singleton ───────────────────────────────────────────────────────────

_graph: Graph | None = None


def _get_graph() -> Graph:
    global _graph
    if _graph is None:
        client = RaphtoryClient(RAPHTORY_URL)
        _graph = client.receive_graph(RAPHTORY_GRAPH_PATH)
    return _graph


def _props(v) -> dict:
    """Return node/edge properties as a plain dict (latest values)."""
    try:
        return v.properties.as_dict()
    except Exception:
        return {}


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

    for v in g.nodes:
        props = _props(v)
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
            "id": v.name,
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
    Retrieve the interaction history for a contact (identified by their ID from
    search_contacts). `days_back` controls the time window (default: last 365 days).
    Returns banker names, interaction types, dates, and meeting notes.
    """
    g = _get_graph()
    cutoff_ms = _days_ago_ms(days_back)
    interactions = []

    contact_vertex = g.node(contact_id)
    if contact_vertex is None:
        return {"error": f"Contact '{contact_id}' not found", "interactions": []}

    for e in contact_vertex.layer(EDGE_INTERACTED_WITH).in_edges:
        banker_name = e.src.properties.get(PROP_BANKER_NAME) or e.src.name
        edge_props = _props(e)
        for ts in sorted(e.history.t.collect(), reverse=True):
            if ts < cutoff_ms:
                continue
            interactions.append({
                "date": _ms_to_str(ts),
                "banker": banker_name,
                "type": edge_props.get(PROP_INTERACTION_TYPE, ""),
                "notes": edge_props.get(PROP_INTERACTION_NOTES, ""),
            })
            if len(interactions) >= limit:
                break
        if len(interactions) >= limit:
            break

    return {"contact_id": contact_id, "count": len(interactions), "interactions": interactions}


def get_banker_interactions(banker_name: str, days_back: int = 365, limit: int = 50) -> dict:
    """
    Retrieve all interactions a banker has had with their contacts, ordered
    most-recent first. Use a partial name if the full name is unknown.
    `days_back` controls the time window (default: last 365 days).
    Returns contact name, company, interaction type, date, and notes.
    """
    g = _get_graph()
    name_q = banker_name.lower()
    cutoff_ms = _days_ago_ms(days_back)

    banker_vertex = None
    for v in g.nodes:
        props = _props(v)
        if props.get("vertex_type") == VERTEX_BANKER:
            if name_q in props.get(PROP_BANKER_NAME, "").lower():
                banker_vertex = v
                break

    if banker_vertex is None:
        return {"error": f"Banker '{banker_name}' not found", "interactions": []}

    bprops = _props(banker_vertex)
    interactions = []

    for e in banker_vertex.layer(EDGE_INTERACTED_WITH).out_edges:
        contact_p = _props(e.dst)
        contact_name = contact_p.get(PROP_CONTACT_NAME, "") or e.dst.name
        contact_company = contact_p.get(PROP_CONTACT_COMPANY, "")
        edge_props = _props(e)
        for ts in sorted(e.history.t.collect(), reverse=True):
            if ts < cutoff_ms:
                continue
            interactions.append({
                "date": _ms_to_str(ts),
                "contact_name": contact_name,
                "contact_company": contact_company,
                "type": edge_props.get(PROP_INTERACTION_TYPE, ""),
                "notes": edge_props.get(PROP_INTERACTION_NOTES, ""),
            })
            if len(interactions) >= limit:
                break
        if len(interactions) >= limit:
            break

    interactions.sort(key=lambda x: x["date"], reverse=True)

    return {
        "banker": bprops.get(PROP_BANKER_NAME, ""),
        "bank": bprops.get(PROP_BANKER_BANK, ""),
        "count": len(interactions),
        "interactions": interactions,
    }


def get_banker_portfolio(banker_name: str) -> dict:
    """
    Get a summary of a banker's portfolio: their top contacts, active deals,
    and recent events they've hosted. Use a partial name if the full name
    is unknown.
    """
    g = _get_graph()
    name_q = banker_name.lower()

    banker_vertex = None
    for v in g.nodes:
        props = _props(v)
        if props.get("vertex_type") == VERTEX_BANKER:
            if name_q in props.get(PROP_BANKER_NAME, "").lower():
                banker_vertex = v
                break

    if banker_vertex is None:
        return {"error": f"Banker '{banker_name}' not found"}

    bprops = _props(banker_vertex)
    contacts_reached: list[dict] = []
    deals: list[dict] = []
    events_hosted: list[dict] = []

    for e in banker_vertex.layer(EDGE_INTERACTED_WITH).out_edges:
        p = _props(e.dst)
        contacts_reached.append({
            "id": e.dst.name,
            "name": p.get(PROP_CONTACT_NAME, ""),
            "company": p.get(PROP_CONTACT_COMPANY, ""),
            "tier": p.get(PROP_CONTACT_TIER, ""),
        })

    for e in banker_vertex.layer(EDGE_MANAGING_DEAL).out_edges:
        p = _props(e.dst)
        deals.append({
            "id": e.dst.name,
            "name": p.get(PROP_DEAL_NAME, ""),
            "type": p.get(PROP_DEAL_TYPE, ""),
            "stage": p.get(PROP_DEAL_STAGE, ""),
            "value_usd": p.get(PROP_DEAL_VALUE, 0),
            "sector": p.get(PROP_DEAL_SECTOR, ""),
        })

    for e in banker_vertex.layer(EDGE_HOSTED_EVENT).out_edges:
        p = _props(e.dst)
        events_hosted.append({
            "id": e.dst.name,
            "name": p.get(PROP_EVENT_NAME, ""),
            "type": p.get(PROP_EVENT_TYPE, ""),
            "date": p.get(PROP_EVENT_DATE, ""),
        })

    # Deduplicate contacts
    seen: set[str] = set()
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


def rank_bankers_by_interactions(bank: str = "", limit: int = 20) -> dict:
    """
    Rank bankers by their total number of logged interactions (meetings, calls,
    emails) with contacts. Optionally filter by bank name. Returns a sorted
    leaderboard with each banker's name, bank, role, and interaction count.
    """
    g = _get_graph()
    bank_q = bank.lower()
    rows = []

    for v in g.nodes:
        props = _props(v)
        if props.get("vertex_type") != VERTEX_BANKER:
            continue
        banker_bank = props.get(PROP_BANKER_BANK, "")
        if bank_q and bank_q not in banker_bank.lower():
            continue
        interaction_count = v.layer(EDGE_INTERACTED_WITH).out_degree()
        rows.append({
            "name": props.get(PROP_BANKER_NAME, ""),
            "bank": banker_bank,
            "role": props.get(PROP_BANKER_ROLE, ""),
            "interaction_count": interaction_count,
        })

    rows.sort(key=lambda r: r["interaction_count"], reverse=True)
    rows = rows[:limit]

    for i, r in enumerate(rows, start=1):
        r["rank"] = i

    return {"count": len(rows), "bankers": rows}


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

    for v in g.nodes:
        props = _props(v)
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
            "id": v.name,
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

    for v in g.nodes:
        props = _props(v)
        if props.get("vertex_type") != VERTEX_CAMPAIGN:
            continue
        name = props.get(PROP_CAMPAIGN_NAME, "")
        v_status = props.get(PROP_CAMPAIGN_STATUS, "")

        if q and q not in name.lower():
            continue
        if status and status.lower() not in v_status.lower():
            continue

        enrolled = v.layer(EDGE_IN_CAMPAIGN).in_degree()

        results.append({
            "id": v.name,
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

    for v in g.nodes:
        props = _props(v)
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

        attendees = v.layer(EDGE_ATTENDED_EVENT).in_degree()

        results.append({
            "id": v.name,
            "name": name,
            "type": v_type,
            "location": v_loc,
            "date": props.get(PROP_EVENT_DATE, ""),
            "attendees": attendees,
        })
        if len(results) >= limit:
            break

    return {"count": len(results), "events": results}


def get_event_attendees(event_id: str = "", event_name: str = "", limit: int = 50) -> dict:
    """
    List the contacts attending a specific event. Identify the event by its ID
    (from search_events) or by a name keyword. Returns each attendee's name,
    company, title, tier, and sector.
    """
    g = _get_graph()

    event_vertex = None

    if event_id:
        event_vertex = g.node(event_id)
        if event_vertex is None or _props(event_vertex).get("vertex_type") != VERTEX_EVENT:
            event_vertex = None

    if event_vertex is None and event_name:
        q = event_name.lower()
        for v in g.nodes:
            props = _props(v)
            if props.get("vertex_type") == VERTEX_EVENT and q in props.get(PROP_EVENT_NAME, "").lower():
                event_vertex = v
                break

    if event_vertex is None:
        return {"error": "Event not found", "attendees": []}

    ev_props = _props(event_vertex)
    attendees = []
    for e in event_vertex.layer(EDGE_ATTENDED_EVENT).in_edges:
        p = _props(e.src)
        attendees.append({
            "id": e.src.name,
            "name": p.get(PROP_CONTACT_NAME, ""),
            "company": p.get(PROP_CONTACT_COMPANY, ""),
            "title": p.get(PROP_CONTACT_TITLE, ""),
            "tier": p.get(PROP_CONTACT_TIER, ""),
            "sector": p.get(PROP_CONTACT_SECTOR, ""),
        })
        if len(attendees) >= limit:
            break

    return {
        "event_id": event_vertex.name,
        "event_name": ev_props.get(PROP_EVENT_NAME, ""),
        "event_date": ev_props.get(PROP_EVENT_DATE, ""),
        "count": len(attendees),
        "attendees": attendees,
    }


def get_nominations(status: str = "", category: str = "", year: int = 0, limit: int = 10) -> dict:
    """
    List client nominations. Filter by status (Pending, Approved, Rejected),
    category (e.g. 'Top Client 2024', 'Deal of the Year'), or year.
    Returns nomination details with contact name and category.
    """
    g = _get_graph()
    results = []

    for v in g.nodes:
        props = _props(v)
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

        contact_name = ""
        for e in v.layer(EDGE_NOMINATED_FOR).in_edges:
            contact_name = e.src.properties.get(PROP_CONTACT_NAME) or e.src.name
            break

        results.append({
            "id": v.name,
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
- **Deals**: Active and historical deal pipeline (M&A, IPO, Debt, Financing, Advisory)
- **Campaigns**: Outreach campaigns with enrolled contact lists
- **Events**: Conferences, roadshows, dinners, and webinars
- **Nominations**: Client award and recognition nominations

## Output Format

ALWAYS respond with a single JSON object — never plain text. The JSON must conform to
the json-render spec format so the UI can render rich components.

Schema:
{
  "root": "<elem-id>",
  "elements": {
    "<elem-id>": {
      "type": "<ComponentType>",
      "props": { ... },
      "children": ["<child-elem-id>", ...]   // optional
    }
  }
}

Available component types and their props:

- **Stack** — vertical container. Props: `gap` (number, default 4)
- **Text** — paragraph. Props: `content` (string), `variant` ("muted" | "default")
- **Heading** — section heading. Props: `content` (string), `level` (1-4)
- **Card** — info card. Props: `title` (string), `description` (string, optional)
- **Badge** — status/tier label. Props: `label` (string), `variant` ("default" | "success" | "warning" | "destructive" | "outline")
- **Metric** — KPI display. Props: `label` (string), `value` (string | number), `delta` (string, optional)
- **Table** — data table. Props: `columns` (string[]), `rows` (array of string arrays)
- **Grid** — responsive grid of cards. Props: `columns` (2 | 3 | 4), `children` uses child element IDs
- **Accordion** — collapsible section. Props: `title` (string), `children` uses child element IDs
- **Chart** — data visualization. Props:
  - `chartType`: `"bar"` | `"line"` | `"pie"`
  - `data`: array of objects with `name` (string) and `value` (number), e.g. `[{"name": "Discovery", "value": 12}]`
  - `title`: string (optional, shown above chart)
  - Use `"bar"` for rankings, pipeline stages, campaign sizes, counts by category
  - Use `"line"` for trends over time (monthly/quarterly aggregations)
  - Use `"pie"` for percentage breakdowns (tier mix, type distribution, status split)

Design guidelines:
- For lists of contacts/deals/events: use Table
- For a single contact/deal profile: use Stack of Card + Badge + Metric
- For KPI summaries: use Grid of Metric elements
- For rankings/distributions/pipeline/trends: use Chart
- When the user asks for a "chart", "graph", "visualization", "breakdown", or "distribution": prefer Chart over Table
- Tier A → Badge variant "success", Tier B → "warning", Tier C → "outline"
- Deal stages: Closed Won → "success", Closed Lost → "destructive", others → "default"
- Active campaigns → "success", Completed → "outline", Planned → "warning"
- If an error occurs or nothing is found: use a Stack with a Text (variant "muted")

Always cite names, dates, and numbers. Use the tools to get real data first, then
build the JSON spec from the results. Return ONLY valid JSON — no markdown, no prose."""

root_agent = Agent(
    name="pandora_crm_agent",
    model=LiteLlm(model="anthropic/claude-haiku-4-5-20251001"),
    description="Investment banking CRM assistant powered by a Raphtory graph database",
    instruction=SYSTEM_INSTRUCTION,
    tools=[
        search_contacts,
        get_contact_interactions,
        get_banker_interactions,
        get_banker_portfolio,
        rank_bankers_by_interactions,
        search_deals,
        get_campaign_overview,
        search_events,
        get_event_attendees,
        get_nominations,
    ],
)
