import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Heart, FileText, DollarSign, ArrowRight, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DistressedPropertyCard from "@/components/property/DistressedPropertyCard";
import { formatCurrency } from "@/lib/investment";

export default function InvestorDashboard() {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({ totalDeals: 0, avgRoi: 0, totalEquity: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [feat, wl, off, all] = await Promise.all([
          base44.entities.Property.filter({ featured: true, status: "Active" }, { sort: "-listed_date", limit: 8 }),
          base44.entities.Watchlist.filter({}, { limit: 100 }),
          base44.entities.Offer.filter({}, { sort: "-created_date", limit: 5 }),
          base44.entities.Property.filter({ status: "Active" }, { limit: 500 }),
        ]);
        setFeatured(feat.items || feat);
        setWatchlistCount((wl.items || wl).length);
        setOffers(off.items || off);
        const items = all.items || all;
        const avgRoi = items.length ? Math.round(items.reduce((s, p) => s + (p.projected_roi || 0), 0) / items.length) : 0;
        const totalEquity = items.reduce((s, p) => s + ((p.arv || 0) - (p.asking_price || 0)), 0);
        setStats({ totalDeals: items.length, avgRoi, totalEquity });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Active Deals", value: stats.totalDeals, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Watchlist", value: watchlistCount, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "My Offers", value: offers.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Avg ROI", value: `${stats.avgRoi}%`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Investor Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Distressed deals, your pipeline, and portfolio at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 md:p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Total equity banner */}
      <div className="gradient-navy rounded-2xl p-5 md:p-6 mb-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-white/60 text-xs uppercase tracking-widest mb-1">Total Equity Available (Active Deals)</div>
            <div className="font-display text-3xl md:text-4xl font-bold">{formatCurrency(stats.totalEquity)}</div>
          </div>
          <Link to="/portal/browse" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-full text-sm font-medium transition-colors duration-150">
            Browse Deals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Featured deals */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Featured Deals</h2>
        <Link to="/portal/browse" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {featured.map((p, i) => (
          <DistressedPropertyCard key={p.id} property={p} index={i} onClick={() => window.location.assign(`/portal/property/${p.id}`)} />
        ))}
      </div>

      {/* Recent offers */}
      {offers.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="font-display text-xl font-semibold text-foreground">Recent Offers</h2>
            <Link to="/portal/offers" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              All offers <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {offers.map(o => (
              <div key={o.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{o.property_title}</div>
                  <div className="text-xs text-muted-foreground truncate">{o.property_address}</div>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{formatCurrency(o.amount)}</div>
                    <div className="text-xs text-muted-foreground">{o.status}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    o.status === "Accepted" ? "bg-emerald-100 text-emerald-700" :
                    o.status === "Rejected" ? "bg-rose-100 text-rose-700" :
                    o.status === "Counter-Offered" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}