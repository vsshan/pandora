"""Run once: python3 generate_interactions.py  — writes data/interactions.json"""
import json, os

# Bankers (internal nodes)
BANKERS = ["alex_thornton", "caroline_swift", "marcus_webb", "priyanka_rao"]

# Raw interaction tuples: (id, date, from, to, type, banker, company_id, notes)
RAW = [
    # ── INNOVATECH (~28) ───────────────────────────────────────────────────────
    # Eleanor Vance — hot, warming (8 recent, 3 prior)
    ("i001","2026-04-18T10:00:00Z","alex_thornton","eleanor_vance","meeting","Alex Thornton","innovatech","Q1 results debrief and M&A pipeline discussion"),
    ("i002","2026-04-05T14:30:00Z","alex_thornton","eleanor_vance","call","Alex Thornton","innovatech","Follow-up on board presentation timeline"),
    ("i003","2026-03-20T09:00:00Z","alex_thornton","eleanor_vance","meeting","Alex Thornton","innovatech","Strategic options review — Series D vs IPO path"),
    ("i004","2026-03-08T11:00:00Z","caroline_swift","eleanor_vance","call","Caroline Swift","innovatech","Intro call re: secondary market opportunities"),
    ("i005","2026-02-25T15:00:00Z","alex_thornton","eleanor_vance","meeting","Alex Thornton","innovatech","Financial model walk-through with CFO present"),
    ("i006","2026-02-10T10:00:00Z","alex_thornton","eleanor_vance","dinner","Alex Thornton","innovatech","Annual client dinner — relationship building"),
    ("i007","2026-01-28T14:00:00Z","alex_thornton","eleanor_vance","call","Alex Thornton","innovatech","Year-end check-in and 2026 priorities"),
    ("i008","2026-01-15T09:30:00Z","caroline_swift","eleanor_vance","meeting","Caroline Swift","innovatech","Comparable company analysis presentation"),
    # prior window (Oct 28 – Jan 26)
    ("i009","2025-12-10T13:00:00Z","alex_thornton","eleanor_vance","meeting","Alex Thornton","innovatech","Q4 pipeline review and year-end planning"),
    ("i010","2025-11-05T10:00:00Z","alex_thornton","eleanor_vance","call","Alex Thornton","innovatech","Post-earnings follow-up"),
    ("i011","2025-10-15T15:00:00Z","alex_thornton","eleanor_vance","meeting","Alex Thornton","innovatech","Q3 board prep session"),

    # David Kim — cooling (1 recent, 6 prior)
    ("i012","2026-04-02T10:00:00Z","marcus_webb","david_kim","call","Marcus Webb","innovatech","Quick catch-up on Q1 close"),
    ("i013","2025-12-18T14:00:00Z","marcus_webb","david_kim","meeting","Marcus Webb","innovatech","FY budget finalisation discussion"),
    ("i014","2025-11-25T10:30:00Z","marcus_webb","david_kim","call","Marcus Webb","innovatech","Working capital review"),
    ("i015","2025-11-05T09:00:00Z","alex_thornton","david_kim","meeting","Alex Thornton","innovatech","Refinancing options deep-dive"),
    ("i016","2025-10-10T14:00:00Z","marcus_webb","david_kim","call","Marcus Webb","innovatech","Monthly treasury update"),
    ("i017","2025-09-20T10:00:00Z","alex_thornton","david_kim","meeting","Alex Thornton","innovatech","Half-year financial review"),
    ("i018","2025-08-08T15:00:00Z","marcus_webb","david_kim","call","Marcus Webb","innovatech","Credit facility renewal prep"),

    # Lisa Park — warm
    ("i019","2026-03-15T11:00:00Z","caroline_swift","lisa_park","meeting","Caroline Swift","innovatech","Operational efficiency benchmarking"),
    ("i020","2026-02-20T14:00:00Z","caroline_swift","lisa_park","call","Caroline Swift","innovatech","Supply chain financing discussion"),
    ("i021","2025-12-05T10:00:00Z","alex_thornton","lisa_park","meeting","Alex Thornton","innovatech","Year-end operational review"),
    ("i022","2025-09-10T13:00:00Z","caroline_swift","lisa_park","call","Caroline Swift","innovatech","Intro to new coverage team"),

    # Marcus Huang & others
    ("i023","2026-02-28T09:00:00Z","priyanka_rao","marcus_huang","meeting","Priyanka Rao","innovatech","Tech roadmap and capex planning"),
    ("i024","2025-11-15T14:00:00Z","priyanka_rao","marcus_huang","call","Priyanka Rao","innovatech","Cloud infrastructure financing"),
    ("i025","2025-08-20T10:00:00Z","priyanka_rao","marcus_huang","meeting","Priyanka Rao","innovatech","R&D investment structuring"),
    ("i026","2026-03-28T11:00:00Z","caroline_swift","sophie_adler","call","Caroline Swift","innovatech","Revenue growth strategy call"),
    ("i027","2026-01-10T14:00:00Z","alex_thornton","paul_nguyen","meeting","Alex Thornton","innovatech","Corporate development roadmap"),
    ("i028","2025-10-20T09:00:00Z","marcus_webb","rachel_stone","call","Marcus Webb","innovatech","Debt covenant review"),

    # ── QUANTUM DYNAMICS (~18) ─────────────────────────────────────────────────
    # Nina Foster — declining (1 recent, 7 prior)
    ("i029","2026-03-05T10:00:00Z","alex_thornton","nina_foster","call","Alex Thornton","quantum","Brief Q4 check-in"),
    ("i030","2025-12-15T14:00:00Z","alex_thornton","nina_foster","meeting","Alex Thornton","quantum","Annual strategy review"),
    ("i031","2025-11-28T10:00:00Z","alex_thornton","nina_foster","meeting","Alex Thornton","quantum","M&A financing options"),
    ("i032","2025-11-10T09:00:00Z","caroline_swift","nina_foster","call","Caroline Swift","quantum","Follow-up on term sheet"),
    ("i033","2025-10-25T14:00:00Z","alex_thornton","nina_foster","call","Alex Thornton","quantum","Earnings prep discussion"),
    ("i034","2025-10-08T11:00:00Z","alex_thornton","nina_foster","meeting","Alex Thornton","quantum","Q3 financial review"),
    ("i035","2025-09-20T10:00:00Z","caroline_swift","nina_foster","meeting","Caroline Swift","quantum","Refinancing roadshow prep"),
    ("i036","2025-09-05T14:00:00Z","alex_thornton","nina_foster","call","Alex Thornton","quantum","Post-summer reactivation call"),

    # Raj Patel — stable
    ("i037","2026-02-15T10:00:00Z","alex_thornton","raj_patel","meeting","Alex Thornton","quantum","Leadership transition briefing"),
    ("i038","2025-11-10T14:00:00Z","alex_thornton","raj_patel","meeting","Alex Thornton","quantum","Sector landscape discussion"),
    ("i039","2025-08-20T09:00:00Z","caroline_swift","raj_patel","call","Caroline Swift","quantum","Intro to new M&A product"),

    # Others
    ("i040","2026-01-20T10:00:00Z","marcus_webb","tom_bradley","meeting","Marcus Webb","quantum","Competitive positioning analysis"),
    ("i041","2025-10-05T14:00:00Z","marcus_webb","tom_bradley","call","Marcus Webb","quantum","Strategic options call"),
    ("i042","2025-12-01T11:00:00Z","priyanka_rao","claire_xu","meeting","Priyanka Rao","quantum","Technology M&A screening"),
    ("i043","2025-11-15T10:00:00Z","caroline_swift","derek_miles","call","Caroline Swift","quantum","Operations debrief"),
    ("i044","2025-09-10T14:00:00Z","priyanka_rao","sasha_burns","meeting","Priyanka Rao","quantum","Corporate development intro"),
    ("i045","2026-01-08T10:00:00Z","marcus_webb","helen_grant","call","Marcus Webb","quantum","Investor relations update"),
    ("i046","2025-12-20T09:00:00Z","priyanka_rao","fiona_blake","meeting","Priyanka Rao","quantum","Finance team intro meeting"),

    # ── ATLAS HEALTHCARE (~20, new coverage ramp-up) ──────────────────────────
    # Dr. James Okafor — hot, growing (all recent)
    ("i047","2026-04-20T10:00:00Z","alex_thornton","dr_james_okafor","meeting","Alex Thornton","atlas","Strategic options — acquisition targets shortlist"),
    ("i048","2026-04-08T14:00:00Z","alex_thornton","dr_james_okafor","call","Alex Thornton","atlas","Board narrative preparation"),
    ("i049","2026-03-25T10:00:00Z","alex_thornton","dr_james_okafor","meeting","Alex Thornton","atlas","Valuation framework presentation"),
    ("i050","2026-03-12T11:00:00Z","caroline_swift","dr_james_okafor","call","Caroline Swift","atlas","Introduction to sector specialists"),
    ("i051","2026-02-28T14:00:00Z","alex_thornton","dr_james_okafor","meeting","Alex Thornton","atlas","Full coverage kick-off"),
    ("i052","2025-12-18T10:00:00Z","alex_thornton","dr_james_okafor","meeting","Alex Thornton","atlas","Initial coverage intro — healthcare sector"),

    # Sarah Novak
    ("i053","2026-04-15T09:00:00Z","marcus_webb","sarah_novak","meeting","Marcus Webb","atlas","Financial due diligence prep"),
    ("i054","2026-03-28T14:00:00Z","marcus_webb","sarah_novak","call","Marcus Webb","atlas","Debt capacity analysis"),
    ("i055","2026-02-12T10:00:00Z","marcus_webb","sarah_novak","meeting","Marcus Webb","atlas","Treasury and liquidity review"),

    # Brendan Walsh
    ("i056","2026-04-10T11:00:00Z","priyanka_rao","brendan_walsh","call","Priyanka Rao","atlas","Regulatory approval process walkthrough"),
    ("i057","2026-03-18T14:00:00Z","priyanka_rao","brendan_walsh","meeting","Priyanka Rao","atlas","Compliance framework for M&A"),

    # Mei Lin & others
    ("i058","2026-04-22T10:00:00Z","caroline_swift","mei_lin","call","Caroline Swift","atlas","Operational integration planning"),
    ("i059","2026-04-01T09:00:00Z","caroline_swift","mei_lin","meeting","Caroline Swift","atlas","Supply chain and ops discussion"),
    ("i060","2026-02-05T14:00:00Z","priyanka_rao","oliver_jones","meeting","Priyanka Rao","atlas","Digital health tech landscape"),
    ("i061","2026-03-05T10:00:00Z","caroline_swift","grace_hall","call","Caroline Swift","atlas","Corporate dev priorities 2026"),
    ("i062","2026-02-18T11:00:00Z","alex_thornton","noah_harris","meeting","Alex Thornton","atlas","Growth strategy alignment"),
    ("i063","2026-04-05T14:00:00Z","marcus_webb","isabelle_petit","call","Marcus Webb","atlas","Budget and capex planning"),
    ("i064","2026-01-25T10:00:00Z","priyanka_rao","sam_obi","meeting","Priyanka Rao","atlas","Stakeholder coordination meeting"),
    ("i065","2026-03-22T09:00:00Z","marcus_webb","vera_ilyina","call","Marcus Webb","atlas","IR strategy for upcoming roadshow"),

    # ── MERIDIAN CAPITAL (~15, steady quarterly) ──────────────────────────────
    # Diana Ross — warm, stable
    ("i066","2026-04-02T10:00:00Z","alex_thornton","diana_ross","meeting","Alex Thornton","meridian","Q1 deal flow review"),
    ("i067","2026-01-15T14:00:00Z","alex_thornton","diana_ross","meeting","Alex Thornton","meridian","Q4 portfolio update and new mandates"),
    ("i068","2025-10-10T10:00:00Z","alex_thornton","diana_ross","meeting","Alex Thornton","meridian","Q3 strategy discussion"),
    ("i069","2025-07-08T09:00:00Z","alex_thornton","diana_ross","meeting","Alex Thornton","meridian","Mid-year deal pipeline"),

    # Kevin Chen
    ("i070","2026-03-20T14:00:00Z","caroline_swift","kevin_chen","call","Caroline Swift","meridian","Sector screening update"),
    ("i071","2025-12-15T10:00:00Z","caroline_swift","kevin_chen","meeting","Caroline Swift","meridian","Year-end deal structuring"),
    ("i072","2025-09-10T11:00:00Z","caroline_swift","kevin_chen","call","Caroline Swift","meridian","Portfolio company financing"),

    # Priya Mehta & others
    ("i073","2026-02-15T10:00:00Z","marcus_webb","priya_mehta","meeting","Marcus Webb","meridian","Investment committee prep"),
    ("i074","2025-11-20T14:00:00Z","marcus_webb","priya_mehta","call","Marcus Webb","meridian","Term sheet negotiation"),
    ("i075","2025-08-12T09:00:00Z","marcus_webb","priya_mehta","meeting","Marcus Webb","meridian","Deal origination discussion"),
    ("i076","2026-01-25T10:00:00Z","priyanka_rao","carlos_ruiz","call","Priyanka Rao","meridian","New mandate exploration"),
    ("i077","2025-10-20T14:00:00Z","priyanka_rao","felix_hartmann","meeting","Priyanka Rao","meridian","Deal structure workshop"),
    ("i078","2025-12-05T10:00:00Z","marcus_webb","natasha_wright","call","Marcus Webb","meridian","Fund accounting review"),
    ("i079","2026-03-10T09:00:00Z","caroline_swift","alice_morgan","meeting","Caroline Swift","meridian","Junior team briefing"),
    ("i080","2025-09-25T14:00:00Z","priyanka_rao","henry_booth","call","Priyanka Rao","meridian","LP relations update"),

    # ── APEX BIOTECH (~10, stable) ────────────────────────────────────────────
    ("i081","2026-04-08T10:00:00Z","caroline_swift","andrea_bell","meeting","Caroline Swift","apex","Business development partnership"),
    ("i082","2026-03-25T14:00:00Z","alex_thornton","dr_amara_osei","meeting","Alex Thornton","apex","Pipeline financing review"),
    ("i083","2026-02-25T09:00:00Z","marcus_webb","patrick_stern","call","Marcus Webb","apex","Q4 financial close"),
    ("i084","2026-01-20T10:00:00Z","alex_thornton","dr_amara_osei","meeting","Alex Thornton","apex","2026 capital strategy"),
    ("i085","2025-12-20T14:00:00Z","priyanka_rao","rina_kobayashi","call","Priyanka Rao","apex","Clinical trial funding structure"),
    ("i086","2025-11-10T10:00:00Z","marcus_webb","patrick_stern","meeting","Marcus Webb","apex","Convertible note refinancing"),
    ("i087","2025-10-15T09:00:00Z","alex_thornton","dr_amara_osei","call","Alex Thornton","apex","Q3 milestones update"),
    ("i088","2025-09-15T14:00:00Z","priyanka_rao","david_oduya","meeting","Priyanka Rao","apex","Ops and manufacturing capex"),
    ("i089","2025-07-20T10:00:00Z","alex_thornton","dr_amara_osei","meeting","Alex Thornton","apex","Mid-year strategy review"),
    ("i090","2025-12-08T11:00:00Z","caroline_swift","zara_patel","call","Caroline Swift","apex","Investor roadshow prep"),

    # ── NORWOOD ENERGY (~10, growing deal) ───────────────────────────────────
    ("i091","2026-04-18T10:00:00Z","alex_thornton","george_hayes","meeting","Alex Thornton","norwood","Term sheet negotiation — debt financing"),
    ("i092","2026-04-10T14:00:00Z","marcus_webb","linda_wu","call","Marcus Webb","norwood","Financial model Q&A"),
    ("i093","2026-03-28T09:00:00Z","alex_thornton","george_hayes","meeting","Alex Thornton","norwood","Mandate signing and kickoff"),
    ("i094","2026-03-15T10:00:00Z","caroline_swift","linda_wu","meeting","Caroline Swift","norwood","Treasury and hedging strategy"),
    ("i095","2026-03-05T14:00:00Z","priyanka_rao","luke_davis","meeting","Priyanka Rao","norwood","Corporate dev intro"),
    ("i096","2026-02-20T10:00:00Z","alex_thornton","george_hayes","call","Alex Thornton","norwood","Initial coverage pitch"),
    ("i097","2026-02-10T09:00:00Z","marcus_webb","ethan_brooks","meeting","Marcus Webb","norwood","Asset base and capex review"),
    ("i098","2026-01-22T14:00:00Z","priyanka_rao","hana_kim","call","Priyanka Rao","norwood","Strategy team introduction"),
    ("i099","2025-12-15T10:00:00Z","alex_thornton","george_hayes","meeting","Alex Thornton","norwood","Warm intro via referral"),
    ("i100","2026-04-05T11:00:00Z","caroline_swift","sofia_garcia","call","Caroline Swift","norwood","Operations overview"),

    # ── BLUE RIDGE RETAIL (~9, mixed) ─────────────────────────────────────────
    # Mike Santos — warm, stable
    ("i101","2026-03-12T10:00:00Z","alex_thornton","mike_santos","meeting","Alex Thornton","blueridge","Retail sector M&A landscape"),
    ("i102","2026-01-20T14:00:00Z","alex_thornton","mike_santos","meeting","Alex Thornton","blueridge","Strategic options for FY2026"),
    ("i103","2025-10-08T09:00:00Z","caroline_swift","mike_santos","call","Caroline Swift","blueridge","Post-earnings check-in"),
    ("i104","2025-07-15T10:00:00Z","alex_thornton","mike_santos","meeting","Alex Thornton","blueridge","Mid-year relationship review"),
    # Jane Holt — cooling, last contact Dec 2025
    ("i105","2025-12-20T14:00:00Z","marcus_webb","jane_holt","meeting","Marcus Webb","blueridge","Year-end treasury review"),
    ("i106","2025-09-15T10:00:00Z","marcus_webb","jane_holt","call","Marcus Webb","blueridge","Refinancing options"),
    ("i107","2025-06-10T09:00:00Z","marcus_webb","jane_holt","meeting","Marcus Webb","blueridge","H1 financial review"),
    # Others
    ("i108","2026-02-05T10:00:00Z","priyanka_rao","roberto_silva","call","Priyanka Rao","blueridge","Supply chain financing"),
    ("i109","2025-10-22T14:00:00Z","priyanka_rao","roberto_silva","meeting","Priyanka Rao","blueridge","Logistics cost optimisation"),

    # ── VERTEX SEMICONDUCTORS (~5, all dormant) ───────────────────────────────
    ("i110","2025-09-05T10:00:00Z","alex_thornton","claire_dupont","meeting","Alex Thornton","vertex","Last BD discussion before coverage pause"),
    ("i111","2025-08-12T14:00:00Z","alex_thornton","yuki_tanaka","meeting","Alex Thornton","vertex","Mid-year coverage meeting"),
    ("i112","2025-07-15T09:00:00Z","alex_thornton","alan_morrison","meeting","Alex Thornton","vertex","Q2 financial update"),
    ("i113","2025-07-01T10:00:00Z","caroline_swift","peter_walsh","call","Caroline Swift","vertex","Tech capex discussion"),
    ("i114","2025-06-20T14:00:00Z","marcus_webb","yuki_tanaka","call","Marcus Webb","vertex","Refinancing pre-screening"),

    # ── PINNACLE TECH (~4, brand new) ────────────────────────────────────────
    ("i115","2026-04-22T10:00:00Z","alex_thornton","victor_stone","meeting","Alex Thornton","pinnacle","First coverage meeting — sector intro"),
    ("i116","2026-04-18T14:00:00Z","caroline_swift","julia_mann","call","Caroline Swift","pinnacle","Finance team introduction"),
    ("i117","2026-04-15T09:00:00Z","priyanka_rao","leon_adeyemi","meeting","Priyanka Rao","pinnacle","Tech landscape discussion"),
    ("i118","2026-04-12T11:00:00Z","marcus_webb","sarah_jenkins","call","Marcus Webb","pinnacle","Initial ops introduction"),

    # ── CLEARPATH LOGISTICS (~2, very early) ─────────────────────────────────
    ("i119","2026-04-24T10:00:00Z","alex_thornton","svetlana_morozova","meeting","Alex Thornton","clearpath","Cold outreach intro — logistics sector coverage"),
    ("i120","2026-04-14T14:00:00Z","marcus_webb","kwame_asante","call","Marcus Webb","clearpath","Warm intro via Meridian referral"),
]

interactions = [
    {
        "id": r[0],
        "timestamp": r[1],
        "from_id": r[2],
        "to_id": r[3],
        "interaction_type": r[4],
        "banker": r[5],
        "company_id": r[6],
        "notes": r[7],
    }
    for r in RAW
]

out_path = os.path.join(os.path.dirname(__file__), "data", "interactions.json")
with open(out_path, "w") as f:
    json.dump({"interactions": interactions}, f, indent=2)

print(f"Written {len(interactions)} interactions to {out_path}")
from collections import Counter
c = Counter(r[6] for r in RAW)
for k, v in sorted(c.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v}")
