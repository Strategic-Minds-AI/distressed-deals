import { ShieldCheck, Award, Map, Clock } from "lucide-react";

const SIGNALS = [
  { icon: ShieldCheck, label: "100% Verified Listings" },
  { icon: Award, label: "$2.4B+ Deal Volume" },
  { icon: Map, label: "50 States Covered" },
  { icon: Clock, label: "Updated Live" },
];

export default function TrustBar() {
  return (
    <section className="bg-primary border-t border-white/10 py-3">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/75">
        {SIGNALS.map((s) => {
          const Icon = s.icon;
          return (
            <span key={s.label} className="flex items-center gap-1.5">
              <Icon className="w-4 h-4 text-gold" /> {s.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}