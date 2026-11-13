# Broward source intake register | Property Deal OS
Status: **Discovery candidates only, NOT licensed ingestion or legal permission**. Scope: existing mission `6af66728667d5d2261bdd064`, no new spend and no live contact. Reviewed 2026-11-13 UTC.

| Public primary-party portal | Potential records | What must be independently confirmed before ingestion |
|---|---|---|
| https://web.bcpa.net/ | County property appraisal, parcel/folio and assessed parcel details | Public-record reuse conditions, authorized programmatic access method, current parcel identity, applicable provenance and privacy restrictions |
| https://browardtax.org/public-records/ | County tax collector public-records request process | Request/response provenance, retention, redistribution/automation terms and current date |
| https://browardtax.org/faqs/property-taxes-delinquent/ | Delinquent-tax list discovery | Actual tax status, update date, permitted use, correct owner attribution, no inference of a willing seller |
| https://www.broward.org/RECORDSTAXESTREASURY | County recording/tax-deed research | Court/title/recording source authority, exact instrument and status, no claim that title is clear |
| https://broward.deedauction.net/auctions | Auction-specific listing/terms | Source rights, auction dates, deposit/terms and title/occupancy risks; DO NOT bid automatically |

**Read-only live source findings:** Supabase project `fwtchbsebygwifmmqhur` has `distressed_properties=15` (2 Florida, 0 verified in last 30 days, no county/parcel columns) and `properties=791` (657 Florida, 0 verified in last 30 days, most recent verification 2026-09-08 UTC). Existing Railway production sync logged nonproductive “No Supabase tables found yet” at 2026-11-13 04:00 UTC. Historical rows, listing hyperlinks and the existence of a public portal are NOT proof of current listing availability, owner consent, data re-use rights, or investment opportunity.

**Execution threshold:** Obtain five independently source-verified, current, permitted Broward property records, each with exact parcel ID + full address, source URL, legal-use evidence reference, signed provenance and verified timestamp, while independently checking that the source does not prohibit automated access. Only load into an isolated owner-approved staging environment. Cross-tenant/ambiguous records go to review. Do not mark a property as for sale or distressed based on tax/property records alone.

**What remains blocked:** per-source automated data rights, actual current Broward supply, staged source-schema migration, X1/Railway productive cycle, buyer/agent authorization, tenancy, MCP and independent Guardian. No live sends, offers, payments, live calls or production promotion permitted.
