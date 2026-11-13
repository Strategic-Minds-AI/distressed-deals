#!/usr/bin/env node
// Import a local, non-PII metadata snapshot exported by an authorized source.
// Never fetches sources or contacts anyone. Caller sets DEALOPS_STATE_DB.
import {readFileSync,statSync} from 'node:fs';
import {openLedger} from './ledger.mjs';
import {auditSourceSnapshot} from './source-audit.mjs';
const file=process.argv[2];
if(!file||statSync(file).size>200000)throw Error('INVALID_LOCAL_SNAPSHOT_FILE');
const input=JSON.parse(readFileSync(file,'utf8'));
const db=openLedger();
try{
 const result=auditSourceSnapshot(db,{tenantId:'strategic-minds-ai',missionId:'property-deal-os:broward-pilot:v1',...input});
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}finally{db.close();}
