/**
 * One bounded local work pass. Invoked by an existing authorized X1/Railway
 * execution path, never starts a new daemon or autonomous interval.
 */
import { executeLocal } from './handlers.mjs';
export function runOne(ledger,{tenantId,missionId,workerId='property-local-safe'}={}){
  const work=ledger.claim(tenantId,missionId,workerId);
  if(!work)return {state:'IDLE',processed:0};
  if(work.state==='WAITING_PROVIDER')
    return {id:work.id,profileId:work.profile_id,state:'WAITING_PROVIDER',processed:0,detail:'Verified provider adapter or human authority is missing; no external action taken'};
  try{
    const output=executeLocal(work.profile_id,work.payload,{tenantId,missionId,asOf:new Date().toISOString()});
    if(output.status==='WAITING_PROVIDER')
      return {id:work.id,...ledger.fail(tenantId,missionId,work.id,workerId,'UNVERIFIED_ADAPTER'),processed:0};
    return {id:work.id,profileId:work.profile_id,processed:1,
      outputStatus:output.status,
      ...ledger.complete(tenantId,missionId,work.id,workerId,output),
      note:'LOCAL_DETERMINISTIC_ONLY; no provider calls, contract, email, SMS or voice executed'};
  }catch(e){
    return {id:work.id,processed:0,...ledger.fail(tenantId,missionId,work.id,workerId,String(e?.message||'LOCAL_ERROR').slice(0,160)),
      note:'Failed closed; no external action'};
  }
}