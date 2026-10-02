import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    // Read existing entries (up to 500 — covers all 486)
    const page = await base44.asServiceRole.entities.RegistryEntry.filter({}, { limit: 500 });
    const existing = page.items || [];

    if (existing.length === 0) {
      return Response.json({ error: "No existing entries to re-seed — initial seed required via exec_tool" });
    }

    // Strip system fields for recreation
    const entries = existing.map(({ id, created_date, updated_date, created_by_id, ...rest }) => rest);

    // Delete all existing
    await base44.asServiceRole.entities.RegistryEntry.deleteMany({});

    // Recreate from stored data
    const created = await base44.asServiceRole.entities.RegistryEntry.bulkCreate(entries);

    return Response.json({ created: created.length, total: entries.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}