#!/usr/bin/env node
/**
 * JARVIS local continuity CLI. No auto-scheduler and no production sends.
 * Commands: catalog | status tenant mission | work-one tenant mission
 *           | demo tenant mission
 */
import { openLedger } from './ledger.mjs';
import { summarizeCatalog } from './catalog.mjs';
import { runOne } from './runner.mjs';
const [command,tenantId='strategic-minds-ai',missionId='property-deal-os:broward-pilot:v1'] = process.argv.slice(2);
function print(x){process.stdout.write(JSON.stringify(x,null,2)+'\n');}
if(command==='catalog'){print(summarizeCatalog());process.exit(0);}
if(!['status','work-one','demo'].includes(command)) {
  process.stderr.write('Usage: node cli.mjs catalog|status|work-one|demo [tenantId] [missionId]\n');
  process.exit(2);
}
const db=openLedger();
try{
  if(command==='status')print(db.snapshot(tenantId,missionId));
  if(command==='work-one')print(runOne(db,{tenantId,missionId}));
  if(command==='demo'){
    db.checkpoint({tenantId,missionId,phase:'local_continuity_canary',state:'TESTED',refSha:'synthetic-only',details:{source:'synthetic',noExternalCalls:true}});
    const item=db.enqueue({tenantId,missionId,profileId:'underwriting.wholesale-assignment-screen@broward',
      idempotencyKey:'fixture:wholesale-calculator:v1',
      payload:{metrics:{contractPrice:150000,endBuyerPrice:170000,transactionCosts:5500}}});
    const run=runOne(db,{tenantId,missionId});
    print({fixture:'SYNTHETIC_ONLY',work:item,run,snapshot:db.snapshot(tenantId,missionId)});
  }
}finally{db.close();}
