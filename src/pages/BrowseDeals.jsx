import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DistressedPropertyCard from "@/components/property/DistressedPropertyCard";
import SwipeableRow from "@/components/property/SwipeableRow";

const CATEGORIES = ["All", "Pre-Foreclosure", "Foreclosure", "Short Sale", "Bank-Owned (REO)", "Auction", "Tax Lien", "Probate", "Distressed Sale"];
const SORTS = [
  { label: "Newest", value: "-listed_date" },
  { label: "Price: Low → High", value: "asking_price" },
  { label: "Price: High → Low", value: "-asking_price" },
  { label: "Highest ROI", value: "-projected_roi" },
  { label: "Highest Equity", value: "-equity_percent" },
];

export default function BrowseDeals() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("-listed_date");
  const [search, setSearch] = useState("");
  const [minRoi, setMinRoi] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const query = { status: "Active" };
      if (category !== "All") query.category = category;
      if (search.trim()) query.title = { $regex: search.trim(), $options: "i" };
      if (minRoi > 0) query.projected_roi = { $gte: minRoi };
      const res = await base44.entities.Property.filter(query, { sort, limit: 100 });
      setProperties(res.items || res);
      setLoading(false);
    }
    load();
  }, [category, sort, search, minRoi]);

  const rows = useMemo(() => {
    if (category !== "All") return [{ label: category, items: properties }];
    const groups = {};
    properties.forEach(p => { (groups[p.category] ||= []).push(p); });
    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }, [properties, category]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Browse Distressed Deals</h1>
        <p className="text-muted-foreground text-sm mt-1">{properties.length} active opportunities with full investment metrics.</p>
      </div>

      {/* Search + sort */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2.5 bg-card text-foreground outline-none cursor-pointer"
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-150"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
              category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Min ROI:</span>
            <div className="flex gap-1">
              {[0, 25, 50, 75, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setMinRoi(n)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
                    minRoi === n ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted-foreground/20"
                  }`}
                >
                  {n === 0 ? "Any" : `${n}%+`}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setMinRoi(0); setCategory("All"); setSearch(""); setSort("-listed_date"); }}
            className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors duration-150"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <div className="text-5xl mb-3">🏚️</div>
          <p className="font-display text-lg font-semibold text-foreground">No deals match your filters</p>
        </div>
      ) : (
        <div className="space-y-8">
          {rows.map(row => (
            <div key={row.label}>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">
                {row.label} <span className="text-sm font-normal text-muted-foreground">({row.items.length})</span>
              </h2>
              <SwipeableRow itemClassName="w-[300px] sm:w-[340px]">
                {row.items.map((p, i) => (
                  <DistressedPropertyCard
                    key={p.id}
                    property={p}
                    index={i}
                    onClick={() => window.location.assign(`/portal/property/${p.id}`)}
                  />
                ))}
              </SwipeableRow>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}