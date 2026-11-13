import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSyncResponse,PROPERTY_PROJECT_REF,PROPERTY_TABLE} from '../syncAssessment.mjs';
const good=()=>({status:'synced',projectRef:PROPERTY_PROJECT_REF,table:PROPERTY_TABLE,
 rawRows:5,mapped:5,created:2,updated:3,deleted:0,freshVerifiedCount:5,sourceRightsConfirmed:true});
test('complete pinned, non-destructive source receipt can be classified productive',()=>{
  const x=assessSyncResponse(200,good()); assert.equal(x.healthy,true);assert.equal(x.code,'PRODUCTIVE_SYNC_CONFIRMED');
});
test('legacy no_source_table is a failure and never a healthy idle event',()=>{
  const x=assessSyncResponse(200,{status:'no_source_table'});assert.equal(x.code,'SOURCE_NOT_FOUND');assert.equal(x.healthy,false);
});
test('old success without exact project reference is not trusted',()=>{
  const x=good();delete x.projectRef; assert.equal(assessSyncResponse(200,x).code,'WRONG_SOURCE_IDENTITY');
});
test('wrong Supabase project or table is denied',()=>{
  assert.equal(assessSyncResponse(200,{...good(),projectRef:'wrong'}).code,'WRONG_SOURCE_IDENTITY');
  assert.equal(assessSyncResponse(200,{...good(),table:'owners'}).code,'WRONG_SOURCE_IDENTITY');
});
test('no recent verified source is not productive',()=>{
  assert.equal(assessSyncResponse(200,{...good(),freshVerifiedCount:0}).code,'FRESHNESS_UNVERIFIED');
  const x=good();delete x.freshVerifiedCount;assert.equal(assessSyncResponse(200,x).code,'FRESHNESS_UNVERIFIED');
});
test('rights-unverified source is denied even with recent data',()=>{
  assert.equal(assessSyncResponse(200,{...good(),sourceRightsConfirmed:false}).code,'SOURCE_RIGHTS_UNVERIFIED');
});
test('unexpected deletion, negative counts and inconsistent counts are denied',()=>{
  assert.equal(assessSyncResponse(200,{...good(),deleted:1}).code,'DESTRUCTIVE_SYNC');
  assert.equal(assessSyncResponse(200,{...good(),mapped:-1}).code,'UNTRUSTWORTHY_COUNTS');
  assert.equal(assessSyncResponse(200,{...good(),created:6}).code,'UNTRUSTWORTHY_COUNTS');
});
test('unknown/preview statuses and network errors never report success',()=>{
  assert.equal(assessSyncResponse(200,{status:'preview_only'}).code,'PREVIEW_ONLY');
  assert.equal(assessSyncResponse(200,{status:'source_rights_unverified'}).code,'SOURCE_RIGHTS_UNVERIFIED');
  assert.equal(assessSyncResponse(500,good()).code,'HTTP_ERROR');
  assert.equal(assessSyncResponse(200,null).code,'INVALID_RESPONSE');
});

test('incompatible real source schema with missing parcel/county is a hard failure',()=>{
 const x=assessSyncResponse(200,{status:'source_schema_incomplete',missingColumns:['county','parcel_id'],projectRef:PROPERTY_PROJECT_REF,table:PROPERTY_TABLE});
 assert.equal(x.healthy,false);assert.equal(x.code,'SOURCE_SCHEMA_INCOMPLETE');
});

test('unconfirmed or partial upsert is never evidence of productive sync',()=>{
 assert.equal(assessSyncResponse(200,{...good(),created:0,updated:0}).code,'UNTRUSTWORTHY_COUNTS');
 assert.equal(assessSyncResponse(200,{...good(),created:2,updated:1}).code,'UNTRUSTWORTHY_COUNTS');
 assert.equal(assessSyncResponse(200,{...good(),created:2,updated:4}).code,'UNTRUSTWORTHY_COUNTS');
});
