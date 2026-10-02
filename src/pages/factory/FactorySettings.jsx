import { useState, useEffect } from "react";
import { Settings, CheckCircle, AlertCircle, Loader, RefreshCw, Factory } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MODULES, MODULE_GROUPS, builtModules, queuedModules } from "@/lib/factoryModules";

export default function FactorySettings() {
  const [registryCount, setRegistryCount] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const built = builtModules();
  const queued = queuedModules();

  useEffect(() => {
    base44.entities.RegistryEntry.count().then(setRegistryCount).catch(() => setRegistryCount(0));
  }, []);

  async function seedRegistry() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await base44.functions.invoke("seedRegistry", {});
      setSeedResult(res);
      setRegistryCount(await base44.entities.RegistryEntry.count());
    } catch (e) {
      setSeedResult({ error: e.message });
    }
    setSeeding(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Factory configuration, health, and build progress</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm">AI Gateway</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vercel Gateway Key</span>
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Configured</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base44 Integration Credits</span>
            <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><AlertCircle className="w-3.5 h-3.5" /> Exhausted</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Routing</span>
            <span className="text-xs text-foreground">All AI → Vercel Gateway (credit-free)</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm">Registry Data</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Registry Entries</span>
            <span className="text-foreground font-medium">{registryCount ?? "…"}</span>
          </div>
          <button onClick={seedRegistry} disabled={seeding} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
            {seeding ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {seeding ? "Seeding…" : "Re-seed Registry (486 entries)"}
          </button>
          {seedResult && (
            <div className={`text-xs rounded p-2 ${seedResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {seedResult.error ? seedResult.error : `Seeded ${seedResult.created ?? 0} entries`}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Factory className="w-4 h-4 text-gold" />
          <h2 className="font-display font-semibold text-foreground text-sm">Module Build Progress</h2>
          <span className="ml-auto text-xs text-muted-foreground">{built.length}/{built.length + queued.length} built</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div className="gradient-gold h-2 rounded-full transition-all" style={{ width: `${(built.length / (built.length + queued.length)) * 100}%` }} />
        </div>
        <div className="space-y-3">
          {MODULE_GROUPS.map((group) => (
            <div key={group}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">{group}</div>
              <div className="flex flex-wrap gap-1.5">
                {MODULES.filter((m) => m.group === group).map((m) => (
                  <span key={m.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.built ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                    {m.built ? "✓" : "●"} {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}