import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openLedger} from '../agent-runtime/ledger.mjs';
import {auditSourceSnapshot} from '../agent-runtime/source-audit.mjs';
const tenantId='strategic-minds-ai',missionId='property-deal-os:broward-pilot:v1';
test('realistic source metadata gets durable truthful stale/recent/missing QC receipts',()=>{
 const dir=mkdtempSync(join(tmpdir(),'source-qc-')),db=openLedger(join(dir,'state.sqlite'));
 try{
  const p={tenantId,missionId,snapshotId:'2026-11-12',asOf:'2026-11-12T23:00:00Z',rows:[
  {propertyId:'uuid001',verifiedAt:'2026-11-11T17:00:00Z',sourceUrlPresent:true},
  {propertyId:'uuid002',verifiedAt:'2026-08-02T11:00:00Z',sourceUrlPresent:true},
  {propertyId:'uuid003',verifiedAt:null,sourceUrlPresent:false}
  ]};
  const a=auditSourceSnapshot(db,p);
  assert.equal(a.details.candidateCount,3);
  assert.equal(a.details.freshTimestampCount,1);
  assert.equal(a.details.staleTimestampCount,1);
  assert.equal(a.details.missingTimestampCount,1);
  assert.equal(a.completed,3);
  assert.equal(db.snapshot(tenantId,missionId).counts.COMPLETED,3);
  assert.equal(db.snapshot(tenantId,missionId).receipts.length,3);
  assert.equal(db.getCheckpoint(tenantId,missionId).state,'BLOCKED');
  const b=auditSourceSnapshot(db,p);
  assert.equal(b.reused,3);
  assert.equal(db.snapshot(tenantId,missionId).receipts.length,3);
 }finally{db.close();rmSync(dir,{force:true,recursive:true});}
});
test('unexpected owner contact fields block import before any local write',()=>{
 const dir=mkdtempSync(join(tmpdir(),'source-qc-')),db=openLedger(join(dir,'state.sqlite'));
 try{
  const r={tenantId,missionId,snapshotId:'2026-11-12',asOf:'2026-11-12T23:00:00Z',rows:[
  {propertyId:'uuid001',verifiedAt:'2026-11-11T17:00:00Z'},
  {propertyId:'uuid002',owner_phone:'+10000000000'}
  ]};
  assert.throws(()=>auditSourceSnapshot(db,r),/SOURCE_SNAPSHOT_UNEXPECTED/);
  assert.deepEqual(db.snapshot(tenantId,missionId).counts,{});
 }finally{db.close();rmSync(dir,{force:true,recursive:true});}
});
