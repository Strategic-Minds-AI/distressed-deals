import test from 'node:test';
import assert from 'node:assert/strict';
import {auditInventoryRecords} from '../shared/inventoryAudit.js';
const rec=(id,address,extra={})=>({id,address,city:'Fort Lauderdale',state:'FL',zip:'33301',county:'Broward',tenant_id:'T1',title:'Test property',asking_price:125000,category:'Distressed',images:[],...extra});
test('audit never withdraws or mutates property records',()=>{
 const rows=[rec('1','100 MAIN ST'),rec('2','100 MAIN ST',{status:'Active'}),rec('3','200 MAIN ST',{status:'Active',title:''})];
 const before=JSON.stringify(rows), report=auditInventoryRecords(rows);
 assert.equal(JSON.stringify(rows),before);
 assert.equal(report.applied,false);assert.equal(report.updated,0);
 assert.equal(report.duplicatesWithdrawn,0);assert.equal(report.incompleteWithdrawn,0);
 assert.equal(report.incompleteCandidates,1);assert.equal(report.duplicateCandidates,1);
});
test('duplicate ZIP does not create false duplicate',()=>{
 const result=auditInventoryRecords([rec('1','300 OAK ST'),rec('2','400 OAK ST')]);
 assert.equal(result.duplicateCandidates,0);
});
test('different apartment units are distinct',()=>{
 const result=auditInventoryRecords([rec('1','250 OAK ST UNIT 1'),rec('2','250 OAK ST UNIT 2')]);
 assert.equal(result.duplicateCandidates,0);
});
test('image validation is syntax only, offline and non-destructive',()=>{
 const row=rec('1','100 MAIN ST',{images:['http://127.0.0.1:3000/private','not-url','https://images.example.com/a.png']});
 const r=auditInventoryRecords([row],{checkImageFormat:true});
 assert.equal(r.invalidImageUrls,2);assert.equal(r.urlFormatsChecked,3);
 assert.equal(r.validated,0);assert.equal(r.deadImagesReplaced,0);
});
test('no public URLs or owner contact PII are included in audit pairs',()=>{
 const a=rec('secret-1','500 MAIN ST',{owner_email:'private@example.com'});
 const b=rec('secret-2','500 MAIN ST',{owner_email:'private@example.com'});
 const report=auditInventoryRecords([a,b]);
 assert.doesNotMatch(JSON.stringify(report),/private@example.com/);
 assert.equal(report.duplicateReviewPairs[0].verdict,'AMBIGUOUS_UNIT');
});
