import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { syncSupabaseToEntities } from "../../shared/supabaseSync.ts";
import { validateAvailability } from "../../shared/availabilityValidation.ts";
import { cleanInventoryData } from "../../shared/inventoryCleanup.ts";

/**
 * Full end-to-end inventory pipeline — runs on a schedule via workflow.
 * Steps: Sync from Supabase → Validate availability → Clean inventory.
 *
 * Auth: admin users can trigger manually; workflow calls run as service role.
 */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: allow admin users OR workflow (service-role) calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === "admin") isAuthorized = true;
    } catch {
      // No user session — workflow call, allow as service role
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const startedAt = new Date().toISOString();

    // Step 1: Sync from Supabase
    const syncResult = await syncSupabaseToEntities(base44);

    // Step 2: Validate availability (only if sync succeeded)
    let validationResult: any = null;
    if (!syncResult.error) {
      validationResult = await validateAvailability(base44);
    }

    // Step 3: Clean inventory (fix images, withdraw duplicates/incomplete)
    const cleanupResult = await cleanInventoryData(base44, { validateImages: false });

    return Response.json({
      status: "pipeline_complete",
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      sync: syncResult,
      validation: validationResult,
      cleanup: cleanupResult,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}