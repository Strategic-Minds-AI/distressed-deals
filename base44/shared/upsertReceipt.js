// Pure, fail-closed parsing of a provider's observed property upsert receipt.
// A request, HTTP success, or returned array is not proof of created/updated counts.
const count = n => Number.isSafeInteger(n) && n >= 0;
export function reconcilePropertyUpsertReceipt(receipt, expected) {
  const unknown = reason => ({verified:false,reason});
  if (!count(expected) || expected === 0) return unknown('INVALID_EXPECTED_COUNT');
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return unknown('UNSTRUCTURED_PROVIDER_RECEIPT');
  if (!count(receipt.created) || !count(receipt.updated)) return unknown('MISSING_PROVIDER_COUNTERS');
  if (receipt.deleted !== undefined && receipt.deleted !== 0) return unknown('UNEXPECTED_DELETION');
  if (receipt.created + receipt.updated !== expected) return unknown('NONRECONCILING_PROVIDER_COUNTERS');
  return {verified:true,created:receipt.created,updated:receipt.updated,deleted:0};
}
