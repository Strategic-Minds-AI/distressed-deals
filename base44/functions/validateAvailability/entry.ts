import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

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

    const now = new Date();
    const staleDays = 120;
    const staleThreshold = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);

    const page = await base44.asServiceRole.entities.Property.filter(
      { status: { $in: ["Active", "Under Contract", "Pending"] } },
      { sort: "-listed_date", limit: 500, fields: ["id", "title", "status", "auction_date", "listed_date"] }
    );
    const properties = page.items || [];

    const updates: any[] = [];
    let markedSold = 0;
    let markedWithdrawn = 0;
    let verifiedAvailable = 0;
    const changes: any[] = [];

    for (const prop of properties) {
      let newStatus: string | null = null;
      let reason = "";

      // Rule 1: Auction date has passed
      if (prop.auction_date) {
        const auctionDate = new Date(prop.auction_date);
        if (auctionDate < now) {
          newStatus = "Sold";
          reason = `Auction date passed (${auctionDate.toDateString()})`;
        }
      }

      // Rule 2: Listing has been on the market too long
      if (!newStatus && prop.listed_date) {
        const listedDate = new Date(prop.listed_date);
        const daysOnMarket = Math.round((now.getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOnMarket > staleDays) {
          newStatus = "Withdrawn";
          reason = `Listing expired (${daysOnMarket} days on market)`;
        }
      }

      const update: any = { id: prop.id, verified_at: now.toISOString() };
      if (newStatus) {
        update.status = newStatus;
        if (newStatus === "Sold") markedSold++;
        else markedWithdrawn++;
        changes.push({ title: prop.title, action: newStatus, reason });
      } else {
        verifiedAvailable++;
      }
      updates.push(update);
    }

    if (updates.length > 0) {
      await base44.asServiceRole.entities.Property.bulkUpdate(updates);
    }

    return Response.json({
      status: "validated",
      checked_at: now.toISOString(),
      report: {
        total_checked: properties.length,
        marked_sold: markedSold,
        marked_withdrawn: markedWithdrawn,
        verified_available: verifiedAvailable,
      },
      changes: changes.slice(0, 50),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}