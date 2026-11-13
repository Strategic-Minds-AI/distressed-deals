// Side-effect-free property identity screening. It NEVER merges, deletes, or withdraws.
const norm = (v) => String(v ?? '').trim().toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const pick = (record, ...names) => names.map(k => record?.[k]).find(v => String(v ?? '').trim()) ?? '';
const unitMatch = (address) => norm(address).match(/(?:^| )(?:APT|APARTMENT|UNIT|STE|SUITE|#) ([A-Z0-9-]+)(?: |$)/);
export function propertyIdentity(record = {}) {
  const raw = pick(record,'address','street_address','property_address');
  const unit = norm(pick(record,'unit','unit_number','apartment','suite') || unitMatch(raw)?.[1]);
  const street = norm(raw).replace(/(?:^| )(?:APT|APARTMENT|UNIT|STE|SUITE) [A-Z0-9-]+(?: |$)/g,' ').trim()
    .replace(/\bSTREET\b/g,'ST').replace(/\bAVENUE\b/g,'AVE').replace(/\bBOULEVARD\b/g,'BLVD')
    .replace(/\bROAD\b/g,'RD').replace(/\bDRIVE\b/g,'DR').replace(/\bLANE\b/g,'LN');
  const city = norm(record.city), state = norm(record.state || record.st);
  const zip = String(pick(record,'zip','zip_code','zipcode','postal_code')).match(/^\d{5}/)?.[0] || '';
  const county = norm(pick(record,'county','county_name','jurisdiction'));
  const tenant = norm(pick(record,'tenant_id','tenantId','organization_id'));
  const parcel = norm(pick(record,'parcel_id','parcel_number','folio','folio_number','apn'));
  const addressReady = /^\d+ [A-Z]/.test(street) && !!city && !!state && !!zip;
  return {tenant,county,state,parcel,street,unit,city,zip,addressReady};
}
export function classifyPropertyPair(left, right) {
  const a = propertyIdentity(left), b = propertyIdentity(right);
  if (a.tenant && b.tenant && a.tenant !== b.tenant) return 'DIFFERENT_TENANT';
  if (a.parcel && b.parcel && a.county && b.county && a.state && b.state) {
    if (a.parcel === b.parcel && a.county === b.county && a.state === b.state) return 'REVIEW_SAME_PARCEL';
  }
  if (!a.addressReady || !b.addressReady) return 'INSUFFICIENT_IDENTITY';
  if (a.street !== b.street || a.city !== b.city || a.state !== b.state || a.zip !== b.zip) return 'DIFFERENT_ADDRESS';
  if (a.unit && b.unit && a.unit !== b.unit) return 'DIFFERENT_UNIT';
  if (a.parcel && b.parcel && a.parcel !== b.parcel) return 'PARCEL_CONFLICT';
  if (!a.unit || !b.unit) return 'AMBIGUOUS_UNIT';
  return 'REVIEW_ADDRESS_AND_UNIT';
}
export function auditPropertyCandidates(records = [], maxPairs = 50) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const byAddress = new Map(), byParcel = new Map(), reviewed = new Set(), pairs = [];
  let totalCandidates = 0, ambiguousCandidates = 0;
  for (let i = 0; i < records.length; i++) {
    const a = propertyIdentity(records[i]);
    const keys = [];
    if (a.parcel && a.county && a.state) keys.push(['parcel', [a.tenant,a.state,a.county,a.parcel].join('|')]);
    if (a.addressReady) keys.push(['address', [a.tenant,a.street,a.city,a.state,a.zip].join('|')]);
    for (const [kind,key] of keys) {
      const index = kind === 'parcel' ? byParcel : byAddress;
      for (const j of index.get(key) ?? []) {
        const pairId = j + ':' + i;
        if (reviewed.has(pairId)) continue;
        reviewed.add(pairId);
        const verdict = classifyPropertyPair(records[j],records[i]);
        if (verdict === 'DIFFERENT_TENANT' || verdict === 'DIFFERENT_UNIT' || verdict === 'DIFFERENT_ADDRESS' || verdict === 'INSUFFICIENT_IDENTITY') continue;
        totalCandidates++;
        if (verdict === 'AMBIGUOUS_UNIT' || verdict === 'PARCEL_CONFLICT') ambiguousCandidates++;
        if (pairs.length < maxPairs) pairs.push({leftId:String(records[j]?.id ?? j),rightId:String(records[i]?.id ?? i),verdict});
      }
      index.set(key,[...(index.get(key)??[]),i]);
    }
  }
  return {totalCandidates,ambiguousCandidates,pairs,truncated:totalCandidates > pairs.length,autoMerged:0,autoWithdrawn:0};
}
