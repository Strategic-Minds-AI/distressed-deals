/**
 * Deterministic, offline, non-contact agents. All real outreach, banking,
 * property-site access and title checks remain provider/approval gated.
 */
import { getProfile } from './catalog.mjs';
import { calculateStrategy } from '../strategies/underwrite.mjs';
import { classifyInboundText, evaluateCommunication } from '../communications/policy.mjs';
const words=x=>String(x??'').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const validMoney=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
const finiteDate=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const MINUTE=60000;
function fingerprint(p){
  const county=words(p.county), state=words(p.state), apn=words(p.apn),
    street=words(p.address),city=words(p.city),zip=words(p.zip),unit=words(p.unit);
  if(apn&&county&&state)return {key:'PARCEL:'+state+':'+county+':'+apn,confidence:'high',basis:'parcel+county+state'};
  if(street&&city&&state&&zip&&street.length>=6)return {key:'ADDRESS:'+street+':'+unit+':'+city+':'+state+':'+zip,confidence:'medium',basis:'complete_address'};
  return {key:null,confidence:'none',basis:'insufficient_qualified_identity'};
}
function match(a,b) {
  const pa=fingerprint(a),pb=fingerprint(b);
  if(!pa.key||!pb.key)return {matched:false,reviewRequired:true,reason:'INSUFFICIENT_IDENTITY'};
  if(pa.key.startsWith('PARCEL:')&&pb.key.startsWith('PARCEL:'))
    return {matched:pa.key===pb.key,reviewRequired:false,reason:pa.key===pb.key?'MATCH_SAME_PARCEL':'DIFFERENT_PARCEL'};
  const aa=words(a.address),ba=words(b.address);
  const same=aa&&aa===ba&&words(a.city)===words(b.city)&&words(a.state)===words(b.state)&&words(a.zip)===words(b.zip)&&words(a.unit)===words(b.unit);
  return {matched:!!same,reviewRequired:!same,reason:same?'MATCH_FULL_ADDRESS':'DIFFERENT_OR_AMBIGUOUS_ADDRESS'};
}
function freshness(verifiedAt,asOf) {
  if(!finiteDate(verifiedAt)||!finiteDate(asOf))return {verified:false,reason:'MISSING_SOURCE_TIMESTAMP'};
  const ageDays=(Date.parse(asOf)-Date.parse(verifiedAt))/(24*60*MINUTE);
  if(ageDays<0)return {verified:false,reason:'FUTURE_VERIFICATION',ageDays};
  if(ageDays>30)return {verified:false,reason:'STALE_SOURCE',ageDays};
  return {verified:true,reason:'RECENT_SOURCE_DATE_ONLY',ageDays};
}
function buyerFit(property,buyers=[],context={}) {
  // Deterministic, offline research match, not permission to contact a buyer.
  // tenantId comes from the local ledger runner, never from an investor-supplied payload.
  const hold=(reason)=>({status:'HOLD_FOR_REVIEW',reason,buyerMatches:[],reviewRequired:true,
    notVerifiedAsCashBuyers:true,sendAllowed:false});
  if(!property||!Array.isArray(buyers)||buyers.length>200) return hold('INVALID_BUYER_INPUT');
  const tenant=context?.tenantId;
  if(typeof tenant!=='string'||!tenant.trim()||property.tenantId!==tenant)
    return hold('TENANT_CONTEXT_UNVERIFIED');
  const asOf=typeof context.asOf==='string' ? Date.parse(context.asOf):Date.now();
  const recent=(date,maxDays)=>{
    const t=typeof date==='string'?Date.parse(date):NaN;
    return Number.isFinite(asOf)&&Number.isFinite(t)&&t<=asOf&&asOf-t<=maxDays*86400000;
  };
  if(words(property.state)!=='FL'||words(property.county)!=='BROWARD'||
     typeof property.parcelId!=='string'||!property.parcelId.trim())
    return hold('BROWARD_PARCEL_UNVERIFIED');
  if(property.sourceUseAuthorized!==true||
     typeof property.rightsEvidenceId!=='string'||property.rightsEvidenceId.trim().length<6||
     typeof property.sourceUrl!=='string'||!/^https:\/\//i.test(property.sourceUrl)||
     !recent(property.verifiedAt,30))
    return hold('SOURCE_EVIDENCE_UNVERIFIED');
  const market=words(property.market),type=words(property.type),price=property.estimatedPrice;
  if(!market||!type||!validMoney(price)||price<=0)
    return hold('PROPERTY_BUY_BOX_FIELDS_MISSING');
  const matched=new Map();
  for(const buyer of buyers) {
    if(!buyer||typeof buyer.id!=='string'||!buyer.id.trim()||
       buyer.tenantId!==tenant||buyer.buyBoxVerified!==true||
       !recent(buyer.buyBoxVerifiedAt,90)||
       words(buyer.market)!==market||
       !Array.isArray(buyer.types)||!buyer.types.some(t=>words(t)===type)||
       !validMoney(buyer.maxPurchasePrice)||buyer.maxPurchasePrice<=0||
       (buyer.minPurchasePrice!==undefined&&!validMoney(buyer.minPurchasePrice)))continue;
    const min=buyer.minPurchasePrice??0;
    if(min>buyer.maxPurchasePrice||price<min||price>buyer.maxPurchasePrice)continue;
    matched.set(buyer.id,{buyerProfileId:buyer.id,match:'BUY_BOX_ONLY',
      fundingVerified:false,identityVerified:false,contactAuthorized:false});
  }
  return {status:'SCREENING_ONLY',buyerMatches:[...matched.values()].sort((a,b)=>
    a.buyerProfileId.localeCompare(b.buyerProfileId)),reviewRequired:true,
    notVerifiedAsCashBuyers:true,sendAllowed:false,
    note:'Buyer criteria are unconfirmed self-attestations; independent identity, funding, consent, rights and agent review required'};
}
export function executeLocal(profileId,payload={},context={}) {
  const profile=getProfile(profileId);
  if(!profile)throw Error('UNKNOWN_PROFILE');
  if(profile.executor!=='DETERMINISTIC_LOCAL')return {status:'WAITING_PROVIDER',reason:'No tested authorized adapter',profileId};
  const id=profile.roleId;
  if(id==='data.parcel-normalizer') {
    const p=fingerprint(payload);
    return {status:p.key?'SCREENING_ONLY':'HOLD_FOR_REVIEW',identity:p,sourceVerified:false};
  }
  if(id==='data.record-merge-guard')return {status:'SCREENING_ONLY',...match(payload.left||{},payload.right||{})};
  if(id==='data.data-freshness-monitor')return {status:'SCREENING_ONLY',...freshness(payload.verifiedAt,payload.asOf)};
  const strategy={
    'underwriting.wholesale-assignment-screen':'contract_flip',
    'underwriting.dscr-screen':'rental_dscr',
    'underwriting.brrrr-screen':'brrrr',
    'underwriting.seller-financing-screen':'seller_finance',
    'underwriting.noi-cap-rate-screen':'multifamily_cap'
  }[id];
  if(strategy)return {status:'SCREENING_ONLY',strategy,...calculateStrategy({strategy,metrics:payload.metrics||{}})};
  if(id==='acquisition.buyer-buy-box-matcher')
    return buyerFit(payload.property,payload.buyers,context);
  if(id==='acquisition.for-you-feed-ranker') {
    if(!Array.isArray(payload.properties)||payload.properties.length>500)throw Error('INVALID_FEED');
    const items=payload.properties.filter(p=>p&&p.sourceUseAuthorized===true&&freshness(p.verifiedAt,payload.asOf).verified)
      .filter(p=>typeof p.propertyId==='string'&&p.propertyId.length>0)
      .sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0))
      .slice(0,25).map(p=>({propertyId:p.propertyId,score:Number(p.score)||0,reviewRequired:true}));
    return {status:'SCREENING_ONLY',items,sourceFreshnessEnforced:true,notOffers:true};
  }
  if(id==='communications.opt-out-and-dnc-guard') {
    const classification=classifyInboundText(payload.text||'');
    const rule=payload.policy?evaluateCommunication(payload.policy):null;
    return {status:'SCREENING_ONLY',classification,sendAllowed:false,policyDecision:rule?.decision||'NOT_EVALUATED',reasons:rule?.reasons||[]};
  }
  if(id==='enablement.source-rights-auditor') {
    const ok=typeof payload.sourceUrl==='string'&&payload.sourceUrl.startsWith('https://')&&
      payload.useAuthorized===true&&typeof payload.rightsEvidenceId==='string'&&payload.rightsEvidenceId.length>=5;
    return {status:ok?'SOURCE_PERMISSION_REVIEW_ONLY':'HOLD_FOR_REVIEW',hasRightsEvidence:ok,needsManualLicenseCheck:true};
  }
  return {status:'WAITING_PROVIDER',reason:'No tested adapter',profileId};
}