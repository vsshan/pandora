"""
Builds and persists the Raphtory graph from mock CRM data.

Run with:
    python -m agent.graph.ingest
"""

import os
import sys
import time

# Allow running from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from raphtory import Graph

from agent.graph.mock_data import generate_all
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
    PROP_BANKER_EMAIL,
    PROP_BANKER_NAME,
    PROP_BANKER_ROLE,
    PROP_CAMPAIGN_NAME,
    PROP_CAMPAIGN_STATUS,
    PROP_CAMPAIGN_TYPE,
    PROP_CONTACT_COMPANY,
    PROP_CONTACT_EMAIL,
    PROP_CONTACT_NAME,
    PROP_CONTACT_PHONE,
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
    PROP_INTERACTION_DURATION,
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

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "pandora_graph.bin")


def build_graph(data: dict) -> Graph:
    g = Graph()

    print("  Adding bankers...")
    for b in data["bankers"]:
        g.add_node(
            timestamp=b["created_at"],
            id=b["id"],
            properties={
                "vertex_type": VERTEX_BANKER,
                PROP_BANKER_NAME: b["name"],
                PROP_BANKER_BANK: b["bank"],
                PROP_BANKER_ROLE: b["role"],
                PROP_BANKER_EMAIL: b["email"],
            },
        )

    print("  Adding contacts...")
    for c in data["contacts"]:
        g.add_node(
            timestamp=c["created_at"],
            id=c["id"],
            properties={
                "vertex_type": VERTEX_CONTACT,
                PROP_CONTACT_NAME: c["name"],
                PROP_CONTACT_COMPANY: c["company"],
                PROP_CONTACT_TITLE: c["title"],
                PROP_CONTACT_EMAIL: c["email"],
                PROP_CONTACT_PHONE: c["phone"],
                PROP_CONTACT_TIER: c["tier"],
                PROP_CONTACT_SECTOR: c["sector"],
            },
        )

    print("  Adding deals...")
    for d in data["deals"]:
        g.add_node(
            timestamp=d["timestamp"],
            id=d["id"],
            properties={
                "vertex_type": VERTEX_DEAL,
                PROP_DEAL_NAME: d["name"],
                PROP_DEAL_TYPE: d["type"],
                PROP_DEAL_SECTOR: d["sector"],
                PROP_DEAL_STAGE: d["stage"],
                PROP_DEAL_VALUE: d["value_usd"],
            },
        )
        g.add_edge(
            timestamp=d["timestamp"],
            src=d["banker_id"],
            dst=d["id"],
            properties={PROP_DEAL_NAME: d["name"]},
            layer=EDGE_MANAGING_DEAL,
        )
        for cid in d["contact_ids"]:
            g.add_edge(
                timestamp=d["timestamp"],
                src=cid,
                dst=d["id"],
                properties={},
                layer=EDGE_IN_DEAL,
            )

    print("  Adding campaigns...")
    for camp in data["campaigns"]:
        g.add_node(
            timestamp=camp["timestamp"],
            id=camp["id"],
            properties={
                "vertex_type": VERTEX_CAMPAIGN,
                PROP_CAMPAIGN_NAME: camp["name"],
                PROP_CAMPAIGN_TYPE: camp["type"],
                PROP_CAMPAIGN_STATUS: camp["status"],
            },
        )
        for cid in camp["contact_ids"]:
            g.add_edge(
                timestamp=camp["timestamp"],
                src=cid,
                dst=camp["id"],
                properties={},
                layer=EDGE_IN_CAMPAIGN,
            )

    print("  Adding events...")
    for ev in data["events"]:
        g.add_node(
            timestamp=ev["timestamp"],
            id=ev["id"],
            properties={
                "vertex_type": VERTEX_EVENT,
                PROP_EVENT_NAME: ev["name"],
                PROP_EVENT_TYPE: ev["type"],
                PROP_EVENT_LOCATION: ev["location"],
                PROP_EVENT_DATE: ev["date_str"],
            },
        )
        for cid in ev["attendee_ids"]:
            g.add_edge(
                timestamp=ev["timestamp"],
                src=cid,
                dst=ev["id"],
                properties={},
                layer=EDGE_ATTENDED_EVENT,
            )
        for bid in ev["host_banker_ids"]:
            g.add_edge(
                timestamp=ev["timestamp"],
                src=bid,
                dst=ev["id"],
                properties={},
                layer=EDGE_HOSTED_EVENT,
            )

    print("  Adding nominations...")
    for nom in data["nominations"]:
        g.add_node(
            timestamp=nom["timestamp"],
            id=nom["id"],
            properties={
                "vertex_type": VERTEX_NOMINATION,
                PROP_NOMINATION_CATEGORY: nom["category"],
                PROP_NOMINATION_STATUS: nom["status"],
                PROP_NOMINATION_YEAR: nom["year"],
            },
        )
        g.add_edge(
            timestamp=nom["timestamp"],
            src=nom["contact_id"],
            dst=nom["id"],
            properties={},
            layer=EDGE_NOMINATED_FOR,
        )
        g.add_edge(
            timestamp=nom["timestamp"],
            src=nom["banker_id"],
            dst=nom["id"],
            properties={},
            layer=EDGE_SUBMITTED_NOMINATION,
        )

    print("  Adding interactions (edges)...")
    for ix in data["interactions"]:
        props: dict = {
            PROP_INTERACTION_TYPE: ix["type"],
            PROP_INTERACTION_NOTES: ix["notes"],
        }
        if ix.get("duration_min") is not None:
            props[PROP_INTERACTION_DURATION] = ix["duration_min"]
        g.add_edge(
            timestamp=ix["timestamp"],
            src=ix["banker_id"],
            dst=ix["contact_id"],
            properties=props,
            layer=EDGE_INTERACTED_WITH,
        )

    return g


def print_summary(g: Graph, data: dict) -> None:
    print("\n── Graph Summary ──────────────────────────────")
    print(f"  Nodes  : {g.count_nodes():,}")
    print(f"  Edges  : {g.count_edges():,}")
    print(f"\n  Bankers      : {len(data['bankers']):,}")
    print(f"  Contacts     : {len(data['contacts']):,}")
    print(f"  Deals        : {len(data['deals']):,}")
    print(f"  Campaigns    : {len(data['campaigns']):,}")
    print(f"  Events       : {len(data['events']):,}")
    print(f"  Nominations  : {len(data['nominations']):,}")
    print(f"  Interactions : {len(data['interactions']):,}")
    print(f"\n  Graph saved to: {GRAPH_PATH}")
    print("────────────────────────────────────────────────\n")


if __name__ == "__main__":
    t0 = time.time()
    print("=== Pandora CRM Graph Ingestion ===\n")

    print("Step 1/2  Generating mock data...")
    data = generate_all()

    print("\nStep 2/2  Building Raphtory graph...")
    g = build_graph(data)

    g.save_to_file(GRAPH_PATH)

    print_summary(g, data)
    print(f"Done in {time.time() - t0:.1f}s")
