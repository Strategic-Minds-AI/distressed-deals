import { useState, useEffect } from "react";
import { Home, Heart, Menu, X, Phone, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ favoritesCount, onShowFavorites }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? "glass border-b border-white/20 shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-gold rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className={`font-display font-bold text-xl ${scrolled ? "text-foreground" : "text-white"}`}>
            Prestige<span className="text-gold">Homes</span>
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {["Buy", "Rent", "Sell", "New Developments", "Agents"].map(item => (
            <button
              key={item}
              className={`text-sm font-body font-medium transition-colors duration-150 ${
                scrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShowFavorites}
            className={`relative p-2.5 rounded-full transition-colors duration-150 ${
              scrolled ? "hover:bg-muted" : "hover:bg-white/10"
            }`}
            aria-label="Favorites"
          >
            <Heart className={`w-5 h-5 ${scrolled ? "text-foreground" : "text-white"}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </button>

          <button className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body font-semibold transition-all duration-150 ${
            scrolled
              ? "gradient-navy text-white hover:opacity-90"
              : "bg-white text-primary hover:bg-white/90"
          }`}>
            <Phone className="w-3.5 h-3.5" />
            Contact Us
          </button>

          <button
            className="md:hidden p-2 rounded-full"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Menu"
          >
            {mobileOpen
              ? <X className={`w-5 h-5 ${scrolled ? "text-foreground" : "text-white"}`} />
              : <Menu className={`w-5 h-5 ${scrolled ? "text-foreground" : "text-white"}`} />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/20 overflow-hidden"
          >
            <nav className="px-4 py-4 flex flex-col gap-1">
              {["Buy", "Rent", "Sell", "New Developments", "Agents"].map(item => (
                <button
                  key={item}
                  className="text-sm font-body font-medium text-foreground py-2.5 px-3 rounded-lg hover:bg-muted text-left transition-colors duration-150"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}