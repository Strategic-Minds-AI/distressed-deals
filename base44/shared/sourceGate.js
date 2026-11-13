// Deterministic, fail-closed candidate gate. Never fetches sources, merges properties or asserts source rights.
const text = v => String(v ?? '').trim();
const norm = v => text(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
const https = value => {
  try {
    const u = new URL(text(value));
    return u.protocol === 'https:' && !u.username && !u.password &&
      !/^(localhost|.*\.localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|0\.|\[|::1$)/i.test(u.hostname) &&
      u.hostname.includes('.');
  } catch { return false; }
};
const parcel = row => norm(row.parcel_id || row.parcel_number || row.folio || row.folio_number || row.apn);
const zip5 = row => text(row.zip || row.zip_code || row.zipcode || row.postal_code);
export function screenBrowardSourceRows(rows, {now = Date.now(), ageDays = 30} = {}) {
  if (!Array.isArray(rows)) throw new TypeError('Expected source rows array');
  if (!Number.isFinite(now) || !Number.isInteger(ageDays) || ageDays < 1 || ageDays > 90)
    throw new TypeError('Invalid freshness window');
  const counts = {total:rows.length,florida:0,browardProven:0,freshVerified:0,
    sourceUrlHttps:0,complete:0,identityReady:0,duplicatesQuarantined:0,eligible:0};
  const candidates = [];
  for (const r of rows) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) continue;
    if (text(r.state).toUpperCase() !== 'FL') continue;
    counts.florida++;
    if (text(r.county || r.county_name || r.jurisdiction).toUpperCase().replace(/ COUNTY$/,'') !== 'BROWARD') continue;
    counts.browardProven++;
    const verifiedAt = Date.parse(text(r.verified_at));
    if (!Number.isFinite(verifiedAt) || verifiedAt > now || now - verifiedAt > ageDays * 86400000) continue;
    counts.freshVerified++;
    if (!https(r.listing_url)) continue;
    counts.sourceUrlHttps++;
    if (!text(r.id) || !text(r.address) || !text(r.city) || !text(r.title) ||
        !Number.isFinite(Number(r.asking_price)) || Number(r.asking_price) <= 0) continue;
    counts.complete++;
    // A ZIP code is never a property identity. Broward folio/APN plus full address is required.
    if (!parcel(r) || !/^\d{5}(?:-\d{4})?$/.test(zip5(r)) ||
        !/^\d+[A-Za-z]?\s+\S/.test(text(r.address))) continue;
    counts.identityReady++;
    candidates.push(r);
  }
  // Ambiguous duplicate source IDs or same parcel in one batch are quarantined, not silently overwritten.
  const ids = new Map(), parcels = new Map();
  for (const r of candidates) {
    const id = text(r.id), key = parcel(r);
    ids.set(id, (ids.get(id) || 0) + 1);
    parcels.set(key, (parcels.get(key) || 0) + 1);
  }
  const eligible = candidates.filter(r => ids.get(text(r.id)) === 1 && parcels.get(parcel(r)) === 1);
  counts.duplicatesQuarantined = candidates.length - eligible.length;
  counts.eligible = eligible.length;
  return {counts, eligible, rightsVerified:false, sourceProviderRights:'UNVERIFIED', autoMerged:0, autoDeleted:0};
}
