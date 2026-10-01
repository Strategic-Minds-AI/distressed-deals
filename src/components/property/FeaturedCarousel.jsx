import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { PROPERTIES } from "../../data/properties";
import PropertyCard from "./PropertyCard";

export default function FeaturedCarousel({ onSelectProperty, favorites, onToggleFavorite }) {
  const featured = PROPERTIES.filter(p => p.featured);
  const [startIdx, setStartIdx] = useState(0);
  const containerRef = useRef(null);

  const visibleCount = 3; // desktop shows 3, will be overridden by CSS

  const prev = () => setStartIdx(i => Math.max(0, i - 1));
  const next = () => setStartIdx(i => Math.min(featured.length - 1, i + 1));

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-gold font-body font-semibold text-sm uppercase tracking-widest mb-2">Handpicked</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Featured Properties
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prev}
            disabled={startIdx === 0}
            className="p-2.5 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-150 disabled:opacity-30"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            disabled={startIdx >= featured.length - 1}
            className="p-2.5 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-150 disabled:opacity-30"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={containerRef}>
        <motion.div
          animate={{ x: `-${startIdx * (100 / visibleCount)}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex gap-6"
          style={{ width: `${(featured.length / visibleCount) * 100}%` }}
        >
          {featured.map((property, i) => (
            <div
              key={property.id}
              style={{ width: `${100 / featured.length}%` }}
              className="flex-shrink-0"
            >
              <PropertyCard
                property={property}
                onClick={onSelectProperty}
                index={i}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="mt-6 h-1 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
        <motion.div
          animate={{ width: `${((startIdx + 1) / Math.max(featured.length - visibleCount + 1, 1)) * 100}%` }}
          transition={{ duration: 0.4 }}
          className="h-full gradient-gold rounded-full"
        />
      </div>
    </section>
  );
}