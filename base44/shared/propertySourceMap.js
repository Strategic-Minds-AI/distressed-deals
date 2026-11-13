import {screenBrowardSourceRows} from './sourceGate.js';
// Pure row mapping, never performs writes, fetches, source authorization or record merges.
// The sync caller must separately prove source usage rights and staging write approval.
export const PROJECT_REF = 'fwtchbsebygwifmmqhur';
export const SOURCE_TABLE = 'distressed_properties';
const CATEGORIES = new Set(['Pre-Foreclosure','Foreclosure','Short Sale','Bank-Owned (REO)','Auction','Tax Lien','Probate','Distressed Sale']);
const STATUSES = new Set(['Active','Under Contract','Pending','Sold','Withdrawn']);
const asText = value => String(value ?? '').trim();
const nonnegative = value => {
  if(value === null || value === undefined || value === '') return undefined;
  const n=Number(value); return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const signed = value => {
  if(value === null || value === undefined || value === '') return undefined;
  const n = Number(value); return Number.isFinite(n) ? n : undefined;
};
const coordinate = (value, limit) => { const n = signed(value); return n !== undefined && n >= -limit && n <= limit ? n : undefined; };
const instant = value => {
  if(!value) return undefined;
  const time=Date.parse(asText(value));
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
};
export function mapScreenedSourceRow(row,{projectRef,table,now=Date.now()}={}) {
  if(projectRef !== PROJECT_REF || table !== SOURCE_TABLE) throw new Error('SOURCE_IDENTITY_MISMATCH');
  if(!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('INVALID_SOURCE_ROW');
  if(screenBrowardSourceRows([row],{now}).counts.eligible !== 1) throw new Error('SOURCE_ROW_NOT_ELIGIBLE');
  if(!CATEGORIES.has(asText(row.category)) || !STATUSES.has(asText(row.status))) throw new Error('UNVERIFIED_CATEGORY_OR_STATUS');
  const id=asText(row.id),price=nonnegative(row.asking_price);
  if(!id || !price || price<=0) throw new Error('MISSING_SOURCE_ID_OR_PRICE');
  const parcel=asText(row.parcel_id || row.parcel_number || row.folio || row.folio_number || row.apn);
  const images=(row.image_use_authorized === true && Array.isArray(row.images))
    ? row.images.filter(url => typeof url === 'string' && /^https:\/\//i.test(url)).slice(0,12) : [];
  return {
    title:asText(row.title),address:asText(row.address),city:asText(row.city),state:'FL',zip:asText(row.zip || row.zip_code || row.zipcode || row.postal_code),
    county:'Broward',parcel_id:parcel,asking_price:price,
    arv:nonnegative(row.arv),estimated_repair_cost:nonnegative(row.estimated_repair_cost),
    projected_roi:signed(row.projected_roi),sqft:nonnegative(row.sqft),
    beds:nonnegative(row.beds),baths:nonnegative(row.baths),year_built:nonnegative(row.year_built),
    category:asText(row.category),status:asText(row.status),
    condition_grade:asText(row.condition_grade)||undefined,
    description:asText(row.description),distress_reason:asText(row.distress_reason),
    repair_summary:asText(row.repair_summary),
    lat:coordinate(row.lat,90),lng:coordinate(row.lng,180),
    images,source:'supabase',source_project_ref:projectRef,source_table:table,
    source_id:`${projectRef}:${table}:${id}`,listing_url:asText(row.listing_url),
    verified_at:instant(row.verified_at),listed_date:instant(row.listed_date),
    auction_date:instant(row.auction_date),last_synced:new Date(now).toISOString()
  };
}
