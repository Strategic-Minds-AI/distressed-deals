import { useState } from "react";
import { Search, MapPin, Home, DollarSign, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const TYPES = ["All", "Buy", "Rent", "Sell"];

export default function SearchBar({ onSearch, compact = false }) {
  const [activeType, setActiveType] = useState("All");
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch?.({
      query,
      type: activeType === "All" ? null : activeType.toLowerCase(),
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
    });
  };

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-2xl">
      {/* Type tabs */}
      <div className="flex border-b border-white/20">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`flex-1 py-3 text-sm font-semibold font-body transition-colors duration-150 ${
              activeType === t
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main search row */}
      <div className="flex flex-col sm:flex-row items-stretch gap-0">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 border-b sm:border-b-0 sm:border-r border-white/20">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="City, neighborhood, or address…"
            className="w-full bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-150 border-b sm:border-b-0 sm:border-r border-white/20"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-6 py-3 gradient-navy text-white text-sm font-semibold font-body hover:opacity-90 transition-opacity duration-150"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="border-t border-white/20 px-4 py-3 flex flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-28 bg-transparent text-sm outline-none font-body"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-28 bg-transparent text-sm outline-none font-body"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}