import { useState } from "react";
import { Heart, Bed, Bath, Square, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function formatPrice(price, type, rentPeriod) {
  if (type === "rent") {
    return `$${price.toLocaleString()}/${rentPeriod || "mo"}`;
  }
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${price.toLocaleString()}`;
}

const TAG_COLORS = {
  "New": "bg-emerald-100 text-emerald-700",
  "Featured": "bg-blue-100 text-blue-700",
  "Luxury": "bg-purple-100 text-purple-700",
  "New Listing": "bg-amber-100 text-amber-700",
  "Premium": "bg-rose-100 text-rose-700",
  "New Build": "bg-emerald-100 text-emerald-700",
  "Historic": "bg-amber-100 text-amber-700",
  "Ski-in/Ski-out": "bg-blue-100 text-blue-700",
  "Ultra Luxury": "bg-purple-100 text-purple-700",
  "Just Listed": "bg-rose-100 text-rose-700",
  "Waterfront": "bg-blue-100 text-blue-700",
  "Ocean View": "bg-blue-100 text-blue-700",
  "Lake View": "bg-blue-100 text-blue-700",
  "Art District": "bg-purple-100 text-purple-700",
  "Furnished": "bg-amber-100 text-amber-700",
  "Trophy": "bg-purple-100 text-purple-700",
  "Iconic Location": "bg-rose-100 text-rose-700",
};

const TYPE_BADGE = {
  buy: "bg-navy text-white",
  rent: "bg-gold text-white",
  sell: "bg-emerald-600 text-white",
};

export default function PropertyCard({ property, onClick, index = 0, favorites, onToggleFavorite }) {
  const [imgIdx, setImgIdx] = useState(0);
  const isFav = favorites?.includes(property.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      className="card-hover bg-card rounded-2xl overflow-hidden shadow-md border border-border group cursor-pointer w-full"
      onClick={() => onClick(property)}
    >
      {/* Image area */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={property.images[imgIdx]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[80%]">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE[property.type]}`}>
            {property.type === "buy" ? "For Sale" : property.type === "rent" ? "For Rent" : "Selling"}
          </span>
          {property.tags.slice(0, 1).map(tag => (
            <span key={tag} className={`text-xs font-medium px-2.5 py-1 rounded-full ${TAG_COLORS[tag] || "bg-gray-100 text-gray-700"}`}>
              {tag}
            </span>
          ))}
        </div>

        {/* Favorite button */}
        <button
          className="absolute top-3 right-3 p-2 rounded-full glass transition-colors duration-150 hover:bg-white/90"
          onClick={e => { e.stopPropagation(); onToggleFavorite?.(property.id); }}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-150 ${isFav ? "fill-rose-500 text-rose-500" : "text-gray-600"}`}
          />
        </button>

        {/* Image dots */}
        {property.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {property.images.slice(0, 4).map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === imgIdx ? "active" : ""}`}
                onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom: price */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-display font-bold text-xl drop-shadow">
            {formatPrice(property.price, property.type, property.rentPeriod)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-lg text-foreground leading-tight line-clamp-1">
            {property.title}
          </h3>
          <span className="text-xs font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
            {property.category}
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4" />
            <span className="font-medium text-foreground">{property.beds}</span>
            <span>bd</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4" />
            <span className="font-medium text-foreground">{property.baths}</span>
            <span>ba</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square className="w-4 h-4" />
            <span className="font-medium text-foreground">{property.sqft.toLocaleString()}</span>
            <span>ft²</span>
          </div>
          <div className="ml-auto">
            <button className="p-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-80 transition-opacity duration-150" aria-label="View property">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}