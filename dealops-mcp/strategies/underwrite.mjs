/**
 * Property Deal OS: deterministic, source-agnostic strategy screening.
 * No external calls, licensing decisions, automatic bids, deal offers or financing approval.
 * Product marketing claims must never enter the numerical model as verified facts.
 */
export const DEAL_TYPES = Object.freeze([
  'on_market', 'motivated_seller', 'government_seized', 'bank_reo',
  'tax_deed', 'sheriff_sale', 'probate', 'commercial_multifamily'
]);
export const STRATEGIES = Object.freeze([
  'contract_flip', 'brrrr', 'rental_dscr', 'seller_finance', 'multifamily_cap'
]);

const ALWAYS_REVIEW = Object.freeze(['ownership_and_authority', 'title_and_liens', 'property_condition', 'source_rights', 'brokerage_or_principal_role']);
const AUCTION_REVIEW = Object.freeze(['auction_rules_and_deposit', 'redemption_and_post_sale_risk', 'occupancy_and_possession', 'taxes_and_other_encumbrances']);
const TYPE_REVIEWS = {
  government_seized: [...AUCTION_REVIEW, 'actual_disposition_authority'],
  tax_deed: [...AUCTION_REVIEW],
  sheriff_sale: [...AUCTION_REVIEW],
  bank_reo: ['bank_authority_to_sell', 'as_is_terms'],
  probate: ['personal_representative_authority', 'court_approval_if_required'],
  commercial_multifamily: ['rent_roll', 'operating_statements', 'zoning_and_units'],
  motivated_seller: ['seller_authority_and_noncoercion'],
  on_market: ['listing_use_rights']
};
const isFiniteNumber = v => typeof v === 'number' && Number.isFinite(v);
const validMoney = v => isFiniteNumber(v) && v >= 0;
const money = value => Math.round((value + Number.EPSILON) * 100) / 100;
const rate = value => isFiniteNumber(value) && value >= 0 && value <= 1;
function missingMoney(values) { return Object.entries(values).filter(([,value]) => !validMoney(value)).map(([key]) => key); }
function invalid(reason, missing = []) { return { status: 'INVALID_INPUT', errors: [reason], missing, metrics: null, reviewRequired: true }; }

export function calculateStrategy(input = {}) {
  const strategy = input.strategy;
  if (!STRATEGIES.includes(strategy)) return invalid('Unsupported strategy');
  const m = input.metrics || {};
  if (strategy === 'contract_flip') {
    const missing = missingMoney({ contractPrice:m.contractPrice, endBuyerPrice:m.endBuyerPrice, transactionCosts:m.transactionCosts });
    if (missing.length) return invalid('Missing or invalid contract-flip inputs', missing);
    const grossSpread = money(m.endBuyerPrice - m.contractPrice);
    const illustrativeNetBeforeTaxes = money(grossSpread - m.transactionCosts);
    return { status:'SCREENING_ONLY', metrics:{grossSpread, illustrativeNetBeforeTaxes}, reviewRequired:true,
      disclosures:['Not an assignment fee offer or guaranteed profit', 'Verify assignability, earnest money, title, closing, brokerage status and buyer funding'] };
  }
  if (strategy === 'rental_dscr') {
    const missing = missingMoney({ annualGrossRent:m.annualGrossRent, annualVacancyLoss:m.annualVacancyLoss, annualOperatingExpenses:m.annualOperatingExpenses, annualDebtService:m.annualDebtService });
    if (missing.length || m.annualDebtService === 0 || m.annualVacancyLoss > m.annualGrossRent) return invalid('Missing or invalid rental inputs', missing);
    const noi = money(m.annualGrossRent - m.annualVacancyLoss - m.annualOperatingExpenses);
    const dscr = Math.round((noi / m.annualDebtService) * 1000) / 1000;
    return { status:'SCREENING_ONLY', metrics:{noi,dscr}, reviewRequired:true,
      disclosures:['DSCR is an estimate, not financing eligibility', 'Lender underwriting and debt-service definition may differ'] };
  }
  if (strategy === 'brrrr') {
    const missing = missingMoney({purchasePrice:m.purchasePrice, rehabBudget:m.rehabBudget, initialClosingCosts:m.initialClosingCosts, holdingCosts:m.holdingCosts, arv:m.arv, existingDebtPayoff:m.existingDebtPayoff, refinanceCosts:m.refinanceCosts});
    if (missing.length || !rate(m.refinanceLtv)) return invalid('Missing or invalid BRRRR inputs', [...missing, ...(!rate(m.refinanceLtv)?['refinanceLtv']:[])]);
    const estimatedNewLoan = money(m.arv * m.refinanceLtv);
    const estimatedCashOut = money(estimatedNewLoan - m.existingDebtPayoff - m.refinanceCosts);
    const projectCost = money(m.purchasePrice + m.rehabBudget + m.initialClosingCosts + m.holdingCosts);
    return { status:'SCREENING_ONLY', metrics:{estimatedNewLoan, estimatedCashOut, projectCost}, reviewRequired:true,
      disclosures:['Cash-out estimate can be negative', 'Subject to appraisal, seasoning rules, lender underwriting, debt payoff and reserve requirements']};
  }
  if (strategy === 'seller_finance') {
    const missing = missingMoney({price:m.price, downPayment:m.downPayment, annualInterestRate:m.annualInterestRate});
    if (missing.length || m.downPayment > m.price || !isFiniteNumber(m.months) || !Number.isInteger(m.months) || m.months <= 0 || m.months > 600 || m.annualInterestRate > 1) return invalid('Invalid seller-finance terms', missing);
    const principal = m.price - m.downPayment, r = m.annualInterestRate / 12, n = m.months;
    const monthlyPayment = principal === 0 ? 0 : r === 0 ? principal / n : principal * (r / (1 - Math.pow(1+r,-n)));
    return { status:'SCREENING_ONLY', metrics:{principal:money(principal),monthlyPayment:money(monthlyPayment)}, reviewRequired:true,
      disclosures:['Does not assess balloon clauses, usury, ability-to-repay, licensing or legal enforceability']};
  }
  const missing = missingMoney({annualNoi:m.annualNoi});
  if (missing.length || !isFiniteNumber(m.capRate) || m.capRate <= 0 || m.capRate >= 1) return invalid('Invalid cap-rate valuation inputs', [...missing, ...(!isFiniteNumber(m.capRate)||m.capRate<=0||m.capRate>=1 ? ['capRate']:[])]);
  return { status:'SCREENING_ONLY', metrics:{indicatedValue:money(m.annualNoi / m.capRate)}, reviewRequired:true,
    disclosures:['Income approach is a screening estimate, not an appraisal', 'Review rent roll, NOI normalization, taxes, deferred capital expenses and local market caps'] };
}

export function screenOpportunity(input = {}) {
  const errors = [];
  if (!DEAL_TYPES.includes(input.dealType)) errors.push('INVALID_DEAL_TYPE');
  if (typeof input.propertyId !== 'string' || !input.propertyId.trim()) errors.push('PROPERTY_ID_REQUIRED');
  if (typeof input.sourceUrl !== 'string' || !/^https:\/\//i.test(input.sourceUrl)) errors.push('SOURCE_URL_REQUIRED');
  if (!input.sourceUseAuthorized) errors.push('SOURCE_USE_NOT_AUTHORIZED');
  if (!input.jurisdictionVerified) errors.push('JURISDICTION_UNVERIFIED');
  const verifiedAt = typeof input.verifiedAt === 'string' ? Date.parse(input.verifiedAt) : NaN;
  const now = typeof input.asOf === 'string' ? Date.parse(input.asOf) : Date.now();
  if (!Number.isFinite(verifiedAt) || !Number.isFinite(now) || verifiedAt > now || now - verifiedAt > 30*86400000) errors.push('STALE_OR_MISSING_VERIFICATION');
  const review = [...ALWAYS_REVIEW, ...(TYPE_REVIEWS[input.dealType] || [])];
  const math = calculateStrategy({strategy:input.strategy, metrics:input.metrics});
  if (math.status !== 'SCREENING_ONLY') errors.push('UNDERWRITING_INCOMPLETE');
  return { status:errors.length?'HOLD_FOR_REVIEW':'SCREENING_ONLY', automatedOfferAllowed:false, automatedAuctionBidAllowed:false,
    source:input.sourceUrl||null, propertyId:input.propertyId||null, dealType:input.dealType||null,
    errors, reviewChecklist:[...new Set(review)], strategyResult:math,
    note:'Source and calculation screening only; no independent title, licensing, appraisal, seller or lender verification' };
}
