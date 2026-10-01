// Investment metric helpers for distressed properties

export function formatCurrency(n) {
  if (n == null) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function formatCurrencyFull(n) {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
;
}

// 70% rule: max offer = (ARV * 0.70) - repair cost
export function maxOffer70(arv, repairCost) {
  if (!arv) return 0;
  return Math.round((arv * 0.7) - (repairCost || 0));
}

// Estimated profit if bought at asking and sold at ARV after repairs
export function projectedProfit(arv, askingPrice, repairCost) {
  if (!arv) return 0;
  return Math.round(arv - (askingPrice || 0) - (repairCost || 0));
}

// ROI on cash invested (asking + repairs)
export function roiPercent(arv, askingPrice, repairCost) {
  const invested = (askingPrice || 0) + (repairCost || 0);
  if (invested <= 0) return 0;
  return Math.round(((arv - invested) / invested) * 100);
}

// Equity as % of ARV: (ARV - asking) / ARV
export function equityPercent(arv, askingPrice) {
  if (!arv || arv <= 0) return 0;
  return Math.round(((arv - (askingPrice || 0)) / arv) * 100);
}

export const CATEGORY_COLORS = {
  "Pre-Foreclosure": "bg-amber-100 text-amber-700",
  "Foreclosure": "bg-rose-100 text-rose-700",
  "Short Sale": "bg-blue-100 text-blue-700",
  "Bank-Owned (REO)": "bg-purple-100 text-purple-700",
  "Auction": "bg-orange-100 text-orange-700",
  "Tax Lien": "bg-red-100 text-red-700",
  "Probate": "bg-teal-100 text-teal-700",
  "Distressed Sale": "bg-slate-100 text-slate-700",
};

export const STATUS_COLORS = {
  "Active": "bg-emerald-100 text-emerald-700",
  "Under Contract": "bg-amber-100 text-amber-700",
  "Pending": "bg-blue-100 text-blue-700",
  "Sold": "bg-slate-200 text-slate-600",
  "Withdrawn": "bg-rose-100 text-rose-700",
};

export const CONDITION_COLORS = {
  "A - Excellent": "text-emerald-600",
  "B - Good": "text-emerald-500",
  "C - Fair": "text-amber-500",
  "D - Poor": "text-orange-500",
  "E - Tear-down": "text-rose-600",
};