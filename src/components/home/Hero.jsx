import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SmartImage from "@/components/common/SmartImage";
import housesBg from "@/assets/houses-skyline.svg";

export default function Hero() {
  return (
    <section className="relative h-[460px] sm:h-[540px] overflow-hidden gradient-navy">
      <SmartImage
        src={housesBg}
        alt="Distressed property neighborhood"
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/55 to-primary/85" />

      <div className="relative h-full flex flex-col items-center justify-between px-4 py-12 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs sm:text-sm px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Distressed Property Investment Platform
          </div>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3">
            Find <span className="text-gold italic">Deep-Discount</span>
            <br /> Distressed Real Estate
          </h1>
          <p className="text-white/85 text-base sm:text-lg font-light max-w-2xl mx-auto">
            Foreclosures, short sales, REOs, auctions, and probate deals — each analyzed with ARV, repair costs, the 70% rule, and projected ROI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md sm:max-w-none"
        >
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
        </motion.div>
      </div>
    </section>
  );
}