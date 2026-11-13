import test from 'node:test';
import assert from 'node:assert/strict';
import {screenBrowardSourceRows} from '../shared/sourceGate.js';
const now=Date.UTC(2026,10,12);
const good=()=>({id:1,title:'Example',address:'123 Main St',city:'Fort Lauderdale',state:'FL',county:'Broward',
 verified_at:'2026-11-11T00:00:00Z',listing_url:'https://public.example.org/property/1',asking_price:170000});
const screen=rows=>screenBrowardSourceRows(rows,{now});
test('good fixture is suitable for manual source-rights review, not auto-authorized',()=>{
 const r=screen([good()]);assert.equal(r.counts.eligible,1);assert.equal(r.rightsVerified,false);
});
test('no county/jurisdiction proof is quarantined, even in Fort Lauderdale',()=>{
 const x=good();delete x.county;const r=screen([x]);assert.equal(r.counts.eligible,0);assert.equal(r.counts.browardProven,0);
});
test('matching ZIP or city without county proof is inadequate',()=>{
 const x={...good(),county:'Miami-Dade',zip:'33301'};assert.equal(screen([x]).counts.eligible,0);
});
test('old verification and future timestamps are rejected',()=>{
 const a={...good(),verified_at:'2025-01-01T00:00:00Z'};
 const b={...good(),verified_at:'2026-11-13T00:00:00Z'};
 assert.equal(screen([a,b]).counts.eligible,0);
});
test('missing source URL or HTTP/private URL is rejected',()=>{
 const a={...good(),listing_url:''},b={...good(),listing_url:'http://localhost:3000/secret'};
 assert.equal(screen([a,b]).counts.eligible,0);
});
test('non-Florida rows are excluded',()=>{
 assert.equal(screen([{...good(),state:'GA'}]).counts.eligible,0);
});
test('price and address are required, no fabricated asking price',()=>{
 assert.equal(screen([{...good(),asking_price:0},{...good(),address:''}]).counts.eligible,0);
});
test('no mutation and expected counts across mixed sources',()=>{
 const x=good(),y={...good(),id:2,county:''};const before=JSON.stringify([x,y]);const r=screen([x,y]);
 assert.equal(r.counts.total,2);assert.equal(r.counts.florida,2);assert.equal(r.counts.eligible,1);
 assert.equal(JSON.stringify([x,y]),before);
});
