import test from 'node:test';
import assert from 'node:assert/strict';
import { readBoundedSourcePages, classifyPageReadError } from './sourcePageRead.js';
const endpoint = 'https://fwtchbsebygwifmmqhur.supabase.co/rest/v1/distressed_properties';
const headers = { Authorization: 'Bearer TEST_TOKEN_NOT_REAL' };
const mock = (rows, status=200, type='application/json') => ({
  status, headers: { get: key => key === 'content-type' ? type : null }, json: async () => rows
});
test('short page returns only data from pinned source without writes', async () => {
  let calls=0;
  const data=await readBoundedSourcePages({ endpoint, headers, pageSize:2,maxRows:4,
    fetchImpl:async()=>{calls++;return mock([{id:1}]);} });
  assert.deepEqual(data.rows,[{id:1}]);assert.equal(calls,1);assert.equal(data.truncated,false);
});
test('exact final page receives overflow probe before success',async()=>{
  const calls=[];
  const data=await readBoundedSourcePages({endpoint,headers,pageSize:2,maxRows:4,fetchImpl:async url=>{
    calls.push(new URL(url).searchParams.get('offset'));
    return mock(calls.length<=2?[{id:calls.length*2-1},{id:calls.length*2}]:[]);
  }});
  assert.deepEqual(calls,['0','2','4']);assert.equal(data.pages,3);assert.equal(data.rows.length,4);
});
test('overflow is failure, never silently truncated',async()=>{
  await assert.rejects(readBoundedSourcePages({endpoint,headers,pageSize:2,maxRows:4,
    fetchImpl:async url=>mock(new URL(url).searchParams.get('offset')==='4'?[{id:5}]:[{id:1},{id:2}])}),{code:'SOURCE_PAGE_LIMIT_EXCEEDED'});
});
test('cross-project URL, HTTP origin and oversized budget are blocked',async()=>{
  for(const url of ['https://evil.example/probe','http://fwtchbsebygwifmmqhur.supabase.co/rest/v1/distressed_properties','https://other.supabase.co/rest/v1/distressed_properties'])
    await assert.rejects(readBoundedSourcePages({endpoint:url,headers,fetchImpl:async()=>mock([])}),{code:'SOURCE_SCHEMA_INVALID'});
  await assert.rejects(readBoundedSourcePages({endpoint,headers,maxRows:5000,fetchImpl:async()=>mock([])}),{code:'SOURCE_SCHEMA_INVALID'});
});
test('authentication failure or absent table cannot be classified productive',async()=>{
  for(const [status,code] of [[401,'SOURCE_READ_DENIED'],[403,'SOURCE_READ_DENIED'],[404,'SOURCE_TABLE_NOT_FOUND']])
    await assert.rejects(readBoundedSourcePages({endpoint,headers,fetchImpl:async()=>mock([],status)}),{code});
});
test('HTML, malformed JSON and HTTP errors are denied',async()=>{
  await assert.rejects(readBoundedSourcePages({endpoint,headers,fetchImpl:async()=>mock([],200,'text/html')}),{code:'SOURCE_RESPONSE_INVALID'});
  await assert.rejects(readBoundedSourcePages({endpoint,headers,fetchImpl:async()=>mock({id:1})}),{code:'SOURCE_RESPONSE_INVALID'});
  await assert.rejects(readBoundedSourcePages({endpoint,headers,fetchImpl:async()=>mock([],500)}),{code:'SOURCE_READ_NETWORK_ERROR'});
});
test('timeout and network failure redact sensitive provider exception text',async()=>{
  await assert.rejects(readBoundedSourcePages({endpoint,headers,fetchImpl:async()=>{const e=new Error('SECRET');e.name='AbortError';throw e;}}),{code:'SOURCE_READ_TIMEOUT'});
  await assert.rejects(readBoundedSourcePages({endpoint,headers,fetchImpl:async()=>{throw new Error('SECRET');}}),{code:'SOURCE_READ_NETWORK_ERROR'});
  assert.equal(classifyPageReadError(new Error('SECRET')),'SOURCE_READ_NETWORK_ERROR');
});
test('invalid array size and malformed rows are rejected',async()=>{
  await assert.rejects(readBoundedSourcePages({endpoint,headers,pageSize:1,fetchImpl:async()=>mock([{id:1},{id:2}])}),{code:'SOURCE_RESPONSE_INVALID'});
  await assert.rejects(readBoundedSourcePages({endpoint,headers,fetchImpl:async()=>mock([null])}),{code:'SOURCE_RESPONSE_INVALID'});
});
