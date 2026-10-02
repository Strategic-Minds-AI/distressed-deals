import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1564013799925-ab319b078b8f?w=800&q=70";

// Maps a Supabase row to the Property entity schema.
// Adjust field mappings once the Supabase table structure is known.
function mapRow(row) {
  // Try common field name variations
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

  return {
    title,
    address,
    city,
    state,
    zip,
    asking_price: asking,
    arv,
    estimated_repair_cost: repairs,
    projected_roi: roi,
    sqft,
    beds,
    baths,
    year_built: yearBuilt || undefined,
    category,
    condition_grade: conditionGrade || undefined,
    description,
    distress_reason: distressReason,
    repair_summary: repairSummary,
    agent_name: agentName,
    agent_phone: agentPhone,
    agent_email: agentEmail,
    lat: lat || undefined,
    lng: lng || undefined,
    images: images.length ? images : [FALLBACK_IMAGE],
    status,
    source: "supabase",
    source_id: sourceId,
    last_synced: new Date().toISOString(),
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    // Get Supabase connection
    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection("supabase");
    } catch {
      return Response.json({ error: "Supabase connector not connected" }, { status: 500 });
    }
    const accessToken = connection.accessToken;

    // 1. Get project ref
    const projectsRes = await fetch("https://api.supabase.com/v1/projects", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const projects = await projectsRes.json();
    if (!projects.length) return Response.json({ error: "No Supabase projects found" }, { status: 500 });
    const projectRef = projects[0].id;

    // 2. Get service_role key for PostgREST
    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const keys = await keysRes.json();
    const serviceKey = keys.find((k) => k.name === "service_role")?.api_key;
    if (!serviceKey) return Response.json({ error: "Could not retrieve service_role key" }, { status: 500 });

    // 3. Discover tables in public schema
    const tablesRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query/read-only`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
        }),
      }
    );
    const tablesData = await tablesRes.json();
    const tableNames = (tablesData.rows || []).map((r) => r.table_name);

    // Find a property-like table
    const propertyTable =
      tableNames.find((t) => /propert|lead|listing|deal|distress|foreclosure/i.test(t)) || tableNames[0];

    if (!propertyTable) {
      return Response.json({
        status: "no_source_table",
        message: "No tables found in Supabase public schema. Populate Supabase with property data to enable sync.",
        projectRef,
        tables: [],
      });
    }

    // 4. Read rows from the property table (paginated)
    let allRows = [];
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
        return Response.json({ error: `PostgREST ${res.status}: ${text}`, table: propertyTable }, { status: 502 });
      }
      const rows = await res.json();
      allRows = allRows.concat(rows);
      hasMore = rows.length === pageSize;
      offset += pageSize;
    }

    // 5. Map and upsert
    const mapped = allRows
      .map(mapRow)
      .filter((p) => p.title && p.address && p.asking_price != null && p.category);

    if (!mapped.length) {
      return Response.json({
        status: "no_valid_rows",
        message: "Rows found but none mapped to valid properties (need title, address, asking_price, category).",
        table: propertyTable,
        rawRowCount: allRows.length,
      });
    }

    // Upsert by source_id if available, otherwise by normalized address
    const upsertKey = mapped[0]?.source_id ? "source_id" : null;
    let result;
    if (upsertKey) {
      result = await base44.asServiceRole.entities.Property.upsert(mapped, { key: upsertKey });
    } else {
      // No source_id — delete old supabase-sourced records and recreate
      await base44.asServiceRole.entities.Property.deleteMany({ source: "supabase" });
      result = await base44.asServiceRole.entities.Property.bulkCreate(mapped);
    }

    return Response.json({
      status: "synced",
      table: propertyTable,
      rawRows: allRows.length,
      mapped: mapped.length,
      created: result.created || result.length || 0,
      updated: result.updated || 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}