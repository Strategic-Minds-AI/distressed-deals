// Property Deal OS communications safety policy.
// Pure, side-effect-free evaluation. This never sends a message or places a call.
export const CHANNELS = Object.freeze(["email","sms","voice"]);
export const DECISIONS = Object.freeze({
  DENY:"DENY", DRAFT_ONLY:"DRAFT_ONLY", READY_FOR_APPROVED_PROVIDER:"READY_FOR_APPROVED_PROVIDER"
});
const isValue=(v)=>typeof v==="string"&&v.trim().length>0;
const isTime=(t)=>typeof t==="number"&&Number.isFinite(t)&&t>0;
export function evaluateCommunication(request={}) {
  const reasons=[];
  const channel=request.channel;
  if (!CHANNELS.includes(channel)) reasons.push("UNKNOWN_CHANNEL");
  if (!["inbound_reply","preapproved_followup","new_outreach"].includes(request.purpose)) reasons.push("PURPOSE_UNDEFINED");
  if (!["inbound","outbound"].includes(request.direction)) reasons.push("DIRECTION_UNDEFINED");
  if (!isValue(request.tenantId)||!isValue(request.contactId)||!isValue(request.propertyId)) reasons.push("MISSING_TENANT_CONTACT_OR_PROPERTY");
  if (!isValue(request.senderId)||!request.senderVerified) reasons.push("SENDER_NOT_VERIFIED");
  if (!request.providerVerified) reasons.push("PROVIDER_NOT_VERIFIED");
  if (!request.receiptCapabilityVerified) reasons.push("RECEIPTS_NOT_VERIFIED");
  if (request.suppressed || request.dnc || request.stopReceived) reasons.push("SUPPRESSED_CONTACT");
  if (request.frequencyCapExceeded || request.dailyBudgetExceeded) reasons.push("LIMIT_EXCEEDED");
  if (request.quietHours === true && channel !== "email") reasons.push("QUIET_HOURS");
  if (request.senderTenantId !== request.tenantId) reasons.push("WRONG_SENDER_TENANT");
  if (request.requestedContentRevision !== request.approvedContentRevision) reasons.push("CONTENT_REVISION_NOT_APPROVED");
  if (channel==="email" && !request.emailUnsubscribeSupported) reasons.push("NO_EMAIL_OPT_OUT");
  if (channel==="sms" && !request.messagingRegistrationVerified) reasons.push("MESSAGING_REGISTRATION_UNVERIFIED");
  if (channel==="voice" && (!request.aiIdentityDisclosure || !request.humanTransferAvailable)) reasons.push("VOICE_DISCLOSURE_OR_TRANSFER_UNVERIFIED");
  if ((channel==="sms"||channel==="voice") && !request.channelSpecificConsentEvidence) reasons.push("PHONE_CONSENT_NOT_VERIFIED");
  if (request.purpose==="inbound_reply" && !request.verifiedInboundEventId) reasons.push("INBOUND_EVENT_NOT_VERIFIED");
  if (request.direction==="inbound" && request.purpose!=="inbound_reply") reasons.push("INVALID_INBOUND_PURPOSE");
  if (request.purpose==="new_outreach" && !request.outboundCampaignApproved) reasons.push("CAMPAIGN_NOT_APPROVED");
  if (request.purpose!=="inbound_reply" && !request.recipientPermissionVerified) reasons.push("RECIPIENT_PERMISSION_NOT_VERIFIED");
  if (!request.idempotencyKey) reasons.push("NO_IDEMPOTENCY_KEY");
  // Hard denials: known suppression or tenant isolation are never overridden.
  const hard=["SUPPRESSED_CONTACT","WRONG_SENDER_TENANT","UNKNOWN_CHANNEL","DIRECTION_UNDEFINED","INVALID_INBOUND_PURPOSE"];
  if (reasons.some(x=>hard.includes(x))) return {decision:DECISIONS.DENY,reasons};
  return reasons.length
    ? {decision:DECISIONS.DRAFT_ONLY,reasons}
    : {decision:DECISIONS.READY_FOR_APPROVED_PROVIDER,reasons:[],notice:"Policy screening only; final provider identity, scope, cost and live authorization must be rechecked by the actual provider executor. This result does not send."};
}
export function classifyInboundText(text="") {
  const words=String(text).trim();
  if (/^(stop|unsubscribe|cancel|end|quit|opt out|opt-out)$/i.test(words)) return "OPT_OUT";
  if (/^(help|info)$/i.test(words)) return "HELP";
  return "GENERAL_INBOUND";
}
