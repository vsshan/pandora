"""
Mock data generators for all 6 CRM domains.
Produces deterministic data (seed=42) for reproducible graph builds.
"""

import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()
Faker.seed(42)
random.seed(42)

# ── Constants ─────────────────────────────────────────────────────────────────

BANKS = [
    "Goldman Sachs", "Morgan Stanley", "JPMorgan Chase", "Bank of America",
    "Citigroup", "Wells Fargo", "Barclays", "Deutsche Bank", "UBS", "Credit Suisse",
]

BANKER_ROLES = [
    "Managing Director", "Director", "Vice President", "Associate",
    "Senior Associate", "Executive Director",
]

SECTORS = [
    "Technology", "Healthcare", "Financial Services", "Energy", "Consumer",
    "Industrials", "Real Estate", "Media & Entertainment", "Telecom", "Utilities",
]

CONTACT_TITLES = [
    "CEO", "CFO", "COO", "CTO", "President", "Managing Director", "EVP Finance",
    "SVP Corporate Development", "Treasurer", "VP Strategy", "Head of M&A",
    "General Counsel", "Chief Investment Officer", "Controller", "VP Finance",
]

INTERACTION_TYPES = ["meeting", "call", "email"]

INTERACTION_NOTES_TEMPLATES = [
    "Discussed Q{q} earnings outlook and capital allocation strategy.",
    "Reviewed term sheet for the proposed {sector} acquisition target.",
    "Follow-up on pending mandate; client expressed interest in {type} transaction.",
    "Introductory call — built rapport, identified near-term financing needs.",
    "Presented updated valuation materials; client requested revised DCF.",
    "Client raised concerns about market timing; agreed to reconvene next quarter.",
    "Signed NDA and shared preliminary information memorandum.",
    "Management presentation with senior team; strong strategic fit confirmed.",
    "Discussed competitor activity and defensive positioning options.",
    "Advisory session on dividend policy and share buyback program.",
    "Reviewed pipeline of potential targets in the {sector} space.",
    "Due diligence update call; no material issues identified.",
    "Pitch for sell-side mandate on planned {type} transaction.",
    "Caught up on regulatory developments impacting the sector.",
    "Year-end check-in; reaffirmed strategic priorities for next year.",
]

DEAL_TYPES = ["M&A", "IPO", "Debt Financing", "Equity Offering", "Advisory"]
DEAL_STAGES = ["Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]

CAMPAIGN_TYPES = ["Email", "Event Series", "Roadshow", "Direct Outreach", "Research Distribution"]
CAMPAIGN_STATUSES = ["Active", "Completed", "Planned"]

EVENT_TYPES = ["Conference", "Roadshow", "Client Dinner", "Webinar", "Industry Summit"]
EVENT_LOCATIONS = [
    "New York", "London", "San Francisco", "Chicago", "Boston",
    "Los Angeles", "Houston", "Singapore", "Hong Kong", "Zurich",
]

NOMINATION_CATEGORIES = [
    "Top Client 2024", "Most Innovative CFO", "Deal of the Year",
    "Rising Star", "Banker of the Year", "M&A Advisory Excellence",
    "ESG Leader", "Best IPO", "Debt Market Award", "Strategic Advisor",
]
NOMINATION_STATUSES = ["Pending", "Approved", "Rejected"]

BASE_DATE = datetime(2020, 1, 1)
END_DATE = datetime(2025, 12, 31)


def _random_date(start: datetime = BASE_DATE, end: datetime = END_DATE) -> datetime:
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


def _ts(dt: datetime) -> int:
    return int(dt.timestamp() * 1000)


# ── Generators ────────────────────────────────────────────────────────────────

def generate_bankers(n: int = 100) -> list[dict]:
    bankers = []
    for i in range(n):
        bankers.append({
            "id": f"banker_{i}",
            "name": fake.name(),
            "bank": random.choice(BANKS),
            "role": random.choice(BANKER_ROLES),
            "email": fake.email(),
            "created_at": _ts(BASE_DATE),
        })
    return bankers


def generate_contacts(n: int = 50_000) -> list[dict]:
    contacts = []
    for i in range(n):
        sector = random.choice(SECTORS)
        contacts.append({
            "id": f"contact_{i}",
            "name": fake.name(),
            "company": fake.company(),
            "title": random.choice(CONTACT_TITLES),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "tier": random.choices(["A", "B", "C"], weights=[0.15, 0.35, 0.50])[0],
            "sector": sector,
            "created_at": _ts(_random_date(BASE_DATE, datetime(2022, 1, 1))),
        })
    return contacts


def generate_interactions(
    n: int = 50_000,
    bankers: list[dict] | None = None,
    contacts: list[dict] | None = None,
) -> list[dict]:
    interactions = []
    banker_ids = [b["id"] for b in bankers] if bankers else [f"banker_{i}" for i in range(100)]
    contact_ids = [c["id"] for c in contacts] if contacts else [f"contact_{i}" for i in range(50_000)]

    for i in range(n):
        dt = _random_date()
        sector = random.choice(SECTORS)
        deal_type = random.choice(DEAL_TYPES)
        template = random.choice(INTERACTION_NOTES_TEMPLATES)
        notes = template.format(
            q=random.randint(1, 4),
            sector=sector,
            type=deal_type,
        )
        interactions.append({
            "id": f"interaction_{i}",
            "banker_id": random.choice(banker_ids),
            "contact_id": random.choice(contact_ids),
            "type": random.choice(INTERACTION_TYPES),
            "notes": notes,
            "duration_min": random.choice([15, 30, 45, 60, 90, 120]) if random.random() > 0.3 else None,
            "timestamp": _ts(dt),
            "date_str": dt.strftime("%Y-%m-%d"),
        })
    return interactions


def generate_deals(
    n: int = 500,
    bankers: list[dict] | None = None,
    contacts: list[dict] | None = None,
) -> list[dict]:
    deals = []
    banker_ids = [b["id"] for b in bankers] if bankers else [f"banker_{i}" for i in range(100)]
    contact_ids = [c["id"] for c in contacts] if contacts else [f"contact_{i}" for i in range(50_000)]

    for i in range(n):
        sector = random.choice(SECTORS)
        deal_type = random.choice(DEAL_TYPES)
        stage = random.choices(
            DEAL_STAGES,
            weights=[0.20, 0.25, 0.20, 0.25, 0.10],
        )[0]
        value = round(random.uniform(5e6, 5e9), -5)  # $5M – $5B rounded to $100K
        dt = _random_date()
        # 2–6 contacts per deal
        deal_contacts = random.sample(contact_ids, k=random.randint(2, 6))
        deals.append({
            "id": f"deal_{i}",
            "name": f"{fake.company()} {deal_type} {dt.year}",
            "type": deal_type,
            "sector": sector,
            "stage": stage,
            "value_usd": value,
            "banker_id": random.choice(banker_ids),
            "contact_ids": deal_contacts,
            "timestamp": _ts(dt),
            "date_str": dt.strftime("%Y-%m-%d"),
        })
    return deals


def generate_campaigns(
    n: int = 50,
    contacts: list[dict] | None = None,
) -> list[dict]:
    campaigns = []
    contact_ids = [c["id"] for c in contacts] if contacts else [f"contact_{i}" for i in range(50_000)]

    for i in range(n):
        status = random.choice(CAMPAIGN_STATUSES)
        dt = _random_date()
        # 200–2000 contacts per campaign
        size = random.randint(200, 2000)
        campaign_contacts = random.sample(contact_ids, k=min(size, len(contact_ids)))
        campaigns.append({
            "id": f"campaign_{i}",
            "name": f"{fake.catch_phrase()} Campaign {dt.year}",
            "type": random.choice(CAMPAIGN_TYPES),
            "status": status,
            "contact_ids": campaign_contacts,
            "timestamp": _ts(dt),
            "date_str": dt.strftime("%Y-%m-%d"),
        })
    return campaigns


def generate_events(
    n: int = 300,
    bankers: list[dict] | None = None,
    contacts: list[dict] | None = None,
) -> list[dict]:
    events = []
    banker_ids = [b["id"] for b in bankers] if bankers else [f"banker_{i}" for i in range(100)]
    contact_ids = [c["id"] for c in contacts] if contacts else [f"contact_{i}" for i in range(50_000)]

    for i in range(n):
        dt = _random_date()
        # 10–150 attendees per event
        size = random.randint(10, 150)
        attendees = random.sample(contact_ids, k=min(size, len(contact_ids)))
        hosts = random.sample(banker_ids, k=random.randint(1, 4))
        events.append({
            "id": f"event_{i}",
            "name": f"{fake.company()} {random.choice(EVENT_TYPES)} {dt.year}",
            "type": random.choice(EVENT_TYPES),
            "location": random.choice(EVENT_LOCATIONS),
            "attendee_ids": attendees,
            "host_banker_ids": hosts,
            "timestamp": _ts(dt),
            "date_str": dt.strftime("%Y-%m-%d"),
        })
    return events


def generate_nominations(
    n: int = 500,
    bankers: list[dict] | None = None,
    contacts: list[dict] | None = None,
) -> list[dict]:
    nominations = []
    banker_ids = [b["id"] for b in bankers] if bankers else [f"banker_{i}" for i in range(100)]
    contact_ids = [c["id"] for c in contacts] if contacts else [f"contact_{i}" for i in range(50_000)]

    for i in range(n):
        dt = _random_date()
        nominations.append({
            "id": f"nomination_{i}",
            "contact_id": random.choice(contact_ids),
            "banker_id": random.choice(banker_ids),
            "category": random.choice(NOMINATION_CATEGORIES),
            "status": random.choices(
                NOMINATION_STATUSES,
                weights=[0.40, 0.45, 0.15],
            )[0],
            "year": dt.year,
            "timestamp": _ts(dt),
            "date_str": dt.strftime("%Y-%m-%d"),
        })
    return nominations


def generate_all() -> dict:
    print("Generating bankers (100)...")
    bankers = generate_bankers(100)

    print("Generating contacts (50,000)...")
    contacts = generate_contacts(50_000)

    print("Generating interactions (50,000)...")
    interactions = generate_interactions(50_000, bankers=bankers, contacts=contacts)

    print("Generating deals (500)...")
    deals = generate_deals(500, bankers=bankers, contacts=contacts)

    print("Generating campaigns (50)...")
    campaigns = generate_campaigns(50, contacts=contacts)

    print("Generating events (300)...")
    events = generate_events(300, bankers=bankers, contacts=contacts)

    print("Generating nominations (500)...")
    nominations = generate_nominations(500, bankers=bankers, contacts=contacts)

    return {
        "bankers": bankers,
        "contacts": contacts,
        "interactions": interactions,
        "deals": deals,
        "campaigns": campaigns,
        "events": events,
        "nominations": nominations,
    }
