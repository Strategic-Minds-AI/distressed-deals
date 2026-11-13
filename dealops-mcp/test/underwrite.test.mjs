import test from 'node:test';
import assert from 'node:assert/strict';
import {DEAL_TYPES, STRATEGIES, calculateStrategy, screenOpportunity} from '../strategies/underwrite.mjs';

test('supported markets and strategies explicitly enumerated',()=>{
 assert.ok(DEAL_TYPES.includes('government_seized'));
 assert.ok(DEAL_TYPES.includes('tax_deed'));
 assert.ok(STRATEGIES.includes('seller_finance'));
});
test('illustrative wholesaling spread, costs and negative spread',()=>{
 const p=calculateStrategy({strategy:'contract_flip',metrics:{contractPrice:150000,endBuyerPrice:160000,transactionCosts:1200}});
 assert.equal(p.metrics.grossSpread,10000);
 assert.equal(p.metrics.illustrativeNetBeforeTaxes,8800);
 assert.equal(p.reviewRequired,true);
 const n=calculateStrategy({strategy:'contract_flip',metrics:{contractPrice:170000,endBuyerPrice:160000,transactionCosts:0}});
 assert.equal(n.metrics.illustrativeNetBeforeTaxes,-10000);
});
test('invalid and missing values never silently turn into zero',()=>{
 const p=calculateStrategy({strategy:'contract_flip',metrics:{contractPrice:0,endBuyerPrice:undefined,transactionCosts:0}});
 assert.equal(p.status,'INVALID_INPUT');assert.ok(p.missing.includes('endBuyerPrice'));
 const n=calculateStrategy({strategy:'contract_flip',metrics:{contractPrice:-1,endBuyerPrice:100,transactionCosts:0}});
 assert.equal(n.status,'INVALID_INPUT');
});
test('rental DSCR uses lender review flag rather than guaranteed approval',()=>{
 const x=calculateStrategy({strategy:'rental_dscr',metrics:{annualGrossRent:36000,annualVacancyLoss:1800,annualOperatingExpenses:10200,annualDebtService:16000}});
 assert.equal(x.metrics.noi,24000);assert.equal(x.metrics.dscr,1.5);assert.equal(x.reviewRequired,true);
});
test('zero annual debt service cannot produce infinite DSCR',()=>{
 assert.equal(calculateStrategy({strategy:'rental_dscr',metrics:{annualGrossRent:100,annualVacancyLoss:0,annualOperatingExpenses:0,annualDebtService:0}}).status,'INVALID_INPUT');
});
test('BRRRR refinance cash-out can be negative and remains estimate',()=>{
 const x=calculateStrategy({strategy:'brrrr',metrics:{purchasePrice:150000,rehabBudget:30000,initialClosingCosts:4000,holdingCosts:5000,arv:210000,refinanceLtv:0.75,existingDebtPayoff:155000,refinanceCosts:6000}});
 assert.equal(x.metrics.estimatedNewLoan,157500);assert.equal(x.metrics.estimatedCashOut,-3500);assert.equal(x.metrics.projectCost,189000);
});
test('BRRRR percent over one fails closed',()=>{
 assert.equal(calculateStrategy({strategy:'brrrr',metrics:{purchasePrice:10,rehabBudget:0,initialClosingCosts:0,holdingCosts:0,arv:100,refinanceLtv:2,existingDebtPayoff:0,refinanceCosts:0}}).status,'INVALID_INPUT');
});
test('seller financing zero percent uses straight line amortization',()=>{
 const x=calculateStrategy({strategy:'seller_finance',metrics:{price:120000,downPayment:20000,annualInterestRate:0,months:100}});
 assert.equal(x.metrics.monthlyPayment,1000);
});
test('seller finance invalid negative and long terms blocked',()=>{
 assert.equal(calculateStrategy({strategy:'seller_finance',metrics:{price:120000,downPayment:20000,annualInterestRate:-0.01,months:100}}).status,'INVALID_INPUT');
 assert.equal(calculateStrategy({strategy:'seller_finance',metrics:{price:120000,downPayment:20000,annualInterestRate:0.05,months:900}}).status,'INVALID_INPUT');
});
test('multifamily income valuation is only a screening estimate',()=>{
 const x=calculateStrategy({strategy:'multifamily_cap',metrics:{annualNoi:100000,capRate:0.05}});
 assert.equal(x.metrics.indicatedValue,2000000);assert.equal(x.reviewRequired,true);
});
const baseline={propertyId:'fixture-001',dealType:'tax_deed',strategy:'contract_flip',sourceUrl:'https://example.gov/tax-deeds/fixture',sourceUseAuthorized:true,jurisdictionVerified:true,verifiedAt:'2026-11-01T00:00:00.000Z',asOf:'2026-11-12T00:00:00.000Z',metrics:{contractPrice:100000,endBuyerPrice:120000,transactionCosts:1000}};
test('tax deed cannot be auto bid or offered and requires redemption review',()=>{
 const r=screenOpportunity(baseline);assert.equal(r.status,'SCREENING_ONLY');assert.equal(r.automatedOfferAllowed,false);assert.equal(r.automatedAuctionBidAllowed,false);assert.ok(r.reviewChecklist.includes('redemption_and_post_sale_risk'));
});
test('unverified source is held, even when financial math works',()=>{
 const r=screenOpportunity({...baseline,sourceUseAuthorized:false});assert.equal(r.status,'HOLD_FOR_REVIEW');assert.ok(r.errors.includes('SOURCE_USE_NOT_AUTHORIZED'));
});
test('stale or future verified dates are held',()=>{
 for(const date of ['2026-09-01T00:00:00.000Z','2026-12-01T00:00:00.000Z']){
 const r=screenOpportunity({...baseline,verifiedAt:date});assert.equal(r.status,'HOLD_FOR_REVIEW');
 }
});
test('all categories retain no automatic offer/bid authority',()=>{
 for(const dealType of DEAL_TYPES){const r=screenOpportunity({...baseline,dealType});assert.equal(r.automatedOfferAllowed,false);assert.equal(r.automatedAuctionBidAllowed,false);}
});
