import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPipelineSync } from '../shared/pipelineGuard.js';
import { assessAvailabilityEvidence } from '../shared/availabilityEvidence.js';
const valid = { status:'synced', projectRef:'fwtchbsebygwifmmqhur', table:'distressed_properties',
  sourceRightsConfirmed:true, mapped:2, freshVerifiedCount:2, created:1, updated:1, deleted:0 };
test('only fully reconciled rights-confirmed sync is eligible for downstream audit',()=>{
  assert.equal(assessPipelineSync(valid).canContinue,true);
});
test('no source, preview, missing rights and unknown writes fail closed',()=>{
  for(const patch of [
    {status:'no_fresh_verified_rows'}, {status:'source_schema_incomplete'},
    {status:'preview_only'}, {sourceRightsConfirmed:false}, {freshVerifiedCount:0},
    {mapped:0}, {created:2}, {deleted:undefined}, {deleted:1},
    {projectRef:'wrong-project'}, {table:'other_table'}, {writeOutcome:'UNKNOWN'}
  ])assert.equal(assessPipelineSync({...valid,...patch}).canContinue,false);
});
test('past auction date does NOT mark property sold or stamp verification',()=>{
  const x=assessAvailabilityEvidence([{id:'one',auction_date:'2025-01-01T00:00:00Z',listed_date:'2024-01-01T00:00:00Z'}],{now:Date.parse('2026-11-13T00:00:00Z')});
  assert.equal(x.status,'REVIEW_ONLY'); assert.equal(x.applied,false);
  assert.equal(x.counts.auction_date_passed,1);assert.equal(x.counts.marked_sold,0);
  assert.equal(x.counts.marked_withdrawn,0);assert.equal(x.counts.verified_available,0);
  assert.equal(x.counts.status_writes,0);
});
test('missing listing dates are flagged, never assumed available',()=>{
  const x=assessAvailabilityEvidence([{id:'x'}],{now:Date.parse('2026-11-13T00:00:00Z')});
  assert.equal(x.counts.missing_date_evidence,1);
  assert.equal(x.issues[0].flags.includes('CURRENT_LISTING_AND_TITLE_UNVERIFIED'),true);
});
