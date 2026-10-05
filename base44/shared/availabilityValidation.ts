/**
 * Shared availability validation logic.
 * Used by validateAvailability (user-auth) and runPipeline (service-role).
 */

export async function validateAvailability(base44: any): Promise<any> {
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

  return {
    status: "validated",
    checked_at: now.toISOString(),
    report: {
      total_checked: properties.length,
      marked_sold: markedSold,
      marked_withdrawn: markedWithdrawn,
      verified_available: verifiedAvailable,
    },
    changes: changes.slice(0, 50),
  };
}