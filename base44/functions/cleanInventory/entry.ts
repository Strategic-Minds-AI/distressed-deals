import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { cleanInventoryData } from "../../shared/inventoryCleanup.ts";

/**
 * Inventory cleanup — repairs missing/dead images, withdraws duplicates and incomplete records.
 * Pass validateImages: true in the request body to also check image URLs for liveness.
 */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const validateImages = body.validateImages === true;

    const isAdmin = user.role === "admin";
    const isAgent = user.data && user.data.portal_role === "agent";
    if (!isAdmin && !isAgent) {
      return Response.json({ error: "Forbidden — admin or agent only" }, { status: 403 });
    }

    const result = await cleanInventoryData(base44, { validateImages });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}