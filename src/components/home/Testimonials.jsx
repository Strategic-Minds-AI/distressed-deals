import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Flip Investor, Atlanta",
    text: "Closed 3 deals in my first quarter using DistressDeals. The 70% rule calculator alone saved me from overpaying on a REO.",
  },
  {
    name: "Priya K.",
    role: "Buy & Hold, Phoenix",
    text: "The live deal feed means I never miss a listing. Found a short sale at 62% ARV before it hit the MLS.",
  },
  {
    name: "James R.",
    role: "Wholesaler, Dallas",
    text: "Submitting offers directly through the portal cut my turnaround time in half. The investment metrics are spot on.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">Investor Stories</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Trusted by Thousands of Investors
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 relative"
            >
              <Quote className="w-8 h-8 text-gold/30 absolute top-4 right-4" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="w-10 h-10 rounded-full gradient-navy flex items-center justify-center text-white font-display font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}