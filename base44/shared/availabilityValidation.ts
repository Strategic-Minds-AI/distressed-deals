/**
 * Property availability AUDIT, intentionally read-only.
 * Passing an auction date never proves sale; listing age never proves withdrawal.
 * Original function signature preserved for existing callers.
 */
import { assessAvailabilityEvidence } from './availabilityEvidence.js';

export async function validateAvailability(base44: any): Promise<any> {
  const page = await base44.asServiceRole.entities.Property.filter(
    { status: { $in: ['Active', 'Under Contract', 'Pending'] } },
    { sort: '-listed_date', limit: 500, fields: ['id', 'status', 'auction_date', 'listed_date'] }
  );
  if (!Array.isArray(page?.items)) {
    return { status: 'SOURCE_NOT_READABLE', applied: false, verified_available: 0, error: 'INVALID_PROPERTY_PAGE' };
  }
  const report = assessAvailabilityEvidence(page.items, { now: Date.now(), staleDays: 120 });
  return {
    ...report, checked_at: new Date().toISOString(),
    pagination_complete: page.has_more !== true,
    notice: 'No status changes or verification timestamps were written. External source confirmation is required.'
  };
}
