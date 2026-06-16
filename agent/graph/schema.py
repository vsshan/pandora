"""
Raphtory graph schema constants for the 6 CRM domains.
"""

# ── Vertex type labels ────────────────────────────────────────────────────────

VERTEX_CONTACT = "Contact"
VERTEX_BANKER = "Banker"
VERTEX_DEAL = "Deal"
VERTEX_CAMPAIGN = "Campaign"
VERTEX_EVENT = "Event"
VERTEX_NOMINATION = "Nomination"

# ── Edge type labels ──────────────────────────────────────────────────────────

# Banker ──INTERACTED_WITH──> Contact  (timestamped per interaction)
EDGE_INTERACTED_WITH = "INTERACTED_WITH"

# Banker ──MANAGING_DEAL──> Deal
EDGE_MANAGING_DEAL = "MANAGING_DEAL"

# Contact ──IN_DEAL──> Deal
EDGE_IN_DEAL = "IN_DEAL"

# Contact ──IN_CAMPAIGN──> Campaign
EDGE_IN_CAMPAIGN = "IN_CAMPAIGN"

# Contact ──ATTENDED_EVENT──> Event
EDGE_ATTENDED_EVENT = "ATTENDED_EVENT"

# Banker ──HOSTED_EVENT──> Event
EDGE_HOSTED_EVENT = "HOSTED_EVENT"

# Contact ──NOMINATED_FOR──> Nomination
EDGE_NOMINATED_FOR = "NOMINATED_FOR"

# Banker ──SUBMITTED_NOMINATION──> Nomination
EDGE_SUBMITTED_NOMINATION = "SUBMITTED_NOMINATION"

# ── Property keys — Contact ───────────────────────────────────────────────────

PROP_CONTACT_NAME = "name"
PROP_CONTACT_COMPANY = "company"
PROP_CONTACT_TITLE = "title"
PROP_CONTACT_EMAIL = "email"
PROP_CONTACT_PHONE = "phone"
PROP_CONTACT_TIER = "tier"          # A, B, C
PROP_CONTACT_SECTOR = "sector"

# ── Property keys — Banker ───────────────────────────────────────────────────

PROP_BANKER_NAME = "name"
PROP_BANKER_BANK = "bank"
PROP_BANKER_ROLE = "role"
PROP_BANKER_EMAIL = "email"

# ── Property keys — Interaction (edge) ───────────────────────────────────────

PROP_INTERACTION_TYPE = "type"      # meeting, call, email
PROP_INTERACTION_NOTES = "notes"
PROP_INTERACTION_DURATION = "duration_min"

# ── Property keys — Deal ─────────────────────────────────────────────────────

PROP_DEAL_NAME = "name"
PROP_DEAL_VALUE = "value_usd"
PROP_DEAL_STAGE = "stage"           # Discovery, Proposal, Negotiation, Closed Won, Closed Lost
PROP_DEAL_SECTOR = "sector"
PROP_DEAL_TYPE = "type"             # M&A, IPO, Debt, Equity, Advisory

# ── Property keys — Campaign ─────────────────────────────────────────────────

PROP_CAMPAIGN_NAME = "name"
PROP_CAMPAIGN_TYPE = "type"         # Email, Event, Roadshow, Direct Outreach
PROP_CAMPAIGN_STATUS = "status"     # Active, Completed, Planned

# ── Property keys — Event ────────────────────────────────────────────────────

PROP_EVENT_NAME = "name"
PROP_EVENT_TYPE = "type"            # Conference, Roadshow, Dinner, Webinar
PROP_EVENT_LOCATION = "location"
PROP_EVENT_DATE = "date"

# ── Property keys — Nomination ───────────────────────────────────────────────

PROP_NOMINATION_CATEGORY = "category"
PROP_NOMINATION_STATUS = "status"   # Pending, Approved, Rejected
PROP_NOMINATION_YEAR = "year"
