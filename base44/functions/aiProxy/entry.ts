import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";

const GATEWAY_URL = "https://ai-gateway.vercel.app/v1/chat/completions";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { prompt, response_json_schema, model, system_prompt, messages, temperature, max_tokens } = body;

    if (!prompt && !messages) return Response.json({ error: "prompt or messages required" }, { status: 400 });

    const key = secrets.get("AI_VERCEL_GATEWAY_KEY");
    if (!key) return Response.json({ error: "AI_VERCEL_GATEWAY_KEY not configured — set it in Secrets" }, { status: 500 });

    const msgs = messages || [];
    if (system_prompt) msgs.unshift({ role: "system", content: system_prompt });
    if (prompt) msgs.push({ role: "user", content: prompt });

    const reqBody = {
      model: model || "openai/gpt-4o-mini",
      messages: msgs,
      max_tokens: max_tokens ?? 4096,
      temperature: temperature ?? 0.4,
    };
    if (response_json_schema) {
      reqBody.response_format = {
        type: "json_schema",
        json_schema: { name: "response", schema: response_json_schema, strict: false },
      };
    }

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return Response.json({ error: `Gateway ${res.status}: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    let json;
    if (response_json_schema && content) {
      try { json = JSON.parse(content); } catch { json = undefined; }
    }
    return Response.json({ content, json, usage: data.usage });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}