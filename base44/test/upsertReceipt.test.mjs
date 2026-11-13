import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcilePropertyUpsertReceipt} from '../shared/upsertReceipt.js';
test('provider counters must exactly reconcile expected rows',()=>{
 const v=reconcilePropertyUpsertReceipt({created:2,updated:3},5);
 assert.deepEqual(v,{verified:true,created:2,updated:3,deleted:0});
});
test('empty or unstructured SDK result cannot certify writes',()=>{
 for(const r of [null,undefined,[],[{},{}],{},'success',{length:5}])
   assert.equal(reconcilePropertyUpsertReceipt(r,5).verified,false);
});
test('missing, negative, inflated or noninteger counters cannot certify writes',()=>{
 for(const r of [{created:0,updated:0},{created:2,updated:2},{created:6,updated:0},{created:-1,updated:6},{created:2.5,updated:2.5},{created:2,updated:'3'}])
   assert.equal(reconcilePropertyUpsertReceipt(r,5).verified,false);
});
test('unexpected delete cannot appear in healthy receipt',()=>{
 assert.equal(reconcilePropertyUpsertReceipt({created:5,updated:0,deleted:1},5).verified,false);
});
test('unknown outcome stays unknown and must not claim newly created properties',()=>{
 const v=reconcilePropertyUpsertReceipt({length:5,upserted:true},5);
 assert.equal(v.verified,false);assert.equal(v.reason,'MISSING_PROVIDER_COUNTERS');
});
test('zero expected writes are not a productive sync receipt',()=>{
 assert.equal(reconcilePropertyUpsertReceipt({created:0,updated:0},0).verified,false);
});
