import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPropertyForReview } from './propertyReview.js';
const time=Date.parse('2026-11-13T04:00:00Z');
const safe={ verified_at:'2026-11-12T04:00:00Z', county:'Broward', parcel_id:'FAKE123',
  listing_url:'https://example.org/listing', source_rights_confirmed:true,source_rights_ref:'fixture_license_1',
  asking_price:120000,arv:200000,estimated_repair_cost:10000,
  image_use_authorized:true,image_rights_ref:'fixture_img_lic',images:['https://example.org/img.jpg'] };
test('historical data is not a verified, callable, offer-ready property',()=>{
  const r=inspectPropertyForReview({...safe,verified_at:'2026-09-01T04:00:00Z'},time);
  assert.equal(r.sourceReadyForAgentReview,false);
  assert.equal(r.mayContactOwner,false);
  assert.equal(r.maySendBindingOffer,false);
});
test('third party images without documented rights never display',()=>{
  const r=inspectPropertyForReview({...safe,image_use_authorized:false},time);
  assert.equal(r.photoUrl,null);
});
test('missing price inputs never display calculated investment certainty',()=>{
  const r=inspectPropertyForReview({...safe,arv:undefined},time);
  assert.equal(r.hasInvestmentInputs,false);
});
test('legitimate source evidence can reach agent review, still no automated offers',()=>{
  const r=inspectPropertyForReview(safe,time);
  assert.equal(r.sourceReadyForAgentReview,true);
  assert.equal(r.photoUrl,'https://example.org/img.jpg');
  assert.equal(r.maySendBindingOffer,false);
});
test('missing parcel and source use rights block recommendation',()=>{
  const r=inspectPropertyForReview({...safe,parcel_id:'',source_rights_confirmed:false},time);
  assert.equal(r.sourceReadyForAgentReview,false);
  assert.ok(r.reasons.includes('SOURCE_USE_RIGHTS_UNVERIFIED'));
});
