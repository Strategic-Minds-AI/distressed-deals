import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL(p,import.meta.url),'utf8');
test('property detail creates nonbinding drafts rather than submitted offers',()=>{
  const p=read('../pages/PropertyDetail.jsx');
  assert.match(p,/status: "Draft"/);
  assert.doesNotMatch(p,/status: "Submitted"/);
  assert.match(p,/No offer was sent/);
  assert.match(p,/auth\.me\(\)/);
});
test('public-facing research surfaces require photo rights and disclose stale status',()=>{
  const card=read('../components/property/DistressedPropertyCard.jsx');
  const browse=read('../pages/BrowseDeals.jsx');
  const detail=read('../pages/PropertyDetail.jsx');
  assert.match(card,/review\.photoUrl/);
  assert.doesNotMatch(card,/property\.images\?\.\[imgIdx\]/);
  assert.match(browse,/Records may be stale or inaccurate/);
  assert.match(detail,/Property photograph withheld until display rights are verified/);
});
test('unverified agent contacts are not rendered directly in property detail',()=>{
  const detail=read('../pages/PropertyDetail.jsx');
  assert.doesNotMatch(detail,/\{property\.agent_phone\}/);
  assert.doesNotMatch(detail,/\{property\.agent_email\}/);
});
test('entity schema defaults to internal draft with scoped create policy',()=>{
  const entity=JSON.parse(read('../../base44/entities/Offer.jsonc'));
  assert.equal(entity.properties.status.default,'Draft');
  assert.ok(entity.properties.status.enum.includes('Draft'));
  assert.ok(entity.rls.create.$or.length>=3);
});
