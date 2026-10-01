import { Star, Phone, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const AGENTS = [
  {
    name: "Alexandra Chen",
    title: "Senior Property Advisor",
    specialty: "Manhattan Luxury",
    deals: 142,
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
    phone: "+1 (212) 555-0142",
  },
  {
    name: "Marcus Rivera",
    title: "Luxury Property Specialist",
    specialty: "Coastal & Waterfront",
    deals: 98,
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    phone: "+1 (310) 555-0199",
  },
  {
    name: "Sofia Park",
    title: "Rental & Investment Advisor",
    specialty: "Urban Rentals",
    deals: 215,
    rating: 5.0,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    phone: "+1 (718) 555-0177",
  },
  {
    name: "James Whitfield",
    title: "Principal Advisor",
    specialty: "Historic Estates",
    deals: 167,
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80",
    phone: "+1 (617) 555-0118",
  },
];

export default function AgentsSection() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gold font-body font-semibold text-sm uppercase tracking-widest mb-2">Our Team</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Expert Advisors
          </h2>
          <p className="text-muted-foreground font-body mt-2 max-w-xl mx-auto text-sm">
            Industry-leading professionals dedicated to finding your perfect property.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl overflow-hidden card-hover group"
            >
              <div className="relative overflow-hidden h-52">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-body font-semibold text-sm">{agent.name}</div>
                      <div className="text-white/70 text-xs font-body">{agent.specialty}</div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-white text-xs font-body font-medium">{agent.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs text-muted-foreground font-body mb-1">{agent.title}</p>
                <p className="text-sm font-body font-medium text-foreground">{agent.deals} deals closed</p>

                <div className="flex gap-2 mt-3">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-body font-semibold hover:opacity-90 transition-opacity duration-150">
                    <Phone className="w-3 h-3" /> Call
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-body font-semibold hover:bg-muted/80 transition-colors duration-150">
                    <MessageSquare className="w-3 h-3" /> Message
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}