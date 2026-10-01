import { PROPERTIES } from "../../data/properties";
import PropertyCard from "./PropertyCard";
import SwipeableRow from "./SwipeableRow";

export default function FeaturedCarousel({ onSelectProperty, favorites, onToggleFavorite }) {
  const featured = PROPERTIES.filter(p => p.featured);

  return (
    <section className="py-14 px-4 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-gold font-body font-semibold text-sm uppercase tracking-widest mb-2">Handpicked</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Featured Properties
          </h2>
        </div>
        <span className="text-sm font-body text-muted-foreground hidden sm:block">
          Swipe to explore →
        </span>
      </div>

      <SwipeableRow itemClassName="w-[280px] sm:w-[340px]">
        {featured.map((property, i) => (
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
    </section>
  );
}