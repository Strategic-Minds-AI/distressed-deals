import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requests = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } } },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'dealops_status', arguments: {} } },
  { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'dealops_policy', arguments: {} } },
  { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'dealops_preview_properties', arguments: { limit: 3 } } },
  { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'dealops_preview_properties', arguments: { limit: 1000 } } },
  { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'dealops_agent_catalog', arguments: { limit: 3 } } },
  { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'dealops_local_checkpoint', arguments: {} } }
];
test('stdio MCP handshake, tool listing, fail-closed data and gated actions', () => {
  const env = { ...process.env, PROPERTY_SUPABASE_URL: '', PROPERTY_SUPABASE_READ_KEY: '', DEALOPS_LOCAL_READ_ENABLED: 'false' };
  const p = spawnSync(process.execPath, [join(root,'server.mjs')], { input: requests.map(x => JSON.stringify(x)).join('\n') + '\n', encoding: 'utf8', timeout: 5000, env });
  assert.equal(p.status, 0, 'server must exit cleanly on EOF: ' + p.stderr);
  const responses = p.stdout.trim().split('\n').map(x => JSON.parse(x));
  assert.equal(responses.length, 8);
  assert.equal(responses[0].result.serverInfo.name, 'property-deal-os');
  assert.equal(responses[1].result.tools.length, 5);
  assert.equal(JSON.parse(responses[2].result.content[0].text).database_configured, false);
  const policy = JSON.parse(responses[3].result.content[0].text);
  assert.equal(policy.no_external_sends, true);
  assert.ok(policy.requires_human_review.includes('binding_offers'));
  assert.equal(responses[4].result.isError, true, 'missing data credential must deny reads');
  assert.equal(responses[5].result.isError, true, 'oversized list request must deny reads');
  const catalog = JSON.parse(responses[6].result.content[0].text);
  assert.equal(catalog.summary.roleDefinitions,62);
  assert.equal(catalog.summary.configuredProfiles,248);
  assert.equal(catalog.items.length,3);
  assert.equal(responses[7].result.isError,true,'local state remains unreadable without local grant');
  assert.doesNotMatch(p.stdout, /service_role|contact_phone|owner_email/, 'never expose owner PII or credential names');
});
