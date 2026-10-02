import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { Menu, Factory, ArrowLeft } from "lucide-react";
import FactorySidebar from "./FactorySidebar";
import { builtModules, queuedModules } from "@/lib/factoryModules";

export default function FactoryLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const built = builtModules().length;
  const total = built + queuedModules().length;

  return (
    <div className="min-h-screen bg-background flex">
      <FactorySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-gold" />
              <span className="font-display font-bold text-foreground hidden sm:inline">Universal Master Factory</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{built}/{total} built</span>
            <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> <span className="hidden sm:inline">DistressDeals</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}