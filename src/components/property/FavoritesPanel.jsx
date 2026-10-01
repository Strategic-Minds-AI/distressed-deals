import { X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PROPERTIES } from "../../data/properties";
import PropertyCard from "./PropertyCard";

export default function FavoritesPanel({ favorites, onClose, onSelectProperty, onToggleFavorite }) {
  const favProperties = PROPERTIES.filter(p => favorites.includes(p.id));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-2xl overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 glass border-b border-border flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="font-display font-bold text-lg text-foreground">Saved Properties</h2>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-body">
                {favProperties.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors duration-150"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            {favProperties.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-display text-lg font-semibold text-foreground mb-1">No saved properties</p>
                <p className="text-sm text-muted-foreground font-body">Click the heart on any listing to save it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favProperties.map((p, i) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    onClick={prop => { onSelectProperty(prop); onClose(); }}
                    index={i}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}