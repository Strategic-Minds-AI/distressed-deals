import test from "node:test";
import assert from "node:assert/strict";
import {evaluateCommunication,classifyInboundText,DECISIONS} from "../communications/policy.mjs";
const approved={
  channel:"sms",direction:"outbound",purpose:"preapproved_followup",
  tenantId:"test-company",senderTenantId:"test-company",contactId:"test-contact",propertyId:"test-property",
  senderId:"test-sender",senderVerified:true,providerVerified:true,receiptCapabilityVerified:true,
  suppressed:false,dnc:false,stopReceived:false,frequencyCapExceeded:false,dailyBudgetExceeded:false,
  quietHours:false,requestedContentRevision:"sha-one",approvedContentRevision:"sha-one",
  emailUnsubscribeSupported:true,messagingRegistrationVerified:true,
  aiIdentityDisclosure:true,humanTransferAvailable:true,channelSpecificConsentEvidence:"fixture-optin-123",
  recipientPermissionVerified:true,outboundCampaignApproved:true,idempotencyKey:"test-company:123:1"
};
test("fully evidenced previously approved followup can proceed to provider gate, not send",()=>{
 assert.equal(evaluateCommunication(approved).decision,DECISIONS.READY_FOR_APPROVED_PROVIDER);
});
test("new outreach without approved campaign stays draft only",()=>{
 assert.equal(evaluateCommunication({...approved,purpose:"new_outreach",outboundCampaignApproved:false}).decision,DECISIONS.DRAFT_ONLY);
});
test("unverified AI call consent stays draft only",()=>{
 assert.equal(evaluateCommunication({...approved,channel:"voice",channelSpecificConsentEvidence:null}).decision,DECISIONS.DRAFT_ONLY);
});
test("missing A2P/toll-free registration blocks automatic SMS",()=>{
 assert.equal(evaluateCommunication({...approved,messagingRegistrationVerified:false}).decision,DECISIONS.DRAFT_ONLY);
});
test("STOP / DNC / tenant mismatch deny even when every other gate passes",()=>{
 for(const update of [{stopReceived:true},{dnc:true},{senderTenantId:"other-company"}])
  assert.equal(evaluateCommunication({...approved,...update}).decision,DECISIONS.DENY);
});
test("revision mismatch, wrong or missing identity, missing receipts hold delivery",()=>{
 for(const update of [{requestedContentRevision:"changed"},{senderVerified:false},{providerVerified:false},{receiptCapabilityVerified:false}])
  assert.equal(evaluateCommunication({...approved,...update}).decision,DECISIONS.DRAFT_ONLY);
});
test("no inferred consent from unverified incoming message",()=>{
 assert.equal(evaluateCommunication({...approved,purpose:"inbound_reply",direction:"inbound",verifiedInboundEventId:null}).decision,DECISIONS.DRAFT_ONLY);
});
test("quiet hours and budget ceiling hold texts",()=>{
 for(const update of [{quietHours:true},{dailyBudgetExceeded:true}])
  assert.equal(evaluateCommunication({...approved,...update}).decision,DECISIONS.DRAFT_ONLY);
});
test("opt out recognized; unrelated messages not marked STOP",()=>{
 for(const text of ["STOP","  unsubscribe ","Opt-out"])assert.equal(classifyInboundText(text),"OPT_OUT");
 assert.equal(classifyInboundText("Is the property still available?"),"GENERAL_INBOUND");
});
