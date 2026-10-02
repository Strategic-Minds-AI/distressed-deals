import { useState, useEffect } from "react";
import { FolderSearch, FileCode, ShieldCheck, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VALIDATION_COLOR = {
  not_validated: "bg-slate-100 text-slate-600",
  validating: "bg-blue-100 text-blue-700",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  blocked: "bg-amber-100 text-amber-700",
};

export default function ArtifactExplorer() {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const page = await base44.entities.Artifact.filter({}, { sort: "-created_date", limit: 50 });
      setArtifacts(page.items || []);
    } catch { /* admin only */ }
    setLoading(false);
  }

  const filtered = filter === "all" ? artifacts : artifacts.filter((a) => a.validation_state === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Artifact Explorer</h1>
        <p className="text-sm text-muted-foreground">Every generated artifact with SHA-256, dependencies, and validation state</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["all", "not_validated", "validating", "passed", "failed", "blocked"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <FolderSearch className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No artifacts yet. Run a generator to produce lineage-tracked outputs.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{a.filename}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{a.artifact_id}</div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${VALIDATION_COLOR[a.validation_state] ?? "bg-slate-100 text-slate-600"}`}>
                  {a.validation_state?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span>{a.media_type}</span>
                {a.size_bytes && <span>{(a.size_bytes / 1024).toFixed(1)} KB</span>}
                {a.sha256 && <span className="font-mono truncate">SHA: {a.sha256.slice(0, 12)}…</span>}
                {a.frozen && <span className="text-blue-600 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> frozen</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}