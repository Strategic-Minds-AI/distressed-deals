import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";
import { syncSupabaseToEntities } from "../../shared/supabaseSync.ts";

/**
 * Railway worker endpoint — authenticates via WORKER_SECRET instead of user session.
 * The Railway worker calls this with `Authorization: Bearer <WORKER_SECRET>`.
 */
export default async function (req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const workerSecret = secrets.get("WORKER_SECRET");
    if (!workerSecret) {
      return Response.json({ error: "WORKER_SECRET not configured — set it in Secrets" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${workerSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const result = await syncSupabaseToEntities(base44);

    const status = result.error ? 500 : 200;
    return Response.json(result, { status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}