/**
 * Offline staging audit for existing property source metadata only.
 * No ownership/contact ingestion, no new scraping, no source-use authorization.
 */
import { createHash } from 'node:crypto';
import { executeLocal } from './handlers.mjs';
import { runOne } from './runner.mjs';
const ALLOWED=new Set(['propertyId','verifiedAt','sourceUrlPresent']);
const ID=/^[a-zA-Z0-9:._-]{3,140}$/;
export function auditSourceSnapshot(ledger,{tenantId,missionId,snapshotId,asOf,rows}={}){
  if(!Array.isArray(rows)||rows.length>200||!ID.test(snapshotId||'')||!Number.isFinite(Date.parse(asOf||'')))
    throw Error('INVALID_SOURCE_AUDIT_INPUT');
  if(rows.some(row=>!row||typeof row!=='object'||Object.keys(row).some(k=>!ALLOWED.has(k))||!ID.test(row.propertyId||'')))
    throw Error('SOURCE_SNAPSHOT_UNEXPECTED_FIELD_OR_ID');
  let recent=0,stale=0,missing=0,queued=0,reused=0,completed=0;
  const digest=createHash('sha256').update(JSON.stringify({snapshotId,asOf,rows})).digest('hex');
  for(const row of rows){
    const result=executeLocal('data.data-freshness-monitor@broward',{verifiedAt:row.verifiedAt||'',asOf});
    if(result.verified)recent++;
    else if(result.reason==='MISSING_SOURCE_TIMESTAMP')missing++;
    else stale++;
    const receipt=ledger.enqueue({tenantId,missionId,profileId:'data.data-freshness-monitor@broward',
      idempotencyKey:'snapshot:'+snapshotId+':'+row.propertyId,
      payload:{propertyId:row.propertyId,verifiedAt:row.verifiedAt||'',asOf}});
    if(receipt.idempotentReuse)reused++;else queued++;
  }
  for(let i=0;i<rows.length;i++){
    const result=runOne(ledger,{tenantId,missionId,workerId:'source-audit-local'});
    if(result.state==='COMPLETED')completed++;
    else if(result.state==='IDLE'||result.state==='WAITING_PROVIDER')break;
  }
  const details={candidateCount:rows.length,freshTimestampCount:recent,staleTimestampCount:stale,
    missingTimestampCount:missing,sourceRights:'UNVERIFIED',sellerConsent:'UNVERIFIED',
    titleClearance:'UNVERIFIED',noExternalActions:true,needsHumanSourceReview:true};
  ledger.checkpoint({tenantId,missionId,phase:'source_freshness_audit',state:'BLOCKED',refSha:digest,details});
  return {snapshotId,sourceDigest:digest,queued,reused,completed,details,
    status:'SOURCE_QUALITY_REVIEW_REQUIRED',note:'Timestamp audit only. Source rights, ownership, availability and contact consent not verified.'};
}
