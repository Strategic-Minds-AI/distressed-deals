import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScopedSourceRead,classifySourceReadFailure,PINNED_PROJECT_REF} from '../scopedSourceRead.js';
const fakeJwt = (claims) => 'test.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.signature';
const now=Date.parse('2026-11-13T06:00:00Z');
const valid={projectRef:PINNED_PROJECT_REF,table:'distressed_properties',apiKey:'sb_publishable_example',
 accessToken:fakeJwt({iss:`https://${PINNED_PROJECT_REF}.supabase.co/auth/v1`,role:'property_reader',exp:Math.floor(now/1000)+3600,aud:'authenticated'}),now};
test('pinned RLS read descriptor needs explicit identity',()=> {
 const p=buildScopedSourceRead(valid);
 assert.equal(p.endpoint,`https://${PINNED_PROJECT_REF}.supabase.co/rest/v1/distressed_properties`);
 assert.equal(p.headers.Authorization,`Bearer ${valid.accessToken}`);
});
test('other property project rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,projectRef:'other-tenant'}),/WRONG_PROJECT/));
test('unreviewed table rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,table:'owners'}),/WRONG_TABLE/));
test('missing credentials rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,apiKey:''}),/SOURCE_READ_CREDENTIALS_MISSING/));
test('service role API key rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,apiKey:fakeJwt({role:'service_role'})}),/PRIVILEGED_API_KEY_FORBIDDEN/));
test('secret API key rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,apiKey:'sb_secret_example'}),/PRIVILEGED_API_KEY_FORBIDDEN/));
test('privileged bearer rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,accessToken:fakeJwt({role:'service_role'})}),/SCOPED_BEARER_REQUIRED/));
test('anonymous bearer rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,accessToken:fakeJwt({role:'anon'})}),/SCOPED_BEARER_REQUIRED/));
test('wrong token issuer rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,accessToken:fakeJwt({role:'authenticated',iss:'https://other.supabase.co/auth/v1',exp:Math.floor(now/1000)+3600})}),/BEARER_ISSUER_MISMATCH/));
test('expired token rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,accessToken:fakeJwt({role:'authenticated',iss:`https://${PINNED_PROJECT_REF}.supabase.co/auth/v1`,exp:Math.floor(now/1000)-1})}),/BEARER_EXPIRED_OR_NEAR_EXPIRY/));
test('malformed JWT rejected',()=>assert.throws(()=>buildScopedSourceRead({...valid,accessToken:'nonsense'}),/SCOPED_BEARER_REQUIRED/));
test('HTTP denial differs from absent table',()=> {
 assert.equal(classifySourceReadFailure(403),'source_read_denied');
 assert.equal(classifySourceReadFailure(401),'source_read_denied');
 assert.equal(classifySourceReadFailure(404),'no_source_table');
 assert.equal(classifySourceReadFailure(500),'source_read_error');
});