import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2, TrendingUp, DollarSign, ArrowRight,
  AlertTriangle, Calculator, Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import DistressedPropertyCard from "@/components/property/DistressedPropertyCard";
import { formatCurrency } from "@/lib/investment";
import StickyNav from "@/components/home/StickyNav";
import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import DealTicker from "@/components/home/DealTicker";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({ deals: 0, avgRoi: 0, equity: 0, investors: 18500 });

  useEffect(() => {
    async function load() {
      try {
        const [feat, all] = await Promise.all([
          base44.entities.Property.filter({ featured: true, status: "Active" }, { sort: "-listed_date", limit: 4 }),
          base44.entities.Property.filter({ status: "Active" }, { limit: 500 }),
        ]);
        setFeatured(feat.items || feat);
        const items = all.items || all;
        const avgRoi = items.length ? Math.round(items.reduce((s, p) => s + (p.projected_roi || 0), 0) / items.length) : 0;
        const equity = items.reduce((s, p) => s + ((p.arv || 0) - (p.asking_price || 0)), 0);
        setStats({ deals: items.length, avgRoi, equity, investors: 18500 });
      } catch {
        // app may require auth; landing still renders
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <StickyNav />
      <Hero />
      <TrustBar />
      <DealTicker />

      {/* Stats */}
      <section className="bg-primary text-white py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Active Deals", value: stats.deals, icon: TrendingUp },
            { label: "Avg. Projected ROI", value: `${stats.avgRoi}%`, icon: DollarSign },
            { label: "Total Equity Available", value: formatCurrency(stats.equity), icon: Calculator },
            { label: "Investors Served", value: stats.investors.toLocaleString(), icon: Users },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-gold" />
                <div className="font-display text-2xl md:text-3xl font-bold">{s.value}</div>
                <div className="text-white/60 text-xs mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured deals */}
      {featured.length > 0 && (
        <section className="py-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">Handpicked</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Featured Distressed Deals</h2>
            </div>
            <Link to="/portal/browse" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((p, i) => (
              <DistressedPropertyCard key={p.id} property={p} index={i} onClick={() => window.location.assign(`/portal/property/${p.id}`)} />
            ))}
          </div>
        </section>
      )}

      <HowItWorks />

      {/* Value props */}
      <section className="py-14 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">Built for Real Estate Investors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Calculator, title: "Deal Analysis Built-In", desc: "Every listing shows ARV, repair estimates, the 70% rule max offer, projected profit, and ROI — no spreadsheets required." },
              { icon: AlertTriangle, title: "Every Distress Type", desc: "Pre-foreclosures, REOs, short sales, tax liens, auctions, and probate — sourced and verified before listing." },
              { icon: Building2, title: "Make Offers Directly", desc: "Submit cash or financed offers through the portal, track status, and manage your entire pipeline in one place." },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-card rounded-2xl border border-border p-6">
                  <div className="w-12 h-12 rounded-xl gradient-navy flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Testimonials />

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto gradient-navy rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Ready to find your next deal?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Join thousands of investors sourcing distressed properties with full investment metrics.</p>
          <button onClick={() => base44.auth.redirectToLogin("/portal")} className="inline-flex items-center gap-2 bg-gold text-primary px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity duration-150">
            Enter the Portal <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white/60 py-8 px-4 text-center text-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-gold" />
            <span className="font-display font-bold text-white">DistressDeals</span>
          </div>
          <p>© 2026 DistressDeals. Distressed property investment platform.</p>
        </div>
      </footer>
    </div>
  );
}