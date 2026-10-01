import { useState, useEffect } from "react";
import { FileText, ArrowRight, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency } from "@/lib/investment";

const STATUS_COLORS = {
  "Submitted": "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  "Counter-Offered": "bg-purple-100 text-purple-700",
  "Accepted": "bg-emerald-100 text-emerald-700",
  "Rejected": "bg-rose-100 text-rose-700",
  "Withdrawn": "bg-slate-200 text-slate-600",
};

export default function MyOffers() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);

  async function load() {
    setLoading(true);
    const res = await base44.entities.Offer.filter({}, { sort: "-created_date", limit: 100 });
    setOffers(res.items || res);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const withdraw = async (id) => {
    await base44.entities.Offer.update(id, { status: "Withdrawn" });
    load();
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalActive = offers.filter(o => ["Submitted", "Under Review", "Counter-Offered"].includes(o.status)).length;
  const totalAmount = offers.filter(o => o.status !== "Withdrawn" && o.status !== "Rejected").reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My Offers</h1>
        <p className="text-muted-foreground text-sm mt-1">{totalActive} active · {formatCurrency(totalAmount)} in play</p>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="font-display text-lg font-semibold text-foreground">No offers yet</p>
          <p className="text-sm mt-1">Submit an offer on any deal to track it here.</p>
          <a href="/portal/browse" className="inline-flex items-center gap-2 mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity duration-150">
            Browse Deals <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(o => (
            <div key={o.id} className="bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-foreground truncate">{o.property_title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[o.status] || ""}`}>{o.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-2">{o.property_address}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Offer: <b className="text-foreground">{formatCurrency(o.amount)}</b></span>
                  <span>Type: <b className="text-foreground">{o.offer_type}</b></span>
                  {o.earnest_money > 0 && <span>EM: <b className="text-foreground">{formatCurrency(o.earnest_money)}</b></span>}
                  {o.closing_timeline_days > 0 && <span>Close: <b className="text-foreground">{o.closing_timeline_days}d</b></span>}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <a href={`/portal/property/${o.property_id}`} className="text-sm text-primary font-medium hover:underline">View deal</a>
                {["Submitted", "Under Review"].includes(o.status) && (
                  <button
                    onClick={() => withdraw(o.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors duration-150"
                  >
                    <X className="w-3.5 h-3.5" /> Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}