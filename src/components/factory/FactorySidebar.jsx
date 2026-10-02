import { Link, useLocation } from "react-router-dom";
import {
  X, Factory, Circle, LayoutDashboard, FolderKanban, ShieldCheck, Terminal, ScrollText,
  Boxes, LayoutTemplate, Cog, Package, Plug, Workflow, Scale, CheckCircle, BadgeCheck,
  CloudUpload, Server, Rocket, DollarSign, Monitor, Brain, Building, KeyRound, Code,
  Database, RefreshCw, Move, FlaskConical, Wrench, Activity, Archive, BookOpen,
  MessageSquare, BarChart, Search, Smartphone, ShoppingCart, Users, HeartHandshake,
  FileText, Globe, Shield, FolderSearch, Gauge, Settings,
} from "lucide-react";
import { MODULES, MODULE_GROUPS } from "@/lib/factoryModules";

const ICONS = {
  LayoutDashboard, FolderKanban, ShieldCheck, Terminal, ScrollText, Boxes, LayoutTemplate,
  Cog, Package, Plug, Workflow, Scale, CheckCircle, BadgeCheck, CloudUpload, Server,
  Rocket, DollarSign, Monitor, Brain, Building, KeyRound, Code, Database, RefreshCw,
  Move, FlaskConical, Wrench, Activity, Archive, BookOpen, MessageSquare, BarChart,
  Search, Smartphone, ShoppingCart, Users, HeartHandshake, FileText, Globe, Shield,
  FolderSearch, Gauge, Settings,
};

export default function FactorySidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-primary text-white z-50 transform transition-transform duration-200 overflow-y-auto scrollbar-hide flex-shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
              <Factory className="w-4 h-4 text-primary" />
            </span>
            <span className="font-display font-bold text-sm">UMF Cockpit</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="px-2 py-3">
          {MODULE_GROUPS.map((group) => (
            <div key={group} className="mb-3">
              <div className="text-[9px] uppercase tracking-widest text-white/30 px-3 mb-0.5 font-body font-semibold">{group}</div>
              {MODULES.filter((m) => m.group === group).map((m) => {
                const Icon = ICONS[m.icon] ?? Circle;
                const active = location.pathname === m.path;
                const cls = `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  active ? "bg-white/10 text-gold font-medium" : m.built ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-white/25 cursor-not-allowed"
                }`;
                return m.built ? (
                  <Link key={m.id} to={m.path} onClick={onClose} className={cls}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{m.name}</span>
                  </Link>
                ) : (
                  <div key={m.id} className={cls}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{m.name}</span>
                    <span className="ml-auto text-[8px] text-white/20">●</span>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}