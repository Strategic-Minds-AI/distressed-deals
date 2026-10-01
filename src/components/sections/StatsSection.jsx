import { Building2, Users, Map, Award } from "lucide-react";
import { motion } from "framer-motion";

const STATS = [
  { label: "Properties Listed", value: "2,400+", icon: Building2, color: "text-blue-500" },
  { label: "Happy Clients", value: "18,500+", icon: Users, color: "text-gold" },
  { label: "Cities Covered", value: "48", icon: Map, color: "text-emerald-500" },
  { label: "Years of Excellence", value: "25+", icon: Award, color: "text-purple-500" },
];

export default function StatsSection() {
  return (
    <section className="py-16 px-4 bg-muted/40">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 text-center card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="font-display text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm font-body text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}