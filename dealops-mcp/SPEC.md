# Property Deal OS MCP | Working specification

Status: isolated source specification, not an authenticated or deployed property MCP.

## Product context and value
The property platform already has separate Hidden Property Intel, Distressed Deals, a Base44 data-cleaning ZIP, a local X1 runtime, Railway ingestion and Eden Gmail/Twilio integrations. The problem is fractured source provenance, data freshness, property matching, agent handoff and a lack of provider-verified end-to-end transactions. Real users are the owner and two licensed real-estate-agent partners initially, then authenticated qualified investors and approved title/lender partners.

## Why conversational MCP rather than reproducing the whole website
Use a small set of atomic conversational intents that reduce context switching. Full contact/transaction dashboards remain the responsive application:
1. **Find and explain an opportunity**: get tenant-scoped, fresh-source property matches with evidence and risk flags.
2. **Evaluate a strategy**: receive a source-backed input and compute deterministic contract-flip, DSCR, BRRRR, seller-finance or multifamily screening with missing-data warnings; do not infer lender approval or legal rights.
3. **Check and resume a task**: show actual X1 worker/receipt and first incomplete gate; suggest safe next action without fabricating completion.

## Proposed tools, pending authenticated implementation
- `dealops_list_opportunities({market,limit})`: bounded array with parcel identifier, provenance URL, verified_at, property and deal state.
- `dealops_screen_strategy({propertyId,strategy,metrics})`: pure numerical screening library plus source-age and mandatory title/agent review gates; never automatic offer/bid.
- `dealops_get_status({missionId})`: authoritative X1 task, worker, provider health, verified receipts and blocked approvals.

Optional chat UI: opportunity list/details and approval-needed state, one view per user intent; do not duplicate the full PWA into ChatGPT. Each tool returns useful data without lazy-loading personal information.

## Identity, authorization and release
Reuse the existing user-authorized X1 Operating Systems MCP binding; if an additional property-specific endpoint is essential, attach one authenticated verified adapter on existing infrastructure, not another scheduler. Require tenant/role auth, row-level restrictions, short-lived credentials, rate limits, audit trail and negative tests. Sensitive owner contacts and lender data require explicit scopes. Nonbinding draft only; no automatic title representation, auction bid, assignment, property contract, loan commitment, payment or bulk outreach. Consent/STOP/recording and AI voice rules belong to Eden's separate secure provider dispatch.

## Implementation state
The current source includes a local read-only `dealops-mcp/server.mjs` and a separately tested pure strategy model `dealops-mcp/strategies/underwrite.mjs`. Neither proves this proposed API is connected or production ready. Next step is a verified authenticated provider-backed read path and tenant-negative tests, then independent Guardian validation. The target benchmark is documented in `docs/property-deal-os/TRANCHI_OPERATOR_BENCHMARK.md`.
