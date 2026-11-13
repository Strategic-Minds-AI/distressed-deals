// Pure report only. A passed auction date is not evidence a property sold.
// A stale listing is not proof it was withdrawn. No dates alone verify availability.
export function assessAvailabilityEvidence(properties, { now = Date.now(), staleDays = 120 } = {}) {
  if (!Array.isArray(properties) || !Number.isFinite(now) || !Number.isInteger(staleDays) || staleDays < 1 || staleDays > 365)
    throw new TypeError('INVALID_AVAILABILITY_AUDIT_INPUT');
  const cutoff = now - staleDays * 86400000;
  const issues = [];
  const counts = { total_checked: 0, auction_date_passed: 0, listing_age_unverified: 0,
    missing_date_evidence: 0, requires_source_recheck: 0, verified_available: 0,
    marked_sold: 0, marked_withdrawn: 0, status_writes: 0 };
  for (const p of properties) {
    if (!p || typeof p !== 'object') continue;
    counts.total_checked++;
    const flags = [];
    const auction = p.auction_date ? Date.parse(String(p.auction_date)) : NaN;
    const listed = p.listed_date ? Date.parse(String(p.listed_date)) : NaN;
    if (Number.isFinite(auction) && auction < now) { flags.push('PAST_AUCTION_DATE_RECHECK'); counts.auction_date_passed++; }
    if (Number.isFinite(listed) && listed < cutoff) { flags.push('OLD_LISTING_RECHECK'); counts.listing_age_unverified++; }
    if (!Number.isFinite(auction) && !Number.isFinite(listed)) { flags.push('MISSING_DATE_EVIDENCE'); counts.missing_date_evidence++; }
    flags.push('CURRENT_LISTING_AND_TITLE_UNVERIFIED');
    counts.requires_source_recheck++;
    if (issues.length < 100) issues.push({ propertyId: String(p.id ?? ''), flags });
  }
  return { status: 'REVIEW_ONLY', applied: false, counts, issues,
    note: 'No statuses or verified_at timestamps were modified. Verify listing, ownership and title with authorized current sources.' };
}
