import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency } from "@/lib/investment";
import SmartImage from "@/components/common/SmartImage";

export default function DealTicker() {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await base44.entities.Property.filter(
          { status: "Active" },
          { sort: "-listed_date", limit: 12 }
        );
        setDeals(res.items || res);
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  if (deals.length === 0) return null;
  const loop = [...deals, ...deals];

  return (
    <section className="py-8 overflow-hidden border-y border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 mb-3">
        <p className="text-gold font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Live Deal Feed
        </p>
      </div>
      <div className="relative">
        <div className="flex gap-3 marquee">
          {loop.map((p, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[220px] rounded-xl border border-border bg-card overflow-hidden card-hover"
            >
              <div className="relative h-28 bg-muted">
                <SmartImage
                  src={p.images?.[0]}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-gold text-primary">
                  {p.projected_roi}% ROI
                </span>
              </div>
              <div className="p-3">
                <div className="font-medium text-sm text-foreground truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" />
                  {p.city}, {p.state}
                </div>
                <div className="text-sm font-bold text-emerald-600 mt-1">
                  {formatCurrency(p.asking_price)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}