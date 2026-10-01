import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Hero() {
  return (
    <section className="relative gradient-navy overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, hsl(38,80%,55%) 0%, transparent 40%), radial-gradient(circle at 80% 75%, hsl(220,45%,28%) 0%, transparent 45%)",
        }}
      />
      <div className="relative px-4 py-14 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs sm:text-sm px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Distressed Property Investment Platform
          </div>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3">
            Find <span className="text-gold italic">Deep-Discount</span>
            <br /> Distressed Real Estate
          </h1>
          <p className="text-white/85 text-base sm:text-lg font-light mb-6 max-w-2xl mx-auto">
            Foreclosures, short sales, REOs, auctions, and probate deals — each analyzed with ARV, repair costs, the 70% rule, and projected ROI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => base44.auth.redirectToLogin("/portal")}
              className="bg-gold text-primary px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity duration-150 flex items-center justify-center gap-2"
            >
              Enter Investor Portal <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => base44.auth.redirectToLogin("/portal/browse")}
              className="bg-white/10 backdrop-blur border border-white/30 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Browse Deals
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}