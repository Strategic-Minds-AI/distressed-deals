import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BASE_ROLES,PROFILES,summarizeCatalog,getProfile } from '../agent-runtime/catalog.mjs';
import { openLedger } from '../agent-runtime/ledger.mjs';
import { executeLocal } from '../agent-runtime/handlers.mjs';
import { runOne } from '../agent-runtime/runner.mjs';
const TENANT='strategic-minds-ai',MISSION='property-deal-os:broward-pilot:v1';
function fixture() {
  const dir=mkdtempSync(join(tmpdir(),'dealops-sandbox-'));
  return {dir,path:join(dir,'mirror.sqlite'),close(){rmSync(dir,{force:true,recursive:true});}};
}
test('62 functional role definitions, 248 scoped profiles and 12 safe local handlers',()=>{
  const summary=summarizeCatalog();
  assert.equal(BASE_ROLES.length,62);
  assert.equal(PROFILES.length,248);
  assert.equal(summary.localHandlers,12);
  assert.equal(summary.liveIndependentAgentsVerified,0);
  assert.equal(summary.externalProviderAdaptersVerified,0);
  assert.equal(new Set(PROFILES.map(p=>p.id)).size,248);
  assert.equal(getProfile('communications.eden-outbound-call@broward').executor,'ADAPTER_REQUIRED');
});
test('parcel normalization fails closed on ZIP-only data',()=>{
  const result=executeLocal('data.parcel-normalizer@broward',{zip:'33301'});
  assert.equal(result.status,'HOLD_FOR_REVIEW');assert.equal(result.identity.key,null);
});
test('matching must never join unrelated property owners by ZIP alone',()=>{
  const out=executeLocal('data.record-merge-guard@broward',{left:{address:'100 Main Street',city:'Fort Lauderdale',state:'FL',zip:'33301'},right:{address:'200 Main Street',city:'Fort Lauderdale',state:'FL',zip:'33301'}});
  assert.equal(out.matched,false);assert.equal(out.reviewRequired,true);
});
test('parcel match requires jurisdiction agreement and unit cannot be ignored',()=>{
  const p={apn:'12345',county:'Broward',state:'FL'};
  assert.equal(executeLocal('data.record-merge-guard@broward',{left:p,right:p}).matched,true);
  assert.equal(executeLocal('data.record-merge-guard@broward',{left:p,right:{...p,county:'Miami-Dade'}}).matched,false);
  const a={address:'100 Main St',city:'Fort Lauderdale',state:'FL',zip:'33301',unit:'5'};
  assert.equal(executeLocal('data.record-merge-guard@broward',{left:a,right:{...a,unit:'6'}}).matched,false);
});
test('freshness rejects historical and future verification',()=>{
  const sample='2026-11-12T01:00:00Z',t='2026-11-12T23:00:00Z';
  assert.equal(executeLocal('data.data-freshness-monitor@broward',{verifiedAt:sample,asOf:t}).verified,true);
  assert.equal(executeLocal('data.data-freshness-monitor@broward',{verifiedAt:'2026-09-02T00:00:00Z',asOf:t}).verified,false);
  assert.equal(executeLocal('data.data-freshness-monitor@broward',{verifiedAt:'2026-12-02T00:00:00Z',asOf:t}).verified,false);
});
const feedAsOf='2026-11-13T09:00:00Z';
const feedContext={tenantId:TENANT,asOf:feedAsOf};
const feedBox={id:'buyer-research',tenantId:TENANT,market:'Broward',types:['single_family'],
  minPurchasePrice:100000,maxPurchasePrice:300000,buyBoxVerified:true,
  buyBoxVerifiedAt:'2026-11-12T09:00:00Z'};
const feedProperty={propertyId:'feed-1',tenantId:TENANT,state:'FL',county:'Broward',
  parcelId:'5042-00-1000',market:'Broward',type:'single_family',
  estimatedPrice:210000,score:87,verifiedAt:'2026-11-12T11:00:00Z',
  sourceUseAuthorized:true,rightsEvidenceId:'evidence-attestation-fixture',
  sourceUrl:'https://example.gov/fixtures/5042001000'};
const rank=(properties,box=feedBox,context=feedContext)=>executeLocal(
  'acquisition.for-you-feed-ranker@broward',{properties,buyBox:box},context);
test('For You research returns only tenant-scoped evidence-gated parcels with a matching buy box',()=>{
  const r=rank([feedProperty,{...feedProperty,propertyId:'older',parcelId:'not-same',
    verifiedAt:'2026-09-01T00:00:00Z'},
    {...feedProperty,propertyId:'other-tenant',parcelId:'not-same-2',tenantId:'other'}]);
  assert.deepEqual(r.items.map(x=>x.propertyId),['feed-1']);
  assert.equal(r.tenantScoped,true);assert.equal(r.sendAllowed,false);
  assert.equal(r.notVerifiedAvailable,true);assert.equal(r.notOffers,true);
  assert.equal(r.items[0].listingAvailabilityVerified,false);
});
test('For You refuses missing or forged ledger tenant context and unverified buy box',()=>{
  for(const ctx of [{},{tenantId:'other',asOf:feedAsOf},{tenantId:TENANT,asOf:'invalid'}]){
    const r=rank([feedProperty],feedBox,ctx);
    assert.equal(r.status,'HOLD_FOR_REVIEW');assert.deepEqual(r.items,[]);
  }
  for(const b of [null,{...feedBox,tenantId:'other'},
    {...feedBox,buyBoxVerified:false},{...feedBox,buyBoxVerifiedAt:'2026-01-01T00:00:00Z'},
    {...feedBox,buyBoxVerifiedAt:'2026-11-15T00:00:00Z'},
    {...feedBox,maxPurchasePrice:20000,minPurchasePrice:30000}]) {
    const r=rank([feedProperty],b);
    assert.equal(r.status,'HOLD_FOR_REVIEW');assert.deepEqual(r.items,[]);
  }
});
test('For You excludes missing rights, foreign counties, stale or future data, and unpriced rows',()=>{
  const cases=[
    {sourceUseAuthorized:false},{rightsEvidenceId:''},{sourceUrl:'http://example.com'},
    {county:'Palm Beach'},{state:'GA'},{parcelId:''},
    {verifiedAt:'2026-07-01T00:00:00Z'},
    {verifiedAt:'2026-11-20T00:00:00Z'},{estimatedPrice:null},
    {estimatedPrice:400000},{type:'condo'},{score:'95'},{score:101}
  ];
  for(const [i,delta] of cases.entries()){
    const r=rank([{...feedProperty,...delta,propertyId:'negative-'+i}]);
    assert.deepEqual(r.items,[],JSON.stringify(delta));
  }
});
test('For You quarantines duplicate folios and deterministically ranks nonduplicated safe rows',()=>{
  const duplicate={...feedProperty,propertyId:'duplicate',score:99};
  const second={...feedProperty,propertyId:'unique',parcelId:'5042-00-2000',score:90};
  const third={...feedProperty,propertyId:'sorted',parcelId:'5042-00-3000',score:90};
  const r=rank([third,duplicate,second,feedProperty]);
  assert.deepEqual(r.items.map(x=>x.propertyId),['sorted','unique']);
});
const buyerAsOf='2026-11-13T08:00:00Z';
const buyerProperty={tenantId:TENANT,market:'Broward',county:'Broward',state:'FL',parcelId:'123-0001',
  type:'single_family',estimatedPrice:200000,sourceUseAuthorized:true,
  rightsEvidenceId:'source-permission-test',sourceUrl:'https://example.gov/parcel/fixture',
  verifiedAt:'2026-11-12T18:00:00Z'};
const buyerContext={tenantId:TENANT,asOf:buyerAsOf};
const buyerBoxes=[
  {id:'yes',tenantId:TENANT,market:'Broward',types:['single_family'],maxPurchasePrice:250000,
   buyBoxVerified:true,buyBoxVerifiedAt:'2026-11-12T08:00:00Z'},
  {id:'no-budget',tenantId:TENANT,market:'Broward',types:['single_family'],maxPurchasePrice:150000,
   buyBoxVerified:true,buyBoxVerifiedAt:'2026-11-12T08:00:00Z'},
  {id:'unverified',tenantId:TENANT,market:'Broward',types:['single_family'],maxPurchasePrice:250000,
   buyBoxVerified:false,buyBoxVerifiedAt:'2026-11-12T08:00:00Z'}
];
test('cash buyer matching is tenant-scoped criteria research, never funding verification or contact',()=>{
  const x=executeLocal('acquisition.buyer-buy-box-matcher@broward',
    {property:buyerProperty,buyers:buyerBoxes},buyerContext);
  assert.deepEqual(x.buyerMatches.map(y=>y.buyerProfileId),['yes']);
  assert.equal(x.buyerMatches[0].fundingVerified,false);
  assert.equal(x.buyerMatches[0].contactAuthorized,false);
  assert.equal(x.sendAllowed,false);
});
test('missing or forged tenant context produces no buyer matches',()=>{
  const profile='acquisition.buyer-buy-box-matcher@broward';
  for(const context of [{},{tenantId:'other-tenant',asOf:buyerAsOf}]){
    const r=executeLocal(profile,{property:buyerProperty,buyers:buyerBoxes},context);
    assert.equal(r.status,'HOLD_FOR_REVIEW');
    assert.equal(r.buyerMatches.length,0);
  }
  const other={...buyerBoxes[0],id:'other',tenantId:'other-tenant'};
  const r=executeLocal(profile,{property:buyerProperty,buyers:[other]},buyerContext);
  assert.equal(r.buyerMatches.length,0);
});
test('unverified source rights, stale folios, missing prices and wrong county block matching',()=>{
  const profile='acquisition.buyer-buy-box-matcher@broward';
  const scenarios=[
    {...buyerProperty,sourceUseAuthorized:false},
    {...buyerProperty,rightsEvidenceId:''},
    {...buyerProperty,verifiedAt:'2026-09-01T00:00:00Z'},
    {...buyerProperty,county:'Miami-Dade'},
    {...buyerProperty,parcelId:''},
    {...buyerProperty,estimatedPrice:null}
  ];
  for(const property of scenarios){
    const r=executeLocal(profile,{property,buyers:buyerBoxes},buyerContext);
    assert.equal(r.status,'HOLD_FOR_REVIEW');
    assert.deepEqual(r.buyerMatches,[]);
  }
});
test('incomplete, expired, contradictory or out-of-tenant buy boxes never match',()=>{
  const profile='acquisition.buyer-buy-box-matcher@broward';
  const base=buyerBoxes[0];
  const cases=[
    {...base,types:[]},{...base,maxPurchasePrice:undefined},
    {...base,buyBoxVerifiedAt:'2026-01-01T00:00:00Z'},
    {...base,minPurchasePrice:260000,maxPurchasePrice:250000},
    {...base,market:'Palm Beach'},{...base,id:'other',tenantId:'other-tenant'}
  ];
  for(const item of cases) {
    const r=executeLocal(profile,{property:buyerProperty,buyers:[item]},buyerContext);
    assert.deepEqual(r.buyerMatches,[]);
  }
});
test('duplicate eligible buy-box IDs are reduced to one deterministic internal match',()=>{
  const r=executeLocal('acquisition.buyer-buy-box-matcher@broward',
    {property:buyerProperty,buyers:[buyerBoxes[0],buyerBoxes[0]]},buyerContext);
  assert.deepEqual(r.buyerMatches.map(x=>x.buyerProfileId),['yes']);
});
test('only deterministic strategy screening, no automatic assignment',()=>{
 const r=executeLocal('underwriting.wholesale-assignment-screen@broward',{metrics:{contractPrice:150000,endBuyerPrice:170000,transactionCosts:5500}});
 assert.equal(r.status,'SCREENING_ONLY');assert.equal(r.metrics.grossSpread,20000);
 assert.equal(r.metrics.illustrativeNetBeforeTaxes,14500);assert.equal(r.reviewRequired,true);
});
test('outbound AI role lacks adapter and cannot call anyone',()=>{
 const x=executeLocal('communications.eden-outbound-call@broward',{});
 assert.equal(x.status,'WAITING_PROVIDER');
});
test('STOP classification never sends a text',()=>{
 const x=executeLocal('communications.opt-out-and-dnc-guard@broward',{text:'STOP'});
 assert.equal(x.classification,'OPT_OUT');assert.equal(x.sendAllowed,false);
});
test('local checkpoint persists across DB reopening',()=>{
 const f=fixture();let db=openLedger(f.path);
 try {
   db.checkpoint({tenantId:TENANT,missionId:MISSION,phase:'source-audit',state:'IN_PROGRESS',refSha:'fixture',details:{safe:true}});
   assert.equal(db.getCheckpoint(TENANT,MISSION).revision,1);
   db.close();
   db=openLedger(f.path);
   assert.equal(db.getCheckpoint(TENANT,MISSION).phase,'source-audit');
   assert.equal(db.getCheckpoint(TENANT,MISSION).revision,1);
   db.checkpoint({tenantId:TENANT,missionId:MISSION,phase:'local-test',state:'TESTED'});
   assert.equal(db.getCheckpoint(TENANT,MISSION).revision,2);
 }finally{db.close();f.close();}
});
test('idempotency prevents duplicate and conflicting work',()=>{
 const f=fixture();const db=openLedger(f.path);
 try {
   const opts={tenantId:TENANT,missionId:MISSION,profileId:'data.parcel-normalizer@broward',idempotencyKey:'fixture:a',payload:{apn:'ABC',county:'Broward',state:'FL'}};
   const a=db.enqueue(opts),b=db.enqueue(opts);
   assert.equal(a.id,b.id);assert.equal(b.idempotentReuse,true);
   assert.throws(()=>db.enqueue({...opts,payload:{apn:'DIFFERENT',county:'Broward',state:'FL'}}),/IDEMPOTENCY_CONFLICT/);
 }finally{db.close();f.close();}
});
test('non-PII local mirror rejects owner contacts and secret data',()=>{
 const f=fixture();const db=openLedger(f.path);
 try{
   const base={tenantId:TENANT,missionId:MISSION,profileId:'data.parcel-normalizer@broward',idempotencyKey:'fixture:b'};
   assert.throws(()=>db.enqueue({...base,payload:{owner_phone:'+19545551234'}}),/LOCAL_PII/);
   assert.throws(()=>db.enqueue({...base,payload:{secret:'token-value'}}),/LOCAL_PII/);
 }finally{db.close();f.close();}
});
test('runOne produces a real durable local receipt and no provider send',()=>{
 const f=fixture();let db=openLedger(f.path);
 try{
   db.enqueue({tenantId:TENANT,missionId:MISSION,profileId:'underwriting.wholesale-assignment-screen@broward',idempotencyKey:'fixture:wholesale',payload:{metrics:{contractPrice:100000,endBuyerPrice:130000,transactionCosts:2000}}});
   const ran=runOne(db,{tenantId:TENANT,missionId:MISSION});
   assert.equal(ran.state,'COMPLETED');
   assert.equal(ran.processed,1);assert.equal(ran.sha256.length,64);
   assert.equal(db.snapshot(TENANT,MISSION).counts.COMPLETED,1);
   db.close();db=openLedger(f.path);
   assert.equal(db.snapshot(TENANT,MISSION).receipts.length,1);
   assert.equal(db.snapshot(TENANT,MISSION).externalSendsVerified,0);
 }finally{db.close();f.close();}
});
test('external adapter role is held, never executed',()=>{
 const f=fixture();const db=openLedger(f.path);
 try{
  db.enqueue({tenantId:TENANT,missionId:MISSION,profileId:'communications.eden-outbound-call@broward',idempotencyKey:'fixture:voice'});
  const res=runOne(db,{tenantId:TENANT,missionId:MISSION});
  assert.equal(res.state,'WAITING_PROVIDER');
  assert.equal(db.snapshot(TENANT,MISSION).counts.WAITING_PROVIDER,1);
  assert.equal(db.snapshot(TENANT,MISSION).receipts.length,0);
 }finally{db.close();f.close();}
});
test('lease and tenant ownership cannot be spoofed',()=>{
 const f=fixture();const db=openLedger(f.path);
 try{
  const a=db.enqueue({tenantId:TENANT,missionId:MISSION,profileId:'data.parcel-normalizer@broward',idempotencyKey:'fixture:lease',payload:{apn:'999',county:'Broward',state:'FL'}});
  const work=db.claim(TENANT,MISSION,'worker-one');
  assert.equal(work.id,a.id);
  assert.throws(()=>db.complete(TENANT,MISSION,a.id,'worker-two',{ok:true}),/LEASE_OR_TENANT_MISMATCH/);
  assert.throws(()=>db.complete('other-tenant',MISSION,a.id,'worker-one',{ok:true}),/LEASE_OR_TENANT_MISMATCH/);
  assert.equal(db.getItem('other-tenant',MISSION,a.id),null);
  db.complete(TENANT,MISSION,a.id,'worker-one',{ok:true});
 }finally{db.close();f.close();}
});
test('bounded retries eventually block a failing local job',()=>{
 const f=fixture();const db=openLedger(f.path);
 try{
  const a=db.enqueue({tenantId:TENANT,missionId:MISSION,profileId:'data.parcel-normalizer@broward',idempotencyKey:'fixture:fail',maxAttempts:2});
  for(let i=0;i<2;i++){
    const work=db.claim(TENANT,MISSION,'test-worker');
    assert.equal(work.id,a.id);
    const x=db.fail(TENANT,MISSION,a.id,'test-worker','SYNTHETIC_FAILURE');
    assert.equal(x.state,i===0?'PENDING':'BLOCKED');
  }
  assert.equal(db.snapshot(TENANT,MISSION).counts.BLOCKED,1);
 }finally{db.close();f.close();}
});