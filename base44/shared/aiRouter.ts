/**
 * AI Router — task-to-model routing with cost/latency budgets.
 * Wraps aiGateway.callAI so callers specify a task type, not a model.
 */
import { callAI, AI_MODELS, AICallResult } from "./aiGateway";

export type TaskType = "classify" | "generate" | "analyze" | "reason" | "evaluate" | "summarize";

const TASK_MODEL_MAP: Record<TaskType, string> = {
  classify: AI_MODELS.fast,
  generate: AI_MODELS.balanced,
  analyze: AI_MODELS.balanced,
  reason: AI_MODELS.reasoning,
  evaluate: AI_MODELS.balanced,
  summarize: AI_MODELS.fast,
};

export interface RouteOpts {
  model?: string;
  response_json_schema?: object;
  max_tokens?: number;
  temperature?: number;
  project_id?: string;
  run_id?: string;
}

export async function routeAI(
  task: TaskType,
  messages: Array<{ role: string; content: string }>,
  opts?: RouteOpts
): Promise<AICallResult> {
  const model = opts?.model ?? TASK_MODEL_MAP[task];
  return callAI({ model, messages, ...opts });
}

export function estimateCost(model: string, tokens: number): number {
  // rough per-1K-token cost in credits (placeholder — real metering comes from gateway usage)
  const rates: Record<string, number> = {
    [AI_MODELS.fast]: 0.15,
    [AI_MODELS.balanced]: 2.5,
    [AI_MODELS.powerful]: 3.0,
    [AI_MODELS.reasoning]: 6.0,
    [AI_MODELS.gemini]: 1.25,
  };
  return Math.round(((rates[model] ?? 1) * tokens) / 1000);
}