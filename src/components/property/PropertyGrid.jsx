import { useState, useMemo } from "react";
import { Filter, Grid3X3, LayoutList, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PROPERTIES } from "../../data/properties";
import PropertyCard from "./PropertyCard";

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

    // Apply search filters from hero
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

    // Category filter
    if (category !== "All") list = list.filter(p => p.category === category);

    // Beds filter
    if (beds > 0) list = list.filter(p => p.beds >= beds);

    // Sort
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "sqft_desc") list.sort((a, b) => b.sqft - a.sqft);
    else list.sort((a, b) => b.id - a.id);

    return list;
  }, [filters, category, sort, beds]);

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
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

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-muted-foreground"
          >
            <div className="text-6xl mb-4">🏠</div>
            <p className="font-display text-xl font-semibold text-foreground">No properties found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((property, i) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={onSelectProperty}
                index={i}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}