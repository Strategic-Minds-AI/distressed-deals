import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HeroSearchBar from "@/components/home/HeroSearchBar";
import housesBg from "@/assets/houses-skyline.svg";
import distressedBg from "@/assets/distressed-house.svg";
import duskBg from "@/assets/dusk-suburb.svg";

const SLIDES = [
  {
    id: 1,
    image: housesBg,
    title: "Find",
    highlight: "Deep-Discount",
    subtitle: "Foreclosures, short sales, REOs, auctions & probate — sourced and verified before listing.",
  },
  {
    id: 2,
    image: distressedBg,
    title: "Analyze",
    highlight: "Every Deal",
    subtitle: "ARV, repair costs, the 70% rule, and projected ROI on every single listing.",
  },
  {
    id: 3,
    image: duskBg,
    title: "Make Offers",
    highlight: "Directly",
    subtitle: "Submit cash or financed offers and manage your entire pipeline in one portal.",
  },
];

const STATS = [
  { label: "Active Deals", value: "2,400+" },
  { label: "Investors Served", value: "18,500+" },
  { label: "States Covered", value: "50" },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);
  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next]);

  const slide = SLIDES[current];
  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden">
      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img src={slide.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/55 via-primary/45 to-primary/85" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${slide.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8 max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs sm:text-sm px-4 py-1.5 rounded-full mb-5 font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block animate-pulse" />
              Distressed Property Investment Platform
            </div>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
              {slide.title} <span className="text-gold italic">{slide.highlight}</span>
            </h1>
            <p className="text-white/85 text-base sm:text-xl font-body font-light max-w-2xl mx-auto">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-3xl"
        >
          <HeroSearchBar />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-8 mt-8"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl font-bold text-white">{s.value}</div>
              <div className="text-white/60 text-xs font-body">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass-dark text-white hover:bg-white/20 transition-colors duration-150 z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass-dark text-white hover:bg-white/20 transition-colors duration-150 z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === current ? "active" : ""}`}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}