import { createInterface } from 'node:readline';
import { existsSync } from 'node:fs';
import { BASE_ROLES, summarizeCatalog } from './agent-runtime/catalog.mjs';
import { openLedger } from './agent-runtime/ledger.mjs';

// Local stdio MCP adapter. No second scheduler, no inbound network port, no writes.
// Deploy/attach to ChatGPT only after the authenticated tool path passes Guardian QA.
const SERVER = { name: 'property-deal-os', version: '0.2.0' };
const PROTOCOL = '2025-11-25';
const TOOL_SPECS = [
  { name: 'dealops_status', description: 'Read-only capability and configuration health for the existing property system.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'dealops_policy', description: 'List authorization gates for offers, communications, title, closing, and paid actions.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'dealops_preview_properties', description: 'Preview up to 25 Florida property record metadata rows; no contact PII and no writes.', inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 25 } }, additionalProperties: false } },
  { name: 'dealops_agent_catalog', description: 'List bounded original property agent definitions and whether handlers exist. Configured roles are not autonomous live agents.', inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 25 }, offset: { type: 'integer', minimum: 0 } }, additionalProperties: false } },
  { name: 'dealops_local_checkpoint', description: 'Read a local non-PII mission checkpoint only when local owner-scoped access is explicitly enabled.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }
];
const info = {
  policy_version: 'fl-pilot-v1',
  scope: 'Florida property evidence screening only',
  no_ads: true, no_external_sends: true, no_paid_actions: true,
  requires_human_review: ['binding_offers', 'contract_assignments', 'electronic_signatures', 'title_and_escrow', 'licensed_brokerage_activity', 'new_outbound_recipients', 'production_deployment']
};
function send(result) { process.stdout.write(JSON.stringify(result) + '\n'); }
function asContent(value, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], isError };
}
function configured() {
  const url = process.env.PROPERTY_SUPABASE_URL || '';
  const key = process.env.PROPERTY_SUPABASE_READ_KEY || '';
  let hostValid = false;
  try {
    const parsed = new URL(url);
    hostValid = parsed.protocol === 'https:' && /^[a-z0-9]{20}\.supabase\.co$/.test(parsed.hostname) && parsed.pathname === '/';
  } catch { /* fail closed */ }
  return { hostValid, hasKey: key.length >= 16, url };
}
async function preview(args) {
  const n = Number(args?.limit ?? 10);
  if (!Number.isInteger(n) || n < 1 || n > 25) return asContent({ error: 'limit must be 1 to 25' }, true);
  const cfg = configured();
  if (!cfg.hostValid || !cfg.hasKey) return asContent({ status: 'NOT_CONFIGURED', details: 'Server-side PROPERTY_SUPABASE_URL and a scoped PROPERTY_SUPABASE_READ_KEY are required' }, true);
  const url = new URL('/rest/v1/properties', cfg.url);
  url.searchParams.set('select', 'id,city,state,status,source_url,last_verified_at,scraped_at,distress_type,property_score');
  url.searchParams.set('state', 'eq.FL');
  url.searchParams.set('limit', String(n));
  url.searchParams.set('order', 'last_verified_at.desc.nullslast');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { headers: { apikey: process.env.PROPERTY_SUPABASE_READ_KEY, Authorization: 'Bearer ' + process.env.PROPERTY_SUPABASE_READ_KEY }, signal: controller.signal });
    if (!response.ok) return asContent({ status: 'SOURCE_UNAVAILABLE', http_status: response.status }, true);
    const rows = await response.json();
    if (!Array.isArray(rows)) return asContent({ status: 'INVALID_RESPONSE' }, true);
    const now = Date.now();
    const items = rows.map((r) => {
      const t = Date.parse(r.last_verified_at || '');
      return {
        id: String(r.id), city: String(r.city || ''), state: String(r.state || ''),
        status: String(r.status || ''), distress_type: String(r.distress_type || ''),
        evidence_url_present: Boolean(r.source_url),
        last_verified_at: r.last_verified_at || null,
        verified_within_30_days: Number.isFinite(t) && now - t >= 0 && now - t <= 30 * 86400000,
        score: typeof r.property_score === 'number' ? r.property_score : null
      };
    });
    return asContent({ status: 'SCREENING_ONLY', count: items.length, items, disclaimer: 'Not an appraisal, title report, seller authorization, or verified offer opportunity' });
  } catch (error) {
    return asContent({ status: 'SOURCE_UNAVAILABLE', error: error?.name === 'AbortError' ? 'timeout' : 'request_failed' }, true);
  } finally { clearTimeout(timer); }
}
async function invoke(name, args) {
  switch (name) {
    case 'dealops_status': {
      const cfg = configured();
      return asContent({ server: SERVER, adapter: 'local-stdio', connected_to_chatgpt: false, database_configured: cfg.hostValid && cfg.hasKey, scheduler: 'reuse existing X1/Railway', runtime_health: 'UNKNOWN_UNTIL_LIVE_READ', read_only: true });
    }
    case 'dealops_policy': return asContent(info);
    case 'dealops_preview_properties': return preview(args);
    case 'dealops_agent_catalog': {
      const limit = Number(args?.limit ?? 10), offset=Number(args?.offset ?? 0);
      if(!Number.isInteger(limit)||limit<1||limit>25||!Number.isInteger(offset)||offset<0||offset>1000)
        return asContent({error:'INVALID_PAGINATION'},true);
      return asContent({status:'DEFINITIONS_ONLY',summary:summarizeCatalog(),items:BASE_ROLES.slice(offset,offset+limit),nextOffset:offset+limit<BASE_ROLES.length?offset+limit:null});
    }
    case 'dealops_local_checkpoint': {
      if(process.env.DEALOPS_LOCAL_READ_ENABLED!=='true'||!process.env.DEALOPS_STATE_DB||!existsSync(process.env.DEALOPS_STATE_DB))
        return asContent({status:'LOCAL_CONTINUITY_NOT_AUTHORIZED_OR_MISSING'},true);
      const ledger=openLedger(process.env.DEALOPS_STATE_DB);
      try{return asContent(ledger.snapshot('strategic-minds-ai','property-deal-os:broward-pilot:v1'));}finally{ledger.close();}
    }
    default: return asContent({ error: 'Unknown tool' }, true);
  }
}
async function handle(msg) {
  if (typeof msg !== 'object' || msg === null || !msg.method) return;
  if (msg.id === undefined) return; // notifications never get responses
  try {
    let result;
    switch (msg.method) {
      case 'initialize':
        result = { protocolVersion: PROTOCOL, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER };
        break;
      case 'ping': result = {}; break;
      case 'tools/list': result = { tools: TOOL_SPECS }; break;
      case 'tools/call': result = await invoke(msg.params?.name, msg.params?.arguments ?? {}); break;
      default: send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'Method not found' } }); return;
    }
    send({ jsonrpc: '2.0', id: msg.id, result });
  } catch { send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: 'Internal error' } }); }
}
const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of input) {
  try { await handle(JSON.parse(line)); }
  catch { /* malformed JSON ignored; no sensitive stderr/stdout content */ }
}
