# Property Deal OS | Local Agent Continuity

**Tested status:** 62 original functional-equivalent roles, 248 market-scoped profiles (not 248 running models), 12 deterministic local handlers and a SQLite WAL continuation ledger. No live Tranchi, lender, telephone, or other third-party agents have been copied.

**Authority:** The existing X1 mission and Supabase database remain source truth. This is a local non-PII mirror for recoverable internal work, NOT a second scheduler or a shadow CRM. The CLI never sends messages or bids on properties. All externally acting roles remain ADAPTER_REQUIRED and WAITING_PROVIDER.

**Node requirement:** JARVIS has Node v24.14.0 with built-in node:sqlite; its API emitted an experimental warning in testing. Pin the runtime before running elsewhere.

## JARVIS local state path

Default use explicit variable DEALOPS_STATE_DB set to C:\_Strategic_Minds_AI_OS\02_Active_Builds\PROPERTY_DEAL_OS\state.sqlite. Existing SQLite file contains a SYNTHETIC_ONLY screening fixture and receipt. Avoid placing sensitive owner contacts or credentials here. On Unix enforce filesystem permissions; Windows uses inherited ACLs, which must be verified before storing anything beyond synthetic or non-PII metadata.

## Commands (from dealops-mcp folder)

- node agent-runtime/cli.mjs catalog
- node agent-runtime/cli.mjs status
- node agent-runtime/cli.mjs demo    (synthetic math only, idempotent fixture)
- node agent-runtime/cli.mjs work-one    (one non-external work item only)

To use the persistent custom state file, set DEALOPS_STATE_DB in the caller's authorized environment, not in the repository. Do not create a second timer; call the CLI from existing authorized X1 orchestration only after that route has a live worker capability and completion receipt.

## Recovery and limitations

Idempotency prevents duplicate work; local work is leased for bounded periods; expired local leases can recover, only for non-external deterministic handlers; retries stop at three attempts. A checksum receipt proves local computation, not provider delivery, a signed deal, a qualified buyer, or a closing. The catalog exposes declared role profiles only; implementation-grade adapters to sources, official records, lender access, Google and Twilio still need authenticated integration and security validation. Resume via the existing X1 task property-deal-os:broward-pilot:v1. Do not auto-publish or expose contacts.

## Gate: production

Provider permissions, actual authorized data freshness, authenticated MCP transport, tenant isolation, agent legal authority, frontend user journeys, communications consent, independent Guardian, rollback and actual runtime receipts remain required before production.
