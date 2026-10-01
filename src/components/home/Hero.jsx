import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HeroSearchBar from "@/components/home/HeroSearchBar";

const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85",
    title: "Discover Your",
    highlight: "Dream Home",
    subtitle: "Premium properties curated for the discerning buyer",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=85",
    title: "Luxury Living",
    highlight: "Redefined",
    subtitle: "Where architecture meets artistry in every residence",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85",
    title: "Invest in",
    highlight: "Extraordinary",
    subtitle: "Exceptional properties for exceptional individuals",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % HERO_SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = HERO_SLIDES[current];

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section className="relative w-full h-[92vh] min-h-[600px] overflow-hidden">
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
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            fetchPriority={current === 0 ? "high" : "auto"}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
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
            className="text-center mb-10 max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm px-4 py-1.5 rounded-full mb-6 font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block animate-pulse" />
              Premium Real Estate
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
              {slide.title}{" "}
              <span className="text-gold italic">{slide.highlight}</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl font-body font-light">
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
          className="flex flex-wrap justify-center gap-8 mt-10"
        >
          {[
            { label: "Properties", value: "2,400+" },
            { label: "Happy Clients", value: "18,500+" },
            { label: "Cities", value: "48" },
          ].map((s) => (
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
        {HERO_SLIDES.map((_, i) => (
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