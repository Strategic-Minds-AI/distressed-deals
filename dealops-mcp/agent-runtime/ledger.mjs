/**
 * Property Deal OS local continuity mirror. No new daemon/scheduler or external dispatch.
 * Node v24 node:sqlite local SQLite WAL, X1/Supabase remain authoritative.
 * Only non-PII internal metadata is allowed.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { getProfile } from './catalog.mjs';

const FORBIDDEN = /(authorization|api[_-]?key|secret|password|token|owner[_-]?name|owner[_-]?email|owner[_-]?phone|contact[_-]?email|contact[_-]?phone|ssn|socialsecurity|routingnumber|bankaccount)/i;
const validKey = x => typeof x === 'string' && /^[a-zA-Z0-9:._@/-]{2,160}$/.test(x);
const dump = x => JSON.stringify(x ?? {});
const digest = s => createHash('sha256').update(s).digest('hex');
function scrub(o) {
  if (o === null || o === undefined) return;
  if (Array.isArray(o)) {
    if (o.length > 500) throw Error('PAYLOAD_TOO_LARGE');
    for (const item of o) scrub(item);
  } else if (typeof o === 'object') {
    for (const [k,v] of Object.entries(o)) {
      if (FORBIDDEN.test(k)) throw Error('LOCAL_PII_OR_SECRET_FIELD_FORBIDDEN');
      scrub(v);
    }
  } else if (typeof o === 'string' && o.length > 6000) throw Error('PAYLOAD_TOO_LARGE');
}
function cleanRow(r) {
  if (!r) return null;
  const {payload_json,result_json,...metadata}=r;
  return {...metadata,payload:JSON.parse(payload_json),result:result_json?JSON.parse(result_json):null};
}
export function openLedger(dbPath=process.env.DEALOPS_STATE_DB||join(homedir(),'.strategic-minds-ai','property-deal-os','state.sqlite')) {
  mkdirSync(dirname(dbPath),{recursive:true,mode:0o700});
  const db=new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3500;');
  db.exec([
    'CREATE TABLE IF NOT EXISTS checkpoints (tenant_id TEXT NOT NULL, mission_id TEXT NOT NULL, phase TEXT NOT NULL, state TEXT NOT NULL, ref_sha TEXT NOT NULL DEFAULT "", details_json TEXT NOT NULL DEFAULT "{}", revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, PRIMARY KEY(tenant_id,mission_id));',
    'CREATE TABLE IF NOT EXISTS work_items (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, mission_id TEXT NOT NULL, profile_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, payload_json TEXT NOT NULL, result_json TEXT, state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 3, lease_owner TEXT, lease_expires_ms INTEGER NOT NULL DEFAULT 0, last_error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(tenant_id,mission_id,idempotency_key));',
    'CREATE INDEX IF NOT EXISTS idx_work_state ON work_items(tenant_id,mission_id,state,created_at);',
    'CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, mission_id TEXT NOT NULL, work_id TEXT, result_hash TEXT NOT NULL, outcome TEXT NOT NULL, facts_json TEXT NOT NULL, created_at TEXT NOT NULL);',
    'CREATE INDEX IF NOT EXISTS idx_receipt_scope ON receipts(tenant_id,mission_id,created_at);'
  ].join('\n'));
  try { chmodSync(dbPath,0o600); } catch { /* owner ACL inherited on Windows */ }
  const now=()=>new Date().toISOString();
  const check=(tenantId,missionId)=>{
    if(!validKey(tenantId)||!validKey(missionId)) throw Error('INVALID_TENANT_OR_MISSION');
  };
  function checkpoint({tenantId,missionId,phase,state,refSha='',details={}}){
    check(tenantId,missionId);
    if(!validKey(phase)||!['NOT_STARTED','IN_PROGRESS','BLOCKED','TESTED','VERIFIED','COMPLETE'].includes(state)) throw Error('INVALID_CHECKPOINT');
    scrub(details);
    const old=db.prepare('SELECT revision FROM checkpoints WHERE tenant_id=? AND mission_id=?').get(tenantId,missionId);
    db.prepare('INSERT INTO checkpoints (tenant_id,mission_id,phase,state,ref_sha,details_json,revision,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,mission_id) DO UPDATE SET phase=excluded.phase,state=excluded.state,ref_sha=excluded.ref_sha,details_json=excluded.details_json,revision=excluded.revision,updated_at=excluded.updated_at')
      .run(tenantId,missionId,phase,state,refSha,dump(details),(old?.revision||0)+1,now());
    return getCheckpoint(tenantId,missionId);
  }
  function getCheckpoint(tenantId,missionId){
    check(tenantId,missionId);
    const v=db.prepare('SELECT * FROM checkpoints WHERE tenant_id=? AND mission_id=?').get(tenantId,missionId);
    return v?{tenantId:v.tenant_id,missionId:v.mission_id,phase:v.phase,state:v.state,refSha:v.ref_sha,revision:v.revision,details:JSON.parse(v.details_json),updatedAt:v.updated_at}:null;
  }
  function enqueue({tenantId,missionId,profileId,idempotencyKey,payload={},maxAttempts=3}){
    check(tenantId,missionId);
    if(!getProfile(profileId))throw Error('UNKNOWN_AGENT_PROFILE');
    if(!validKey(idempotencyKey)||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>3)throw Error('INVALID_JOB_POLICY');
    scrub(payload);
    const id=randomUUID(), t=now(), encoded=dump(payload);
    db.prepare("INSERT OR IGNORE INTO work_items(id,tenant_id,mission_id,profile_id,idempotency_key,payload_json,state,max_attempts,created_at,updated_at) VALUES (?,?,?,?,?,?,'PENDING',?,?,?)")
      .run(id,tenantId,missionId,profileId,idempotencyKey,encoded,maxAttempts,t,t);
    const r=db.prepare('SELECT * FROM work_items WHERE tenant_id=? AND mission_id=? AND idempotency_key=?')
      .get(tenantId,missionId,idempotencyKey);
    if(r.profile_id!==profileId||r.payload_json!==encoded)throw Error('IDEMPOTENCY_CONFLICT');
    return {id:r.id,state:r.state,attempts:r.attempts,idempotentReuse:r.id!==id};
  }
  function claim(tenantId,missionId,workerId,leaseMs=30000){
    check(tenantId,missionId);
    if(!validKey(workerId)||!Number.isInteger(leaseMs)||leaseMs<1000||leaseMs>300000)throw Error('INVALID_LEASE');
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare("UPDATE work_items SET state='PENDING',lease_owner=NULL,lease_expires_ms=0,last_error='LOCAL_LEASE_EXPIRED' WHERE tenant_id=? AND mission_id=? AND state='LEASED' AND lease_expires_ms<?").run(tenantId,missionId,Date.now());
      const row=db.prepare("SELECT * FROM work_items WHERE tenant_id=? AND mission_id=? AND state='PENDING' ORDER BY created_at,id LIMIT 1").get(tenantId,missionId);
      if(!row){db.exec('COMMIT');return null;}
      const profile=getProfile(row.profile_id);
      const state=profile?.executor==='DETERMINISTIC_LOCAL'?'LEASED':'WAITING_PROVIDER';
      db.prepare('UPDATE work_items SET state=?,attempts=attempts+1,lease_owner=?,lease_expires_ms=?,updated_at=? WHERE id=?')
        .run(state,state==='LEASED'?workerId:null,state==='LEASED'?Date.now()+leaseMs:0,now(),row.id);
      db.exec('COMMIT');
      return {...cleanRow(row),state,leaseOwner:state==='LEASED'?workerId:null};
    } catch(e){db.exec('ROLLBACK');throw e;}
  }
  function complete(tenantId,missionId,id,workerId,result){
    check(tenantId,missionId);scrub(result);
    const old=db.prepare('SELECT * FROM work_items WHERE id=? AND tenant_id=? AND mission_id=?').get(id,tenantId,missionId);
    if(!old||old.state!=='LEASED'||old.lease_owner!==workerId)throw Error('LEASE_OR_TENANT_MISMATCH');
    const encoded=dump(result),receipt=randomUUID(),t=now();
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare("UPDATE work_items SET state='COMPLETED',result_json=?,lease_owner=NULL,lease_expires_ms=0,updated_at=? WHERE id=? AND state='LEASED' AND lease_owner=?")
        .run(encoded,t,id,workerId);
      db.prepare('INSERT INTO receipts(id,tenant_id,mission_id,work_id,result_hash,outcome,facts_json,created_at) VALUES(?,?,?,?,?,?,?,?)')
        .run(receipt,tenantId,missionId,id,digest(encoded),'LOCAL_DETERMINISTIC_COMPLETED',dump({profileId:old.profile_id}),t);
      db.exec('COMMIT');
      return {id,state:'COMPLETED',receiptId:receipt,sha256:digest(encoded)};
    }catch(e){db.exec('ROLLBACK');throw e;}
  }
  function fail(tenantId,missionId,id,workerId,code){
    check(tenantId,missionId);
    const old=db.prepare('SELECT * FROM work_items WHERE id=? AND tenant_id=? AND mission_id=?').get(id,tenantId,missionId);
    if(!old||old.state!=='LEASED'||old.lease_owner!==workerId)throw Error('LEASE_OR_TENANT_MISMATCH');
    const state=old.attempts>=old.max_attempts?'BLOCKED':'PENDING';
    db.prepare('UPDATE work_items SET state=?,last_error=?,lease_owner=NULL,lease_expires_ms=0,updated_at=? WHERE id=?')
      .run(state,String(code).slice(0,180),now(),id);
    return {id,state,attempts:old.attempts};
  }
  function snapshot(tenantId,missionId){
    check(tenantId,missionId);
    const counts=db.prepare('SELECT state,count(*) AS n FROM work_items WHERE tenant_id=? AND mission_id=? GROUP BY state').all(tenantId,missionId);
    const receipts=db.prepare('SELECT id,result_hash,outcome,created_at FROM receipts WHERE tenant_id=? AND mission_id=? ORDER BY created_at DESC LIMIT 12').all(tenantId,missionId);
    return {tenantId,missionId,checkpoint:getCheckpoint(tenantId,missionId),counts:Object.fromEntries(counts.map(x=>[x.state,x.n])),receipts,
      externalSendsVerified:0,note:'Local continuity mirror: does not establish X1 scheduler or production provider execution'};
  }
  function getItem(tenantId,missionId,id){
    check(tenantId,missionId);
    return cleanRow(db.prepare('SELECT * FROM work_items WHERE id=? AND tenant_id=? AND mission_id=?').get(id,tenantId,missionId));
  }
  return {path:dbPath,checkpoint,getCheckpoint,enqueue,claim,complete,fail,snapshot,getItem,close(){db.close();}};
}
