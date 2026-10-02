import { useLocation, Link } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import { MODULES, MODULE_GROUPS } from "@/lib/factoryModules";

export default function QueuedModule() {
  const location = useLocation();
  const mod = MODULES.find((m) => m.path === location.pathname);

  if (!mod) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Unknown module path: {location.pathname}</p>
        <Link to="/factory" className="text-primary text-sm mt-2 inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Command Center
        </Link>
      </div>
    );
  }

  const groupModules = MODULES.filter((m) => m.group === mod.group && m.built);

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <Construction className="w-12 h-12 text-gold mx-auto mb-4" />
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Module {mod.id} — {mod.group}</div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">{mod.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This module is queued for build. It is part of the full 50-module Universal Master Factory
        and will be implemented in the next build batch.
      </p>
      <div className="bg-card border border-border rounded-xl p-4 text-left">
        <div className="text-xs font-medium text-foreground mb-2">Next steps in this group:</div>
        <div className="flex flex-wrap gap-1.5">
          {groupModules.length > 0 ? (
            groupModules.map((m) => (
              <Link key={m.id} to={m.path} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium hover:opacity-80">
                ✓ {m.name}
              </Link>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No modules built in this group yet.</span>
          )}
        </div>
      </div>
      <Link to="/factory" className="inline-flex items-center gap-1 text-primary text-sm mt-6">
        <ArrowLeft className="w-3 h-3" /> Back to Command Center
      </Link>
    </div>
  );
}