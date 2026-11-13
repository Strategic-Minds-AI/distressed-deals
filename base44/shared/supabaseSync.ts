/**
 * Shared Supabase → Base44 entity sync logic.
 * Used by both syncProperties (user-auth) and workerSync (secret-auth).
 */

import { secrets } from 'base44:runtime';
import { screenBrowardSourceRows } from './sourceGate.js';
import { mapScreenedSourceRow } from './propertySourceMap.js';
import { reconcilePropertyUpsertReceipt } from './upsertReceipt.js';
import { buildScopedSourceRead, classifySourceReadFailure } from './scopedSourceRead.js';

export async function syncSupabaseToEntities(base44: any): Promise<any> {
  // No management API token or project-wide service_role key. Both credentials
  // are owner-configured secrets. The bearer must be authenticated, unexpired,
  // project-issued and constrained by Supabase RLS for this approved source.
  const projectRef = secrets.get('PROPERTY_SUPABASE_PROJECT_REF');
  const propertyTable = secrets.get('PROPERTY_SOURCE_TABLE') || 'distressed_properties';
  let read;
  try {
    read = buildScopedSourceRead({
      projectRef,
      table: propertyTable,
      apiKey: secrets.get('PROPERTY_SUPABASE_READ_ONLY_API_KEY'),
      accessToken: secrets.get('PROPERTY_SUPABASE_READ_ONLY_BEARER')
    });
  } catch (err) {
    return {
      status: 'source_read_denied', reason: err?.code || 'READ_POLICY_UNKNOWN',
      projectRef: 'REDACTED_UNTIL_PINNED', table: propertyTable,
      created: 0, updated: 0, deleted: 0, no_records_changed: true
    };
  }
  const probeRes = await fetch(`${read.endpoint}?select=id&limit=1`, { headers: read.headers });
  if (!probeRes.ok) {
    return {
      status: classifySourceReadFailure(probeRes.status),
      reason: 'pinned_source_probe_failed', projectRef: read.projectRef, table: read.table,
      created: 0, updated: 0, deleted: 0, no_records_changed: true
    };
  }

  // Fail closed on unexpected tables; never scan unrelated CRM or tenant tables.
  const propertyTable = secrets.get("PROPERTY_SOURCE_TABLE") || "distressed_properties";
  if (propertyTable !== "distressed_properties") {
    return { error: "Only the reviewed distressed_properties source is permitted" };
  }
  const probeRes = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/${propertyTable}?select=id&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  if (!probeRes.ok) {
    return { status: "no_source_table", message: "Configured source table unavailable; existing inventory preserved", projectRef, table: propertyTable };
  }

  let allRows: any[] = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const res = await fetch(
      `${read.endpoint}?select=*&order=id.asc&limit=${pageSize}&offset=${offset}`,
      { headers: read.headers }
    );
    if (!res.ok) {
      return { status: classifySourceReadFailure(res.status),
        reason: 'pinned_source_page_failed', projectRef: read.projectRef, table: propertyTable,
        created: 0, updated: 0, deleted: 0, no_records_changed: true };
    }
    const rows = await res.json();
    allRows = allRows.concat(rows);
    hasMore = rows.length === pageSize;
    offset += pageSize;
  }

  // Detect incompatible source schema early. The pinned project may exist yet be
  // structurally incapable of proving county or parcel identity. No data mutations.
  if (allRows.length) {
    const columns = new Set(Object.keys(allRows[0]));
    const missingColumns = [
      [['county','county_name','jurisdiction'],'county'],
      [['parcel_id','parcel_number','folio','folio_number','apn'],'parcel_id'],
      [['verified_at'],'verified_at'],
      [['listing_url'],'listing_url'],
      [['zip','zip_code','zipcode','postal_code'],'zip']
    ].filter(([alternates]) => !alternates.some(name => columns.has(name)))
     .map(([,label]) => label);
    if (missingColumns.length) {
      return { status: 'source_schema_incomplete', projectRef, table: propertyTable,
        missingColumns, rawRows: allRows.length, created: 0, updated: 0,
        deleted: 0, no_records_changed: true };
    }
  }

  // The source table exists but may contain other counties, old listings or records
  // with no verified right to use. Do not materialize them into live inventory.
  const screening = screenBrowardSourceRows(allRows);
  const freshVerifiedCount = screening.counts.eligible;
  if (freshVerifiedCount === 0) {
    return { status: 'no_fresh_verified_rows', projectRef, table: propertyTable,
      rawRows: allRows.length, counts: screening.counts, created: 0, updated: 0, deleted: 0,
      no_records_changed: true };
  }
  const rightsRef = secrets.get('PROPERTY_SOURCE_RIGHTS_EVIDENCE_REF');
  if (secrets.get('PROPERTY_SOURCE_RIGHTS_ATTESTED') !== 'true' ||
      !rightsRef || !/^[A-Za-z0-9._:/-]{12,300}$/.test(rightsRef)) {
    return { status: 'source_rights_unverified', projectRef, table: propertyTable,
      rawRows: allRows.length, counts: screening.counts, created: 0, updated: 0, deleted: 0,
      no_records_changed: true };
  }
  if (secrets.get('PROPERTY_SYNC_WRITE_MODE') !== 'staging_approved') {
    return { status: 'preview_only', projectRef, table: propertyTable,
      rawRows: allRows.length, counts: screening.counts, created: 0, updated: 0, deleted: 0,
      no_records_changed: true };
  }
  // No batch writes unless every proposed row passes parcel, provenance, identity and enum checks.
  // Invalid/ambiguous rows are held, never partially merged or silently defaulted to Active.
  let mapped: any[];
  try {
    mapped = screening.eligible.map((row: any) => mapScreenedSourceRow(row, { projectRef, table: propertyTable }));
  } catch {
    return { status: 'no_valid_rows', message: 'Strict property mapping failed; existing inventory preserved',
      projectRef, table: propertyTable, rawRows: allRows.length, counts: screening.counts,
      created: 0, updated: 0, deleted: 0, no_records_changed: true };
  }

  if (!mapped.length) {
    return { status: "no_valid_rows", message: "Rows found but none mapped to valid properties.", table: propertyTable, rawRowCount: allRows.length };
  }

  // An idempotent source key is mandatory. Never delete an existing inventory on sync.
  if (mapped.some((p: any) => !p.source_id)) {
    return { error: "Source identifier missing; inventory preserved", table: propertyTable };
  }
  const result = await base44.asServiceRole.entities.Property.upsert(mapped, { key: "source_id" });
  const receipt = reconcilePropertyUpsertReceipt(result, mapped.length);
  if (!receipt.verified) {
    // Upsert may have run, but its outcome is not confirmed. Never claim success or
    // silently create/remove source rows; operator must reconcile before release.
    return { status: 'upsert_receipt_unverified', projectRef, table: propertyTable,
      reason: receipt.reason, rawRows: allRows.length, mapped: mapped.length,
      freshVerifiedCount: mapped.length, sourceRightsConfirmed: true,
      writeOutcome: 'UNKNOWN', deletionReported: 'UNKNOWN' };
  }

  return {
    status: "synced",
    projectRef,
    table: propertyTable,
    freshVerifiedCount: mapped.length,
    sourceRightsConfirmed: true,
    deleted: 0,
    rawRows: allRows.length,
    mapped: mapped.length,
    created: receipt.created,
    updated: receipt.updated,
  };
}