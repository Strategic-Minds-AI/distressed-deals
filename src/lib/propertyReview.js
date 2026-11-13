// Fail-closed client presentation gate. The backend/agent must independently
// enforce authorization; UI labels do NOT establish property/title/consent rights.
const trim = value => String(value ?? '').trim();
function safeHttps(url) {
  try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password && u.hostname.includes('.'); }
  catch { return false; }
}
export function inspectPropertyForReview(property = {}, asOf = Date.now()) {
  const reasons = [];
  const t = Date.parse(trim(property.verified_at));
  const recent = Number.isFinite(t) && t <= asOf && asOf - t <= 30 * 86400000;
  if (!recent) reasons.push('CURRENT_SOURCE_NOT_VERIFIED');
  if (!safeHttps(property.listing_url)) reasons.push('SOURCE_LINK_NOT_VERIFIED');
  if (!trim(property.county) || !trim(property.parcel_id)) reasons.push('PARCEL_AND_COUNTY_NOT_VERIFIED');
  if (property.source_rights_confirmed !== true || !trim(property.source_rights_ref))
    reasons.push('SOURCE_USE_RIGHTS_UNVERIFIED');
  // Independent title, availability, agency and buyer funding remain human-reviewed.
  const licensedPhotos = property.image_use_authorized === true && trim(property.image_rights_ref) &&
    Array.isArray(property.images);
  const photoUrl = licensedPhotos ? property.images.find(safeHttps) || null : null;
  const numeric = ['arv','estimated_repair_cost','asking_price'].every(k => typeof property[k] === 'number' && Number.isFinite(property[k]) && property[k] > 0);
  return {
    sourceReadyForAgentReview: reasons.length === 0,
    reasons,
    hasInvestmentInputs: numeric,
    photoUrl,
    photoRightsConfirmed: Boolean(photoUrl),
    mayContactOwner: false,
    maySendBindingOffer: false,
    note: 'Research signal only until independent source, title, legal authority and contact consent checks pass.'
  };
}
