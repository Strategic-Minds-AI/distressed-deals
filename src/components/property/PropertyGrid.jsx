import { useState, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PROPERTIES } from "../../data/properties";
import PropertyCard from "./PropertyCard";
import SwipeableRow from "./SwipeableRow";

const CATEGORIES = ["All", "Penthouse", "Villa", "Loft", "Condo", "Estate", "Townhouse", "Chalet", "House", "Apartment"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Largest First", value: "sqft_desc" },
];

export default function PropertyGrid({ filters, onSelectProperty, favorites, onToggleFavorite }) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [beds, setBeds] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...PROPERTIES];

    if (filters?.type) list = list.filter(p => p.type === filters.type);
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (filters?.minPrice) list = list.filter(p => p.price >= filters.minPrice);
    if (filters?.maxPrice) list = list.filter(p => p.price <= filters.maxPrice);

    if (category !== "All") list = list.filter(p => p.category === category);
    if (beds > 0) list = list.filter(p => p.beds >= beds);

    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "sqft_desc") list.sort((a, b) => b.sqft - a.sqft);
    else list.sort((a, b) => b.id - a.id);

    return list;
  }, [filters, category, sort, beds]);

  // Group into several rows by category
  const rows = useMemo(() => {
    if (category !== "All") {
      return [{ label: category, items: filtered }];
    }
    const groups = {};
    filtered.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    // Keep a stable, curated order
    const order = CATEGORIES.filter(c => c !== "All" && groups[c]?.length);
    return order.map(label => ({ label, items: groups[label] }));
  }, [filtered, category]);

  return (
    <section className="py-14 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-gold font-body font-semibold text-sm uppercase tracking-widest mb-2">Browse</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            All Properties
            <span className="ml-3 text-xl font-body font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm font-body border border-border rounded-lg px-3 py-2 bg-card text-foreground outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-body hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-150"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors duration-150 ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-body text-muted-foreground">Min Beds:</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setBeds(n)}
                      className={`w-8 h-8 rounded-full text-sm font-body font-medium transition-colors duration-150 ${
                        beds === n ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted-foreground/20"
                      }`}
                    >
                      {n === 0 ? "All" : n + "+"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setCategory("All"); setBeds(0); setSort("newest"); setShowFilters(false); }}
                className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors duration-150"
              >
                <X className="w-4 h-4" /> Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <div className="text-6xl mb-4">🏠</div>
          <p className="font-display text-xl font-semibold text-foreground">No properties found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-10">
          {rows.map(row => (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                  {row.label}
                  <span className="ml-2 text-sm font-body font-normal text-muted-foreground">({row.items.length})</span>
                </h3>
                <span className="text-xs font-body text-muted-foreground hidden sm:block">
                  Swipe to explore →
                </span>
              </div>
              <SwipeableRow itemClassName="w-[280px] sm:w-[340px]">
                {row.items.map((property, i) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onClick={onSelectProperty}
                    index={i}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </SwipeableRow>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}