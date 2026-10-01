import { useState } from "react";
import { Heart, Bed, Bath, Square, MapPin, TrendingUp, Wrench, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  formatCurrency,
  maxOffer70,
  CATEGORY_COLORS,
  STATUS_COLORS,
  CONDITION_COLORS,
} from "@/lib/investment";

export default function DistressedPropertyCard({ property, onClick, index = 0, isWatched, onToggleWatch }) {
  const [imgIdx, setImgIdx] = useState(0);
  const maxOffer = maxOffer70(property.arv, property.estimated_repair_cost);
  const profit = property.arv - property.asking_price - property.estimated_repair_cost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
      onClick={() => onClick(property)}
      className="card-hover bg-card rounded-2xl overflow-hidden shadow-md border border-border group cursor-pointer w-full flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={property.images?.[imgIdx] || property.images?.[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap max-w-[85%]">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[property.category] || "bg-slate-100 text-slate-700"}`}>
            {property.category}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[property.status] || ""}`}>
            {property.status}
          </span>
        </div>

        {onToggleWatch && (
          <button
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full glass transition-colors duration-150 hover:bg-white/90"
            onClick={e => { e.stopPropagation(); onToggleWatch(property); }}
            aria-label="Toggle watchlist"
          >
            <Heart className={`w-4 h-4 ${isWatched ? "fill-rose-500 text-rose-500" : "text-gray-600"}`} />
          </button>
        )}

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <span className="text-white font-display font-bold text-xl drop-shadow">
            {formatCurrency(property.asking_price)}
          </span>
          {property.auction_date && (
            <span className="bg-rose-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Auction
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-base text-foreground leading-tight line-clamp-1 mb-1">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{property.address}, {property.city}, {property.state}</span>
        </div>

        {/* Investment metrics grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Metric label="ARV" value={formatCurrency(property.arv)} />
          <Metric label="Repairs" value={formatCurrency(property.estimated_repair_cost)} icon={Wrench} />
          <Metric label="Max Offer (70%)" value={formatCurrency(maxOffer)} accent />
          <Metric label="Proj. Profit" value={formatCurrency(profit)} accent />
        </div>

        {/* ROI bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Projected ROI
            </span>
            <span className="font-semibold text-emerald-600">{property.projected_roi}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
              style={{ width: `${Math.min(property.projected_roi, 100)}%` }}
            />
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
          {property.beds > 0 && (
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.beds}</span>
          )}
          {property.baths > 0 && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.baths}</span>
          )}
          <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{property.sqft.toLocaleString()}</span>
          <span className={`ml-auto font-medium ${CONDITION_COLORS[property.condition_grade] || ""}`}>
            {property.condition_grade?.split(" - ")[0]}
          </span>
          <ArrowRight className="w-4 h-4 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, accent, icon: Icon }) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${accent ? "bg-emerald-50" : "bg-muted"}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-2.5 h-2.5" />}{label}
      </div>
      <div className={`text-sm font-bold ${accent ? "text-emerald-700" : "text-foreground"}`}>{value}</div>
    </div>
  );
}