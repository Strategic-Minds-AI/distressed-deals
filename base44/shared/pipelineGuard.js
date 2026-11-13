// Pure, fail-closed pipeline continuation policy. A successful HTTP response alone
// does not prove an authorized, fresh and reconciled property inventory sync.
export function assessPipelineSync(sync) {
  const blocked = (reason) => ({ canContinue: false, reason });
  if (!sync || typeof sync !== 'object' || Array.isArray(sync)) return blocked('MISSING_SYNC_RECEIPT');
  if (sync.status !== 'synced') return blocked('SYNC_NOT_VERIFIED');
  if (sync.sourceRightsConfirmed !== true) return blocked('SOURCE_RIGHTS_UNVERIFIED');
  if (sync.projectRef !== 'fwtchbsebygwifmmqhur' || sync.table !== 'distressed_properties') return blocked('SOURCE_IDENTITY_MISMATCH');
  const count = n => Number.isSafeInteger(n) && n >= 0;
  if (!count(sync.mapped) || !count(sync.freshVerifiedCount) || sync.mapped < 1 || sync.freshVerifiedCount < 1)
    return blocked('ZERO_VERIFIED_RECORDS');
  if (!count(sync.created) || !count(sync.updated) || sync.created + sync.updated !== sync.mapped)
    return blocked('UNRECONCILED_WRITES');
  if (sync.deleted !== 0) return blocked('DESTRUCTIVE_OR_UNKNOWN_DELETION');
  if (sync.writeOutcome === 'UNKNOWN') return blocked('UNCERTAIN_PROVIDER_WRITE');
  return { canContinue: true, reason: 'VERIFIED_SYNC_RECEIPT' };
}
