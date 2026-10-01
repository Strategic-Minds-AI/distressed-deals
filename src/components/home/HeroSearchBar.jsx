import { useState } from "react";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["All", "Pre-Foreclosure", "REO", "Auction", "Short Sale"];

export default function HeroSearchBar() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  const go = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (active !== "All") params.set("cat", active);
    if (maxPrice) params.set("max", maxPrice);
    base44.auth.redirectToLogin(`/portal/browse${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex border-b border-white/20 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`flex-1 whitespace-nowrap py-3 px-4 text-xs sm:text-sm font-semibold font-body transition-colors duration-150 ${
              active === t ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-0">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 border-b sm:border-b-0 sm:border-r border-white/20">
          <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="City, state, or zip…"
            className="w-full bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-150 border-b sm:border-b-0 sm:border-r border-white/20"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={go}
            className="flex items-center gap-2 px-6 py-3 gradient-navy text-white text-sm font-semibold font-body hover:opacity-90 transition-opacity duration-150"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-white/20 px-4 py-3"
          >
            <div className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 w-44">
              <span className="text-xs text-muted-foreground font-body">Max $</span>
              <input
                type="number"
                placeholder="250000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-transparent text-sm outline-none font-body"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}