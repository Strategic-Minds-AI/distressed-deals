import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const APP_URL = process.env.APP_URL || "https://distressed-deals.base44.app";
const WORKER_SECRET = process.env.WORKER_SECRET;

if (!WORKER_SECRET) {
  console.error("❌ WORKER_SECRET is required. Set it in Railway environment variables.");
  process.exit(1);
}

async function runSync() {
  const ts = new Date().toISOString();
  console.log(`[${ts}] 🔄 Starting property sync from Supabase...`);
  try {
    const res = await fetch(`${APP_URL}/functions/workerSync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    if (data.status === "synced") {
      console.log(`[${ts}] ✅ Synced ${data.mapped} properties from "${data.table}" (${data.created} created, ${data.updated} updated)`);
    } else if (data.status === "no_source_table") {
      console.log(`[${ts}] ⏳ No Supabase tables found yet. Populate Supabase to enable sync.`);
    } else if (data.status === "no_valid_rows") {
      console.log(`[${ts}] ⚠️ ${data.rawRowCount} rows found but none mapped to valid properties.`);
    } else if (data.error) {
      console.error(`[${ts}] ❌ Sync error: ${data.error}`);
    } else {
      console.log(`[${ts}] ℹ️ Result:`, data);
    }
  } catch (error) {
    console.error(`[${ts}] ❌ Sync failed:`, error.message);
  }
}

// Run immediately on startup
runSync();

// Then every 2 hours
cron.schedule("0 */2 * * *", runSync);

console.log("🚂 DistressDeals Railway worker started — syncing every 2 hours.");