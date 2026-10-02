import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { syncSupabaseToEntities } from "../../shared/supabaseSync.ts";

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    const result = await syncSupabaseToEntities(base44);
    const status = result.error ? 500 : 200;
    return Response.json(result, { status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}