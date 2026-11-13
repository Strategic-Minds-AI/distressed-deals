import test from 'node:test';
import assert from 'node:assert/strict';
import {screenBrowardSourceRows} from '../shared/sourceGate.js';
const now=Date.UTC(2026,10,13,5);
const good=()=>({id:1,title:'Fixture property',address:'123 Main St Unit 2',city:'Fort Lauderdale',state:'FL',zip:'33301',county:'Broward',parcel_id:'5042-10-00-0001',
 verified_at:'2026-11-12T00:00:00Z',listing_url:'https://county.example.org/property/1',asking_price:170000});
const screen=rows=>screenBrowardSourceRows(rows,{now});
test('valid Broward parcel and full address only qualify for rights review',()=>{
 const r=screen([good()]);assert.equal(r.counts.eligible,1);assert.equal(r.rightsVerified,false);assert.equal(r.autoMerged,0);
});
test('county and state identity are mandatory',()=>{
 assert.equal(screen([{...good(),county:''},{...good(),county:'Miami-Dade'},{...good(),state:'GA'}]).counts.eligible,0);
});
test('stale, future, missing verification denied',()=>{
 assert.equal(screen([{...good(),verified_at:'2025-01-01'},{...good(),verified_at:'2026-11-20'},{...good(),verified_at:null}]).counts.eligible,0);
});
test('invalid source evidence URLs denied',()=>{
 assert.equal(screen([{...good(),listing_url:'http://example.org'},{...good(),listing_url:'https://localhost:8000/a'},{...good(),listing_url:'https://10.0.0.1/property'},{...good(),listing_url:''}]).counts.eligible,0);
});
test('no parcel, no complete address or ZIP means no identity',()=>{
 const variants=[{parcel_id:''},{address:'Main St'},{zip:''},{zip:'3330'}, {address:''}];
 assert.equal(screen(variants.map(x=>({...good(),...x}))).counts.eligible,0);
});
test('distinct parcels in same ZIP are not auto-merged or quarantined',()=>{
 const r=screen([good(), {...good(),id:2,parcel_id:'5042-10-00-0002',address:'125 Main St Unit 3'}]);
 assert.equal(r.counts.eligible,2);assert.equal(r.counts.duplicatesQuarantined,0);
});
test('same parcel across different source rows quarantines both',()=>{
 const r=screen([good(),{...good(),id:2,address:'999 Different St'}]);
 assert.equal(r.counts.eligible,0);assert.equal(r.counts.duplicatesQuarantined,2);
});
test('same source ID with conflicting parcels quarantines both',()=>{
 const r=screen([good(),{...good(),parcel_id:'5042-10-00-0002'}]);
 assert.equal(r.counts.eligible,0);assert.equal(r.counts.duplicatesQuarantined,2);
});
test('same-ZIP ambiguity never generates a write action; source is not modified',()=>{
 const rows=[good(), {...good(),id:2,parcel_id:'5042-10-00-0002',address:'125 Main St'}];
 const snapshot=JSON.stringify(rows),r=screen(rows);
 assert.equal(JSON.stringify(rows),snapshot);assert.equal(r.autoDeleted,0);assert.equal(r.autoMerged,0);
});
test('incorrect freshness window and input shape fail',()=>{
 assert.throws(()=>screenBrowardSourceRows({}, {now}),TypeError);
 assert.throws(()=>screenBrowardSourceRows([], {now,ageDays:100}),TypeError);
});
