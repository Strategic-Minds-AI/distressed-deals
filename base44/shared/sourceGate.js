// Fail-closed suitability screen for the Broward pilot Supabase source.
// Does not contact the network, infer legal source rights, mutate rows, or merge listings.
const asText = v => String(v ?? '').trim();
const validHttpsUrl = value => {
  try { const u = new URL(asText(value)); return u.protocol === 'https:' && !!u.hostname.includes('.') && !u.username && !u.password; }
  catch { return false; }
};
export function screenBrowardSourceRows(rows, {now = Date.now(), ageDays = 30} = {}) {
  if (!Array.isArray(rows)) throw new TypeError('Expected source rows array');
  if (!Number.isFinite(now) || !Number.isInteger(ageDays) || ageDays < 1 || ageDays > 90) throw new TypeError('Invalid freshness window');
  const eligible = [], counts = {total:rows.length,florida:0,browardProven:0,freshVerified:0,sourceUrlHttps:0,complete:0,eligible:0};
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const state = asText(r.state).toUpperCase();
    if (state !== 'FL') continue;
    counts.florida++;
    const county = asText(r.county || r.county_name || r.jurisdiction).toUpperCase().replace(/ COUNTY$/,'');
    if (county !== 'BROWARD') continue;
    counts.browardProven++;
    const timestamp = Date.parse(asText(r.verified_at));
    if (!Number.isFinite(timestamp) || timestamp > now || (now-timestamp) > ageDays * 86400000) continue;
    counts.freshVerified++;
    if (!validHttpsUrl(r.listing_url)) continue;
    counts.sourceUrlHttps++;
    if (!asText(r.id) || !asText(r.address) || !asText(r.city) || !asText(r.title) ||
       !Number.isFinite(Number(r.asking_price)) || Number(r.asking_price) <= 0) continue;
    counts.complete++;
    eligible.push(r);
  }
  counts.eligible = eligible.length;
  return {counts,eligible,rightsVerified:false,sourceProviderRights:'UNVERIFIED'};
}
