import { Shield, Zap, Headphones, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const REASONS = [
  {
    icon: Shield,
    title: "Trusted Expertise",
    desc: "25 years of market knowledge, backed by an award-winning team of certified real estate professionals.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "Fast & Seamless",
    desc: "From search to keys in hand — our streamlined process makes buying, renting, or selling effortless.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Headphones,
    title: "24/7 Concierge",
    desc: "Dedicated advisors available around the clock, providing white-glove service at every stage.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    desc: "Proprietary data insights and real-time analytics to help you make the best investment decisions.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-gold font-body font-semibold text-sm uppercase tracking-widest mb-3">Why PrestigeHomes</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-5 leading-tight">
            Where Exceptional Service
            <br />
            <span className="italic text-primary/70">Meets Extraordinary Homes</span>
          </h2>
          <p className="text-muted-foreground font-body text-[15px] leading-relaxed mb-8">
            We don't just list properties — we curate life-changing experiences. Our approach combines deep local expertise with cutting-edge technology to connect you with your perfect home.
          </p>
          <button className="px-6 py-3 gradient-navy text-white text-sm font-body font-semibold rounded-xl hover:opacity-90 transition-opacity duration-150">
            Learn Our Story
          </button>
        </motion.div>

        {/* Right: feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REASONS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 card-hover"
            >
              <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center mb-3`}>
                <r.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5">{r.title}</h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}