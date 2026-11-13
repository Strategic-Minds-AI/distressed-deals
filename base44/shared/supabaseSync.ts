/**
 * Shared Supabase → Base44 entity sync logic.
 * Used by both syncProperties (user-auth) and workerSync (secret-auth).
 */

import { secrets } from 'base44:runtime';
import { screenBrowardSourceRows } from './sourceGate.js';

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1564013799925-ab319b078b8f?w=800&q=70";

function mapRow(row: any): any {
  const title = row.title || row.property_title || row.name || [row.address, row.city].filter(Boolean).join(", ");
  const address = row.address || row.street_address || row.property_address || "";
  const city = row.city || "";
  const state = row.state || row.st || "";
  const zip = String(row.zip || row.zipcode || row.postal_code || "");
  const asking = Number(row.asking_price || row.price || row.list_price || 0);
  const arv = Number(row.arv || row.after_repair_value || 0);
  const repairs = Number(row.estimated_repair_cost || row.repair_cost || 0);
  const roi = Number(row.projected_roi || row.roi || 0);
  const sqft = Number(row.sqft || row.square_feet || 0);
  const beds = Number(row.beds || row.bedrooms || 0);
  const baths = Number(row.baths || row.bathrooms || 0);
  const yearBuilt = Number(row.year_built || row.yearbuilt || 0);
  const category = row.category || row.distress_type || "Distressed Sale";
  const conditionGrade = row.condition_grade || row.condition || "";
  const description = row.description || row.notes || "";
  const distressReason = row.distress_reason || row.reason || "";
  const repairSummary = row.repair_summary || "";
  const agentName = row.agent_name || row.agent || "";
  const agentPhone = row.agent_phone || row.agent_phone_number || "";
  const agentEmail = row.agent_email || row.agent_email_address || "";
  const lat = Number(row.lat || row.latitude || 0);
  const lng = Number(row.lng || row.longitude || 0);
  const images = Array.isArray(row.images) ? row.images : row.image_url ? [row.image_url] : [];
  const sourceId = String(row.id || row.source_id || row.external_id || "");
  const status = row.status || "Active";
  const listingUrl = row.listing_url || "";
  const auctionDate = row.auction_date || row.auction ? new Date(row.auction_date || row.auction).toISOString() : undefined;
  const listedDate = row.listed_date || row.listing_date ? new Date(row.listed_date || row.listing_date).toISOString() : undefined;
  const featured = Boolean(row.featured || false);

  return {
    title, address, city, state, zip,
    asking_price: asking, arv, estimated_repair_cost: repairs, projected_roi: roi,
    sqft, beds, baths, year_built: yearBuilt || undefined,
    category, condition_grade: conditionGrade || undefined,
    description, distress_reason: distressReason, repair_summary: repairSummary,
    agent_name: agentName, agent_phone: agentPhone, agent_email: agentEmail,
    lat: lat || undefined, lng: lng || undefined,
    images: images.length ? images : [FALLBACK_IMAGE],
    status, source: "supabase", source_id: sourceId,
    listing_url: listingUrl || undefined,
    auction_date: auctionDate,
    listed_date: listedDate,
    featured,
    last_synced: new Date().toISOString(),
  };
}

export async function syncSupabaseToEntities(base44: any): Promise<any> {
  let connection;
  try {
    connection = await base44.asServiceRole.connectors.getConnection("supabase");
  } catch {
    return { error: "Supabase connector not connected" };
  }
  const accessToken = connection.accessToken;

  // Use an explicit project. Selecting projects[0] silently reads the wrong tenant.
  const projectRef = secrets.get("PROPERTY_SUPABASE_PROJECT_REF");
  if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef)) {
    return { error: "PROPERTY_SUPABASE_PROJECT_REF must be configured securely" };
  }
  const projectsRes = await fetch("https://api.supabase.com/v1/projects", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!projectsRes.ok) return { error: "Supabase project authorization failed" };
  const projects = await projectsRes.json();
  if (!Array.isArray(projects) || !projects.some((p: any) => p.id === projectRef)) {
    return { error: "Configured property project is not authorized for this connector" };
  }

  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const keys = await keysRes.json();
  const serviceKey = keys.find((k: any) => k.name === "service_role")?.api_key;
  if (!serviceKey) return { error: "Could not retrieve service_role key" };

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
      `https://${projectRef}.supabase.co/rest/v1/${propertyTable}?select=*&order=id.asc&limit=${pageSize}&offset=${offset}`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (!res.ok) {
      const text = await res.text();
      return { error: `PostgREST ${res.status}: ${text}`, table: propertyTable };
    }
    const rows = await res.json();
    allRows = allRows.concat(rows);
    hasMore = rows.length === pageSize;
    offset += pageSize;
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
  const mapped = screening.eligible
    .map(mapRow)
    .filter((p: any) => p.title && p.address && p.asking_price > 0 && p.category);

  if (!mapped.length) {
    return { status: "no_valid_rows", message: "Rows found but none mapped to valid properties.", table: propertyTable, rawRowCount: allRows.length };
  }

  // An idempotent source key is mandatory. Never delete an existing inventory on sync.
  if (mapped.some((p: any) => !p.source_id)) {
    return { error: "Source identifier missing; inventory preserved", table: propertyTable };
  }
  const result = await base44.asServiceRole.entities.Property.upsert(mapped, { key: "source_id" });

  return {
    status: "synced",
    projectRef,
    table: propertyTable,
    freshVerifiedCount: mapped.length,
    sourceRightsConfirmed: true,
    deleted: 0,
    rawRows: allRows.length,
    mapped: mapped.length,
    created: result.created || result.length || 0,
    updated: result.updated || 0,
  };
}