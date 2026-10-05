import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { validateAvailability } from "../../shared/availabilityValidation.ts";

/**
 * Validates that active properties are still available.
 * Rule-based checks:
 * 1. Auction date passed → mark as Sold
 * 2. Listing on market > 120 days → mark as Withdrawn
 * 3. Otherwise → stamp verified_at (still available)
 *
 * Returns a validation report with counts and change details.
 */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    const result = await validateAvailability(base44);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}