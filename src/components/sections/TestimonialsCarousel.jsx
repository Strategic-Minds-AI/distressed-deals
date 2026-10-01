import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TESTIMONIALS = [
  {
    id: 1,
    name: "William & Sarah Chen",
    role: "Purchased a Penthouse in Manhattan",
    avatar: "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=200&q=80",
    rating: 5,
    text: "PrestigeHomes made the impossible feel easy. Finding a trophy penthouse in Manhattan within our timeline seemed like a dream — they delivered flawlessly. Absolutely world-class service.",
  },
  {
    id: 2,
    name: "Isabella Moretti",
    role: "Rented a Luxury Loft in Brooklyn",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    rating: 5,
    text: "I was relocating from Milan and needed something extraordinary. Within 48 hours they had curated five incredible options. The Cobblestone Loft I now call home exceeded every expectation.",
  },
  {
    id: 3,
    name: "Jonathan Blackwell",
    role: "Sold an Estate in Greenwich",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
    rating: 5,
    text: "From professional staging photography to closing day, the entire selling process was seamless. They achieved 12% above our asking price in a challenging market. Simply outstanding.",
  },
  {
    id: 4,
    name: "Priya & Raj Patel",
    role: "Bought a Waterfront Home in Seattle",
    avatar: "https://images.unsplash.com/photo-1565884280295-98eb83e41c65?w=200&q=80",
    rating: 5,
    text: "We spent months searching on our own. PrestigeHomes found our dream lakeside home in two weeks. Their market knowledge is unparalleled, and the negotiation saved us $150K.",
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(c => (c + 1) % TESTIMONIALS.length), []);
  const prev = () => setCurrent(c => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  const t = TESTIMONIALS[current];

  return (
    <section className="py-20 bg-primary text-primary-foreground overflow-hidden">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-gold font-body font-semibold text-sm uppercase tracking-widest mb-3">Client Stories</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            What Our Clients Say
          </h2>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 sm:p-10 text-center"
            >
              <Quote className="w-10 h-10 text-gold mx-auto mb-6 opacity-60" />
              <p className="font-display text-lg sm:text-xl italic text-primary-foreground/90 leading-relaxed mb-8 max-w-3xl mx-auto">
                "{t.text}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gold"
                />
                <div className="text-left">
                  <div className="font-body font-semibold text-sm text-primary-foreground">{t.name}</div>
                  <div className="text-xs text-primary-foreground/50 font-body">{t.role}</div>
                </div>
                <div className="flex gap-0.5 ml-2">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 hidden sm:block" aria-label="Prev">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 hidden sm:block" aria-label="Next">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`carousel-dot ${i === current ? "active" : ""}`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}