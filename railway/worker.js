import cron from 'node-cron';
import dotenv from 'dotenv';
import {assessSyncResponse} from './syncAssessment.mjs';

dotenv.config();

const APP_URL = process.env.APP_URL || 'https://distressed-deals.base44.app';
const WORKER_SECRET = process.env.WORKER_SECRET;
const raw = new URL(APP_URL);
if (raw.protocol !== 'https:' || raw.username || raw.password ||
  raw.pathname !== '/' || !raw.hostname.endsWith('.base44.app')) {
  console.error('PROPERTY_SYNC_ALERT INVALID_APP_ORIGIN; refusing to send credentials');
  process.exit(1);
}
if (!WORKER_SECRET) {
  console.error('PROPERTY_SYNC_ALERT MISSING_WORKER_SECRET; source not called');
  process.exit(1);
}

const endpoint = new URL('/functions/workerSync', APP_URL);
let inFlight = false;
let consecutiveNonproductive = 0;

async function runSync() {
  if (inFlight) {
    console.error('PROPERTY_SYNC_ALERT OVERLAPPING_RUN_SKIPPED');
    return;
  }
  inFlight = true;
  const timestamp = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method:'POST',
      headers:{Authorization:'Bearer ' + WORKER_SECRET,'Content-Type':'application/json'},
      body:'{}', signal:controller.signal
    });
    let data;
    try { data = await response.json(); } catch { data = null; }
    const verdict = assessSyncResponse(response.status,data);
    if (verdict.healthy) {
      consecutiveNonproductive = 0;
      console.log('PROPERTY_SYNC_OK',JSON.stringify({timestamp,code:verdict.code,mapped:verdict.mapped,freshVerifiedCount:verdict.freshVerifiedCount}));
    } else {
      consecutiveNonproductive += 1;
      console.error('PROPERTY_SYNC_ALERT',JSON.stringify({timestamp,code:verdict.code,consecutiveNonproductive}));
    }
  } catch (error) {
    consecutiveNonproductive += 1;
    console.error('PROPERTY_SYNC_ALERT',JSON.stringify({timestamp,code:error?.name === 'AbortError' ? 'SOURCE_TIMEOUT' : 'SOURCE_REQUEST_FAILED',consecutiveNonproductive}));
  } finally {
    clearTimeout(timer);
    inFlight = false;
  }
}
runSync();
cron.schedule('0 */2 * * *',runSync);
console.log('PROPERTY_SYNC_SCHEDULER_STARTED',JSON.stringify({interval:'2h',expectedSource:'pinned',health:'UNKNOWN_UNTIL_PRODUCTIVE_RUN'}));
