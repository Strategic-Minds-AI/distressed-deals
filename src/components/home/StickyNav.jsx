import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StickyNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled ? "glass shadow-md py-3" : "py-5 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <span
          className={`font-display font-bold text-xl transition-colors duration-300 ${
            scrolled ? "text-primary" : "text-white drop-shadow"
          }`}
        >
          DistressDeals
        </span>
        <button
          onClick={() => base44.auth.redirectToLogin("/portal")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150 flex items-center gap-1.5 ${
            scrolled
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white text-primary hover:bg-white/90"
          }`}
        >
          Investor Login <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}