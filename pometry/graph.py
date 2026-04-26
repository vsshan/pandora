"""Raphtory graph construction and CRM relationship-health analytics."""
import json
import os
from datetime import datetime, timezone
from typing import Optional

from raphtory import Graph
from raphtory import algorithms

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Injected in tests to pin "now"
_NOW_OVERRIDE: Optional[int] = None


def _now_ts() -> int:
    return _NOW_OVERRIDE or int(datetime.now(timezone.utc).timestamp())


def _iso_to_ts(iso: str) -> int:
    return int(datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp())


def load_data() -> tuple[list, list]:
    with open(os.path.join(DATA_DIR, "contacts.json")) as f:
        contacts = json.load(f)["contacts"]
    with open(os.path.join(DATA_DIR, "interactions.json")) as f:
        interactions = json.load(f)["interactions"]
    return contacts, interactions


def build_graph(contacts: list, interactions: list) -> Graph:
    g = Graph()

    # Anchor all nodes at the earliest interaction so they exist before any edge.
    if interactions:
        epoch = min(_iso_to_ts(i["timestamp"]) for i in interactions)
    else:
        epoch = int(datetime.now(timezone.utc).timestamp())

    for c in contacts:
        g.add_node(epoch, c["id"], {
            "name":            c["name"],
            "title":           c["title"],
            "company":         c["company"],
            "company_id":      c["company_id"],
            "type":            c.get("type", "client"),
            "avatar_initials": c.get("avatar_initials", ""),
            "avatar_color":    c.get("avatar_color", "bg-gray-500"),
        })

    for inter in interactions:
        ts = _iso_to_ts(inter["timestamp"])
        # Each interaction in its own layer so per-event properties are
        # never overwritten when the same src→dst pair appears again.
        g.add_edge(ts, inter["from_id"], inter["to_id"], {
            "interaction_type": inter["interaction_type"],
            "interaction_id":   inter["id"],
            "banker":           inter.get("banker", ""),
            "company_id":       inter.get("company_id", ""),
            "notes":            inter.get("notes", ""),
        }, layer=inter["id"])

    return g


# ── Internal helpers ───────────────────────────────────────────────────────────

def _node_event_count(node) -> int:
    """Total timestamped interaction events on all edges of a node."""
    return sum(len(list(e.history)) for e in node.edges)


def _props(node) -> dict:
    """Return node properties dict (works on both full and windowed nodes)."""
    return node.properties.as_dict()


# ── Analytics ──────────────────────────────────────────────────────────────────

def get_network_overview(g: Graph) -> dict:
    now = _now_ts()
    d30 = 30 * 86400
    recent = g.window(now - d30, now)

    try:
        density = round(algorithms.directed_graph_density(g), 4)
    except Exception:
        density = 0.0

    return {
        "total_contacts":        g.count_nodes(),
        "total_interactions":    g.count_temporal_edges(),
        "active_last_30d":       recent.count_nodes(),
        "interactions_last_30d": recent.count_temporal_edges(),
        "graph_density":         density,
    }


def get_contact_analytics(g: Graph, company_id: Optional[str] = None) -> list[dict]:
    now = _now_ts()
    d90  = 90  * 86400
    d180 = 180 * 86400

    # PageRank over the full graph
    try:
        pr_result = algorithms.pagerank(g)
        pr_dict = {n.name: s["pagerank_score"] for n, s in pr_result.items()}
    except Exception:
        pr_dict = {}

    recent_g = g.window(now - d90,  now)
    prior_g  = g.window(now - d180, now - d90)

    results = []
    for node in g.nodes:
        # Always read properties from the full graph node (windowed nodes
        # return None for properties set before the window start).
        props = _props(node)

        # Skip banker/internal nodes that have no company_id
        if not props.get("company_id"):
            continue

        if company_id and props.get("company_id") != company_id:
            continue

        total = _node_event_count(node)

        # e.history is a property, not a method — do not call it
        rnode = recent_g.node(node.name)
        pnode = prior_g.node(node.name)
        recent_count = _node_event_count(rnode) if rnode else 0
        prior_count  = _node_event_count(pnode)  if pnode else 0

        # Trend classification
        if recent_count == 0 and prior_count == 0:
            trend = "dormant"
        elif prior_count == 0:
            trend = "growing"
        elif recent_count > prior_count * 1.2:
            trend = "growing"
        elif recent_count < prior_count * 0.8:
            trend = "declining"
        else:
            trend = "stable"

        latest_ts  = node.latest_time.t
        days_since = max(0, (now - latest_ts) // 86400)
        last_seen  = datetime.fromtimestamp(latest_ts, tz=timezone.utc).isoformat()

        # Recency decay applied to the health score
        if days_since <= 14:
            decay = 1.0
        elif days_since <= 30:
            decay = 0.7
        elif days_since <= 60:
            decay = 0.4
        elif days_since <= 90:
            decay = 0.15
        else:
            decay = 0.0

        health_score = int(min(100, recent_count * 15) * decay)

        if health_score >= 70:
            status = "hot"
        elif health_score >= 40:
            status = "warm"
        elif health_score >= 10:
            status = "cold"
        else:
            status = "dormant"

        results.append({
            "id":                node.name,
            "name":              props.get("name", node.name),
            "title":             props.get("title", ""),
            "company":           props.get("company", ""),
            "company_id":        props.get("company_id", ""),
            "avatar_initials":   props.get("avatar_initials", ""),
            "avatar_color":      props.get("avatar_color", "bg-gray-500"),
            "interaction_count": total,
            "recent_count":      recent_count,
            "prior_count":       prior_count,
            "pagerank_score":    round(pr_dict.get(node.name, 0.0), 6),
            "trend":             trend,
            "status":            status,
            "health_score":      health_score,
            "last_seen":         last_seen,
            "days_since_last":   int(days_since),
        })

    results.sort(key=lambda x: x["health_score"], reverse=True)
    return results


def get_interaction_timeline(
    g: Graph,
    contact_id: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    """Return interactions as a flat list, newest first."""
    events = []

    for layer_name in g.unique_layers:
        lg = g.layer(layer_name)
        for edge in lg.edges:
            src = edge.src
            dst = edge.dst

            if contact_id and contact_id not in (src.name, dst.name):
                continue

            # Properties from the full-graph nodes for name/title
            src_props = _props(g.node(src.name)) if g.node(src.name) else {}
            dst_props = _props(g.node(dst.name)) if g.node(dst.name) else {}
            e_props   = edge.properties.as_dict()
            ts        = edge.earliest_time.t

            events.append({
                "interaction_id":   e_props.get("interaction_id", layer_name),
                "timestamp":        datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
                "from_id":          src.name,
                "from_name":        src_props.get("name", src.name),
                "to_id":            dst.name,
                "to_name":          dst_props.get("name", dst.name),
                "interaction_type": e_props.get("interaction_type", ""),
                "banker":           e_props.get("banker", ""),
                "company_id":       e_props.get("company_id", ""),
                "notes":            e_props.get("notes", ""),
                "_ts":              ts,
            })

    events.sort(key=lambda x: x["_ts"], reverse=True)
    for e in events:
        del e["_ts"]

    return events[:limit]


def get_monthly_trends(g: Graph) -> list[dict]:
    """Monthly interaction counts using rolling 30-day windows."""
    window_secs = 30 * 86400
    buckets = []

    for snapshot in g.rolling(window=window_secs, step=window_secs):
        start_ts = snapshot.start.t
        label = datetime.fromtimestamp(start_ts, tz=timezone.utc).strftime("%Y-%m")
        buckets.append({
            "month":             label,
            "interaction_count": snapshot.count_temporal_edges(),
            "active_contacts":   snapshot.count_nodes(),
        })

    return buckets
