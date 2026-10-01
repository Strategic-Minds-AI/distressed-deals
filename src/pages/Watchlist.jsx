import { useState, useEffect } from "react";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DistressedPropertyCard from "@/components/property/DistressedPropertyCard";
import { formatCurrency } from "@/lib/investment";

export default function Watchlist() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  async function load() {
    setLoading(true);
    const res = await base44.entities.Watchlist.filter({}, { sort: "-created_date", limit: 100 });
    setItems(res.items || res);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await base44.entities.Watchlist.delete(id);
    load();
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalEquity = items.reduce((s, w) => s + (w.asking_price ? 0 : 0), 0); // placeholder; full metrics on detail

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My Watchlist</h1>
        <p className="text-muted-foreground text-sm mt-1">{items.length} saved {items.length === 1 ? "deal" : "deals"}.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="font-display text-lg font-semibold text-foreground">Your watchlist is empty</p>
          <p className="text-sm mt-1">Tap the heart on any deal to save it here.</p>
          <a href="/portal/browse" className="inline-flex items-center gap-2 mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity duration-150">
            Browse Deals <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(w => (
            <div key={w.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display font-semibold text-foreground leading-tight line-clamp-1">{w.property_title}</h3>
                  <button onClick={() => remove(w.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors duration-150" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3 truncate">{w.property_address}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{w.asking_price ? formatCurrency(w.asking_price) : "—"}</span>
                  <a href={`/portal/property/${w.property_id}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                {w.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border italic">"{w.notes}"</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}