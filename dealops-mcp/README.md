# Property Deal OS MCP (local adapter, preview branch)

This is a **read-only local stdio MCP server**; no new hosting, cron, or port is created. It does not yet appear as callable property tools in the ChatGPT account. The upgraded X1 Platform Factory PRIME plugin continues using the previously attached X1 Operating Systems app/MCP for routing. This adapter requires separate testing and authorized connection before use in ChatGPT.

## Quick start on authorized JARVIS computer

```powershell
cd dealops-mcp
$env:PROPERTY_SUPABASE_URL = 'https://fwtchbsebygwifmmqhur.supabase.co'
# Configure a dedicated minimum-scope read key securely in the host; never paste it into chat, files, or Git.
node server.mjs
```

The process communicates on stdin/stdout with standard MCP JSON-RPC newline framing; connect from an authenticated local MCP client only. Tool surface: `dealops_status`, `dealops_policy`, and `dealops_preview_properties`. All are read-only, return no contacts or owner PII, and fail closed without a valid scoped key. Do not supply an all-powerful service-role key for this read-only adapter; instead create scoped access with the user's authorized identity and RLS. No contract execution, automated outbound, money movements, external installs, or public access.

## Tests and release
Run `npm test`; verify a real local MCP handshake, RLS negative tests, actual provider source freshness, provenance and tenant separation. Do not deploy/connect this adapter without a secured OAuth/tunnel route, Guardian review, and a new explicit release gate. Server does not run in the background on its own; recurring tasks remain with the existing Railway/X1 worker.
