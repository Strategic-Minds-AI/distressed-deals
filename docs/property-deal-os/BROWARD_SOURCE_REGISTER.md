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

## 2026-11-13 03:00 ET source discovery checkpoint (research-only)

- Broward Tax Collector states that a full delinquent-property-tax file is available for download through its public reporting/search site, or by requesting the list from its office. Official source: https://browardtax.org/faqs/property-taxes-delinquent/ ; public records: https://browardtax.org/public-records/. **Availability of a public download is not permission to bulk resell, redistribute, infer owner willingness, or send outreach.** Confirm the dataset's reuse/access terms and update cadence before automated ingestion.
- A separate third-party research index, https://deedtrail.com/florida/broward , displayed upcoming November 23, 2026 tax-deed *candidate* parcel identifiers `494128-DC-0190`, `484201-03-0820`, `494136-BE-0290`, `494125-HM-0590`, `504201-BA-0600`. These are **unverified third-party leads only**. Do not treat an estimated auction date, opening bid or assessment as current availability, clear title, verified ownership, source license or permission to solicit.
- The official RealAuction portal https://broward.realtaxdeed.com/ returned HTTP 403 to the read-only web fetch during this check; do not bypass anti-bot/login mechanisms. These five identifiers lack independently confirmed official source record + complete parcel address + programmatic reuse rights, so they **do not count toward** the five-record release gate.
- Direct Supabase read of project `fwtchbsebygwifmmqhur` again found `properties=791`, `Florida=657`, `recently verified=0`, and `distressed_properties=15`, `Florida=2`, `recently verified=0`. No data was changed. **Accepted fresh-source inventory remains 0/5.**
