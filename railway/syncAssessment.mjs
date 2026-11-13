// Deterministic, side-effect-free Railway sync result gate.
// A running scheduler is NOT evidence of newly verified, lawfully sourced leads.
export const PROPERTY_PROJECT_REF = 'fwtchbsebygwifmmqhur';
export const PROPERTY_TABLE = 'distressed_properties';
const validCount = n => Number.isSafeInteger(n) && n >= 0;
export function assessSyncResponse(httpStatus, payload, options = {}) {
  const projectRef = options.projectRef || PROPERTY_PROJECT_REF;
  const table = options.table || PROPERTY_TABLE;
  const blocked = (code, detail) => ({ healthy:false, code, detail });
  if (!Number.isInteger(httpStatus) || httpStatus < 200 || httpStatus >= 300) {
    return blocked('HTTP_ERROR', 'source application request failed');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return blocked('INVALID_RESPONSE', 'expected structured JSON response');
  }
  if (payload.status !== 'synced') {
    const codes = {
      no_source_table:'SOURCE_NOT_FOUND',
      source_read_denied:'SOURCE_READER_DENIED',
      source_read_error:'SOURCE_READER_ERROR',
      source_schema_incomplete:'SOURCE_SCHEMA_INCOMPLETE',
      source_page_limit_exceeded:'SOURCE_PAGE_LIMIT_EXCEEDED',
      upsert_receipt_unverified:'UPSERT_RECEIPT_UNVERIFIED',
      no_valid_rows:'NO_VALID_ROWS',
      preview_only:'PREVIEW_ONLY',
      source_rights_unverified:'SOURCE_RIGHTS_UNVERIFIED',
      no_fresh_verified_rows:'NO_FRESH_VERIFIED_ROWS'
    };
    return blocked(codes[payload.status] || 'SYNC_NOT_CONFIRMED','source run did not confirm productive sync');
  }
  if (payload.projectRef !== projectRef || payload.table !== table) {
    return blocked('WRONG_SOURCE_IDENTITY','project/table mismatch or missing source identity receipt');
  }
  if (!validCount(payload.mapped) || !validCount(payload.rawRows) || payload.rawRows < payload.mapped ||
      !validCount(payload.created) || !validCount(payload.updated) ||
      payload.created + payload.updated !== payload.mapped) {
    return blocked('UNTRUSTWORTHY_COUNTS','source counts do not reconcile');
  }
  if (payload.deleted !== undefined && payload.deleted !== 0) {
    return blocked('DESTRUCTIVE_SYNC','unexpected deletion reported');
  }
  if (payload.mapped === 0) return blocked('ZERO_PRODUCTIVE_ROWS','no records mapped');
  if (!validCount(payload.freshVerifiedCount) || payload.freshVerifiedCount < 1) {
    return blocked('FRESHNESS_UNVERIFIED','no evidence-backed recent verified properties');
  }
  if (payload.sourceRightsConfirmed !== true) {
    return blocked('SOURCE_RIGHTS_UNVERIFIED','permission to use source data was not confirmed');
  }
  return { healthy:true, code:'PRODUCTIVE_SYNC_CONFIRMED', mapped:payload.mapped, freshVerifiedCount:payload.freshVerifiedCount };
}
