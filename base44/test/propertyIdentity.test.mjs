import test from 'node:test';
import assert from 'node:assert/strict';
import {propertyIdentity, classifyPropertyPair, auditPropertyCandidates} from '../shared/propertyIdentity.js';
const p=(id,address,extra={})=>({id,address,city:'Fort Lauderdale',state:'FL',zip:'33301',county:'Broward',tenant_id:'T1',...extra});
test('same ZIP is never a duplicate without same full street',()=>{
  assert.equal(classifyPropertyPair(p(1,'100 MAIN ST'),p(2,'200 MAIN ST')),'DIFFERENT_ADDRESS');
  assert.equal(auditPropertyCandidates([p(1,'100 MAIN ST'),p(2,'200 MAIN ST')]).totalCandidates,0);
});
test('separate apartments at the same street are separate properties',()=>{
  const a=p(1,'125 MAIN STREET APT 2A'),b=p(2,'125 MAIN ST APT 2B');
  assert.equal(classifyPropertyPair(a,b),'DIFFERENT_UNIT');
  assert.equal(auditPropertyCandidates([a,b]).totalCandidates,0);
});
test('same verified parcel in same county is a review candidate only',()=>{
  const a=p(1,'10 A ST',{parcel_id:'5042-01-01'}),b=p(2,'10 A STREET',{parcel_id:'5042-01-01'});
  assert.equal(classifyPropertyPair(a,b),'REVIEW_SAME_PARCEL');
  const report=auditPropertyCandidates([a,b]);assert.equal(report.totalCandidates,1);assert.equal(report.autoWithdrawn,0);
});
test('identical parcel in another county is not strong identity',()=>{
  const a=p(1,'100 A ST',{parcel_id:'123',county:'Broward'}),b=p(2,'100 B ST',{parcel_id:'123',county:'Miami-Dade'});
  assert.equal(classifyPropertyPair(a,b),'DIFFERENT_ADDRESS');
  assert.equal(auditPropertyCandidates([a,b]).totalCandidates,0);
});
test('distinct tenants are never cross-matched',()=>{
  assert.equal(classifyPropertyPair(p(1,'100 A ST'),p(2,'100 A ST',{tenant_id:'T2'})),'DIFFERENT_TENANT');
  assert.equal(auditPropertyCandidates([p(1,'100 A ST'),p(2,'100 A ST',{tenant_id:'T2'})]).totalCandidates,0);
});
test('same building with unit missing is ambiguous, not safe to merge',()=>{
  assert.equal(classifyPropertyPair(p(1,'125 MAIN ST'),p(2,'125 MAIN ST APT 4')),'AMBIGUOUS_UNIT');
  assert.equal(auditPropertyCandidates([p(1,'125 MAIN ST'),p(2,'125 MAIN ST APT 4')]).ambiguousCandidates,1);
});
test('conflicting parcels at same address quarantine candidate',()=>{
  const a=p(1,'125 MAIN ST APT 4',{parcel_id:'A'}),b=p(2,'125 MAIN ST APT 4',{parcel_id:'B'});
  assert.equal(classifyPropertyPair(a,b),'PARCEL_CONFLICT');
  assert.equal(auditPropertyCandidates([a,b]).ambiguousCandidates,1);
});
test('missing street number or ZIP never creates identity',()=>{
  assert.equal(propertyIdentity(p(1,'MAIN ST')).addressReady,false);
  assert.equal(auditPropertyCandidates([p(1,'MAIN ST'),p(2,'MAIN ST')]).totalCandidates,0);
});
test('all candidate reports are side-effect free and capped',()=>{
  const entries=Array.from({length:5},(_,id)=>p(id,'777 OAK ST',{parcel_id:'A'}));
  const original=JSON.stringify(entries), report=auditPropertyCandidates(entries,2);
  assert.equal(report.totalCandidates,10);assert.equal(report.pairs.length,2);assert.equal(report.truncated,true);
  assert.equal(report.autoMerged,0);assert.equal(report.autoWithdrawn,0);assert.equal(JSON.stringify(entries),original);
});
test('county/tenant absent never allows verified automatic action',()=>{
  const x=p(1,'111 A ST',{county:'',tenant_id:''});
  assert.equal(propertyIdentity(x).county,'');assert.equal(auditPropertyCandidates([x,x]).autoMerged,0);
});
