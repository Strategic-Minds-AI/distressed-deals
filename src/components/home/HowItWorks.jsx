import { motion } from "framer-motion";
import { Search, Calculator, FileSignature } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Browse Deals",
    desc: "Filter foreclosures, REOs, short sales, auctions, and probate by location, price, and ROI.",
  },
  {
    icon: Calculator,
    title: "Analyze the Numbers",
    desc: "Every listing includes ARV, repair costs, the 70% rule max offer, projected profit, and ROI.",
  },
  {
    icon: FileSignature,
    title: "Make an Offer",
    desc: "Submit cash or financed offers directly, track status, and manage your pipeline in one place.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">How It Works</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            From Discovery to Offer in Three Steps
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-card rounded-2xl border border-border p-6"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-gold flex items-center justify-center font-display font-bold text-primary text-sm">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl gradient-navy flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}