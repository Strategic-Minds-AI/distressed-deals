/**
 * Vercel AI Gateway caller — bypasses Base44 integration credits.
 * All AI calls in the factory route through here so credits are never consumed.
 * When the key is missing, returns NOT_CONFIGURED with exact required config.
 */

const GATEWAY_URL = "https://ai-gateway.vercel.app/v1/chat/completions";

export interface AICallParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  response_json_schema?: object;
  max_tokens?: number;
  temperature?: number;
  project_id?: string;
  run_id?: string;
}

export interface AICallResult {
  status: "ok" | "NOT_CONFIGURED" | "error";
  content?: string;
  json?: any;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
  error?: string;
  required?: string;
}

export async function callAI(params: AICallParams): Promise<AICallResult> {
  const key = process.env.AI_VERCEL_GATEWAY_KEY;
  if (!key) {
    return {
      status: "NOT_CONFIGURED",
      error: "AI_VERCEL_GATEWAY_KEY secret is not set",
      required: "Set AI_VERCEL_GATEWAY_KEY in App Settings → Secrets",
    };
  }
  try {
    const body: any = {
      model: params.model,
      messages: params.messages,
      max_tokens: params.max_tokens ?? 4096,
      temperature: params.temperature ?? 0.4,
    };
    if (params.response_json_schema) {
      body.response_format = {
        type: "json_schema",
        json_schema: { name: "response", schema: params.response_json_schema, strict: false },
      };
    }
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { status: "error", error: `Gateway ${res.status}: ${text}`, model: params.model };
    }
    const data: any = await res.json();
    const choice = data.choices?.[0];
    const content: string = choice?.message?.content ?? "";
    let json: any;
    if (params.response_json_schema && content) {
      try { json = JSON.parse(content); } catch { json = undefined; }
    }
    return { status: "ok", content, json, usage: data.usage, model: params.model };
  } catch (e: any) {
    return { status: "error", error: e?.message ?? String(e), model: params.model };
  }
}

export const AI_MODELS = {
  fast: "openai/gpt-4o-mini",
  balanced: "openai/gpt-4o",
  powerful: "anthropic/claude-3-5-sonnet-latest",
  reasoning: "openai/o1-mini",
  gemini: "google/gemini-1.5-pro",
} as const;

export async function checkGatewayHealth(): Promise<{ configured: boolean; key_prefix?: string; message: string }> {
  const key = process.env.AI_VERCEL_GATEWAY_KEY;
  if (!key) return { configured: false, message: "NOT_CONFIGURED — set AI_VERCEL_GATEWAY_KEY in Secrets" };
  return { configured: true, key_prefix: key.slice(0, 8) + "…", message: "Gateway key present" };
}