import { useState, useEffect, useMemo } from "react";
import { Search, Boxes, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { REGISTRY_FAMILIES, familyLabel } from "@/lib/factoryHelpers";

export default function CapabilityRegistry() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("all");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(null);

  useEffect(() => { load(); }, [search, family]);

  async function load() {
    setLoading(true);
    try {
      const query = {};
      if (family !== "all") query.family = family;
      if (search.trim()) query.search_text = { $regex: search.trim().toLowerCase(), $options: "i" };
      const p = await base44.entities.RegistryEntry.filter(query, { sort: "family", limit: 100 });
      setPage(p);
      setEntries(p.items || []);
    } catch { /* admin only */ }
    setLoading(false);
  }

  const familyCounts = useMemo(() => {
    const counts = {};
    entries.forEach((e) => { counts[e.family] = (counts[e.family] || 0) + 1; });
    return counts;
  }, [entries]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Capability Registry</h1>
        <p className="text-sm text-muted-foreground">486 versioned entries across 30 registry families — the factory's reusable control-plane</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries…" className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-card" />
        </div>
        <select value={family} onChange={(e) => setFamily(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-card">
          <option value="all">All Families</option>
          {REGISTRY_FAMILIES.map((f) => <option key={f} value={f}>{familyLabel(f)}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Boxes className="w-3.5 h-3.5" />
        <span>{loading ? "Loading…" : `${entries.length} entries`}</span>
        {page?.has_more && <span className="text-amber-600">— more available</span>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
            {entries.length === 0 && !loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No entries found</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Family</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} onClick={() => setSelected(e)} className={`border-t border-border cursor-pointer hover:bg-muted/30 ${selected?.id === e.id ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{e.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{e.entry_id}</div>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground">{familyLabel(e.family)}</td>
                      <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground text-sm">{selected.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">{selected.entry_id}</p>
                </div>
                <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-1.5 text-xs">
                <div><span className="text-muted-foreground">Family:</span> <span className="text-foreground">{familyLabel(selected.family)}</span></div>
                <div><span className="text-muted-foreground">Version:</span> <span className="text-foreground">{selected.version}</span></div>
                <div><span className="text-muted-foreground">Scope:</span> <span className="text-foreground">{selected.scope}</span></div>
                <div><span className="text-muted-foreground">Risk:</span> <span className="text-foreground">{selected.risk_class}</span></div>
                <div><span className="text-muted-foreground">Approval required:</span> <span className="text-foreground">{selected.approval_required_for_live_effect ? "Yes" : "No"}</span></div>
              </div>
              {selected.purpose && <p className="text-xs text-foreground bg-muted/30 rounded-lg p-2">{selected.purpose}</p>}
              {selected.notes && <p className="text-[11px] text-muted-foreground italic">{selected.notes}</p>}
            </div>
          ) : (
            <div className="text-center py-8">
              <Boxes className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Select an entry to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}