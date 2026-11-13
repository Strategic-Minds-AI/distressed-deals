# Property Deal OS | Broward County pilot build contract
Revision: 0.1.0 | Authority: owner-instructed reversible development only | New spend cap: $0

## Product objective
Reuse Hidden Property Intel (discovery, owner provenance, scoring), Distressed Deals (analysis, investor portal, offer pipeline), Universal Property Intelligence Supabase (candidate canonical source) and existing X1/Railway worker (background execution) to create one operable property-to-close workflow. Use the existing X1 Platform Factory PRIME plugin and X1 Operating Systems MCP. Do not create duplicate queues or a second scheduler.

## Verified discovery snapshot: 2026-11-12
- Supabase project `fwtchbsebygwifmmqhur`, Universal Property Intelligence: 791 property rows, 657 state=FL, 360 rows with last_verified_at (all older than 60 days), 15 distressed_property rows, only 2 of the 15 state=FL and none verified.
- Existing Distressed Deals Railway worker is online and fires every two hours, but repeatedly logs no source table. Its Base44 sync code selected the first authorized Supabase project, not the named property project. A fallback deleted previously imported inventory. This branch removes the destructive fallback and requires an explicitly authorized project and table.
- Existing working endpoints, real source rights, buyer credentials and agent authority are NOT proven by row counts or frontend file names.

## Delivery gates and accountable lane
| Step | Owner | Evidence required | Rollback |
|---|---|---|---|
| 0. Baseline freeze | X1 factory + GitHub | repo/SHA/deployed branch reconciliation; original state snapshot | no writes |
| 1. Deterministic source binding | backend builder | explicit project/table, wrong-project denies, missing secret denies | revert isolated branch |
| 2. Read-only pilot sample | data specialist | 5 permitted NEW Broward parcels, source URL, parcel key, freshness, no duplicates | discard staging |
| 3. Safe sync | backend + Guardian | upsert stable keys, zero deletion on failures, idempotent replays | restore snapshot |
| 4. Underwriting | estimator + agents | deterministic comps and rehab sensitivity; missing data flags; 10 fixture tests | revert feature |
| 5. Two agent seats | authorized owner + broker | verified brokerage affiliation and scoped roles, negative tenant tests | revoke app access |
| 6. Buyer demand | licensed partners | qualified buyer criteria and consent for introductions | quarantine contacts |
| 7. Transaction handoff | agents/counsel/title | offer and assignment docs lawyer-approved, human signatures only | stop before commitments |
| 8. Loop & recovery | X1/Railway | two consecutive 2-hour successful cycles, dead-letter/retry, zero-feed alert, no duplicate outreach | disable worker trigger |
| 9. Independent Guardian | separate validator | exact SHA, browser mobile/desktop, RLS, failure mode, receipt and rollback checks | deny release |
| 10. Pilot outcome | owner+agents | accepted opportunities -> signed agreements -> closed proceeds from title receipts | stop/iterate |

## Minimum pilot product
One owner dashboard with fresh sourced opportunities, data quality, deal underwriting, next action, owner approval gates, agent assignments, investor buy-box criteria, contracts and title tracking, a zero-ad acquisition channel, and daily results. Build within the existing apps, not a third disconnected UI. Drafting and evidence gathering may be automated; no automated signed offers, impersonation, illegal brokerage activity, new outbound audience, payments, or production release.

## Shortest path to commercial evidence
1. Choose one paid outcome: qualified seller leads handled by licensed brokerage partners OR subscription-based access to lawful real-estate intelligence; resolve compensation with a Florida real-estate attorney and supervising broker before accepting referral/commission fees.
2. Establish two agents' buyer buy-boxes and target neighborhoods; no full Florida scrape before demand evidence.
3. Pilot 10-25 sourced candidates each week; human-verify 5 most promising, document exceptions and buyer interest.
4. Track: source freshness, verified property %, time-to-agent-review, matched-buyers, partner acceptance, authorized offers, close rate, net realized revenue and per-deal cost. Zero signed/closed transactions means zero recognized transactional revenue.
5. Reinvest only after first measurable transactions or paying SaaS customers; avoid paid ads and paid data until source quality proves useful.

## Persistence and autonomy
Persist one X1 mission key `property-deal-os:broward-pilot:v1`, task DAG and receipts. A two-hour Railway worker handles ingestion; X1 controls queue state, leases, idempotency, retry and escalations. ChatGPT plugin/MCP is a command interface, not the background process. Missing input and protected actions create one approval card instead of sending mail/text/contract. Guardian may block production.

## Current release state
PLUGIN UPDATED: X1 Platform Factory PRIME v0.2.0 with Property Deal OS skill.
SOURCE PATCH: this branch only; not merged.
MCP: read-only stdio adapter in dealops-mcp; tool visibility/ChatGPT connection not yet verified.
DATA: source exists; freshness and legal source rights not established.
RELEASE: BLOCKED pending source, DB configuration, QA, legal/broker role verification and isolated end-to-end test.

## Eden unified communications scope (owner-added 2026-11-12)
Add a single conversation timeline and agent handoff for inbound/outbound Eden Gmail, Twilio SMS/MMS and AI voice. Reuse existing Eden Call Desk and the appropriate Strategic Minds AI Twilio connection. Do not use XPS Comms identities/tenant to send on this property venture. For every channel: verified sender, recipient/purpose consent or other required legal authorization, suppression/STOP, quiet hours, A2P registration where applicable, cost cap, idempotency key, reply threading, send/call status receipt, no blind retries, source property and agent, and tenant role isolation. Inbound verified inquiries may be classified and drafted immediately; external responses must pass channel-specific and cost gates. Draft, qualify and escalate instead of cold AI robocalling property owners. Eden identifies herself as an AI assistant and offers human transfer for voice. Calls, texts or email to new recipients/campaigns remain approval-gated. Independent Guardian must test wrong-tenant, opt-out, replay, unauthorized-send and webhook spoofing paths.

Provider audit: Eden Gmail profile is available natively as eden@strategicmindsai.com. Eden Call Desk's site-level Gmail/Twilio messaging binding is pending and its SMS readiness is live=false; direct Twilio inspect returned 401. Strategic Communications bridge advertises healthy receipt/outbox capabilities but currently has no contact delivery receipts in this tenant. A current channel capabilities flag is NOT evidence that voice and SMS have successfully sent. Current source implementation is `docs/property-deal-os/EDEN_COMMUNICATIONS_CONTRACT.md` and pure guard `dealops-mcp/communications/policy.mjs` with `dealops-mcp/test/communications.test.mjs`.
