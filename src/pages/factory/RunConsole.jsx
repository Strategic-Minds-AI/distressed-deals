import { useState, useEffect } from "react";
import { Terminal, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_ICON = {
  draft: Clock, validating_input: Loader, planning: Loader, waiting_approval: AlertCircle,
  queued: Clock, running: Loader, validating: Loader, repairing: Loader,
  passed: CheckCircle, failed: XCircle, blocked: AlertCircle, cancelled: XCircle, exported: CheckCircle,
};
const STATUS_COLOR = {
  running: "text-blue-600", passed: "text-green-600", failed: "text-red-600",
  blocked: "text-amber-600", waiting_approval: "text-amber-600", exported: "text-emerald-600",
};

export default function RunConsole() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const page = await base44.entities.RunRecord.filter({}, { sort: "-created_date", limit: 50 });
      setRuns(page.items || []);
    } catch { /* admin only */ }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Run Console</h1>
        <p className="text-sm text-muted-foreground">Execution receipts — DAG runs with checkpoints, step logs, and immutable receipts</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : runs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Terminal className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No runs yet. Generator executions will appear here with full lineage.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((r) => {
            const Icon = STATUS_ICON[r.status] ?? Clock;
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-full flex items-center justify-between p-3 hover:bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${STATUS_COLOR[r.status] ?? "text-muted-foreground"} ${r.status === "running" || r.status === "validating" ? "animate-spin" : ""}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{r.generator_id}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{r.run_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">{r.status?.replace(/_/g, " ")}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border p-3 space-y-2 bg-muted/20">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-muted-foreground">Generator version:</span> <span className="text-foreground">{r.generator_version}</span></div>
                      <div><span className="text-muted-foreground">Input hash:</span> <span className="text-foreground font-mono">{r.input_hash?.slice(0, 12)}…</span></div>
                      <div><span className="text-muted-foreground">Cost:</span> <span className="text-foreground">{r.cost_credits ?? 0} credits</span></div>
                      <div><span className="text-muted-foreground">Artifacts:</span> <span className="text-foreground">{r.artifact_ids?.length ?? 0}</span></div>
                    </div>
                    {r.error && <div className="text-[11px] text-red-600 bg-red-50 rounded p-2">{r.error}</div>}
                    {r.step_logs && r.step_logs.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Step Logs</div>
                        {r.step_logs.map((log, i) => (
                          <div key={i} className="text-[11px] font-mono text-muted-foreground bg-background rounded px-2 py-1">{JSON.stringify(log)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}