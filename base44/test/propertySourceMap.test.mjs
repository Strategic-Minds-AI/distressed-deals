import test from 'node:test';import assert from 'node:assert/strict';
import {mapScreenedSourceRow,PROJECT_REF,SOURCE_TABLE} from '../shared/propertySourceMap.js';
const now=Date.UTC(2026,10,13,5);
const good=()=>({id:19,title:'Fixture',address:'123 Main St Unit 1',city:'Fort Lauderdale',state:'FL',county:'Broward',
 zip:'33301',parcel_id:'5042-10-00019',verified_at:'2026-11-12T20:00:00Z',listing_url:'https://public.example.org/19',
 asking_price:250000,category:'Foreclosure',status:'Active'});
const map=r=>mapScreenedSourceRow(r,{projectRef:PROJECT_REF,table:SOURCE_TABLE,now});
test('verified source metadata persists full project/table namespace',()=>{
 const r=map(good());assert.equal(r.source_id,`${PROJECT_REF}:${SOURCE_TABLE}:19`);
 assert.equal(r.parcel_id,'5042-10-00019');assert.equal(r.county,'Broward');assert.equal(r.verified_at,'2026-11-12T20:00:00.000Z');
});
test('mismatched project or table fails closed',()=>{
 assert.throws(()=>mapScreenedSourceRow(good(),{projectRef:'wrong',table:SOURCE_TABLE,now}),/SOURCE_IDENTITY_MISMATCH/);
 assert.throws(()=>mapScreenedSourceRow(good(),{projectRef:PROJECT_REF,table:'owners',now}),/SOURCE_IDENTITY_MISMATCH/);
});
test('cannot invent freshness/parcel or source URL',()=>{
 assert.throws(()=>map({...good(),parcel_id:''}),/SOURCE_ROW_NOT_ELIGIBLE/);
 assert.throws(()=>map({...good(),verified_at:null}),/SOURCE_ROW_NOT_ELIGIBLE/);
 assert.throws(()=>map({...good(),listing_url:''}),/SOURCE_ROW_NOT_ELIGIBLE/);
});
test('unknown property status or category does not become Active/Distressed Sale',()=>{
 assert.throws(()=>map({...good(),status:'unknown'}),/UNVERIFIED_CATEGORY_OR_STATUS/);
 assert.throws(()=>map({...good(),category:'unknown'}),/UNVERIFIED_CATEGORY_OR_STATUS/);
});
test('third-party images are withheld unless row explicitly attests image rights',()=>{
 assert.deepEqual(map({...good(),images:['https://x.example/photo.jpg']}).images,[]);
 assert.deepEqual(map({...good(),image_use_authorized:true,images:['https://x.example/photo.jpg','http://bad/a']}).images,['https://x.example/photo.jpg']);
});
test('invalid optional dates do not crash or create fabricated date',()=>{
 const r=map({...good(),listed_date:'not-a-date',auction_date:'not-a-date'});
 assert.equal(r.listed_date,undefined);assert.equal(r.auction_date,undefined);
});
test('invalid optional numeric values never become NaN',()=>{
 const r=map({...good(),arv:'not-a-number',estimated_repair_cost:'',beds:null});
 assert.equal(r.arv,undefined);assert.equal(r.estimated_repair_cost,undefined);assert.equal(r.beds,undefined);
});
test('no source mutation and no payments, phone or email pass through',()=>{
 const input={...good(),email:'private@example.org',phone:'5550123',images:['https://photo.invalid/x']};
 const before=JSON.stringify(input),r=map(input);
 assert.equal(JSON.stringify(input),before);assert.ok(!('email' in r));assert.ok(!('phone' in r));
});
test('signed Florida coordinates and negative returns are preserved without fake zeroes',()=>{
 const r=map({...good(),lat:26.12,lng:-80.15,projected_roi:-0.2});
 assert.equal(r.lng,-80.15);assert.equal(r.lat,26.12);assert.equal(r.projected_roi,-0.2);
 assert.equal(map({...good(),lng:-999}).lng,undefined);
});
