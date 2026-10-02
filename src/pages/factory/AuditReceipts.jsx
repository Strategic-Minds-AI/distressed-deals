import { useState, useEffect } from "react";
import { ScrollText, CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";

const RESULT_ICON = { pass: CheckCircle, fail: XCircle, blocked: AlertCircle, info: Activity };
const RESULT_COLOR = { pass: "text-green-600", fail: "text-red-600", blocked: "text-amber-600", info: "text-blue-600" };

export default function AuditReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const page = await base44.entities.AuditReceipt.filter({}, { sort: "-created_date", limit: 100 });
      setReceipts(page.items || []);
    } catch { /* admin only */ }
    setLoading(false);
  }

  const filtered = filter === "all" ? receipts : receipts.filter((r) => r.result === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Audit / Receipts</h1>
        <p className="text-sm text-muted-foreground">Immutable evidence trail — no evidence = no PASS</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["all", "pass", "fail", "blocked", "info"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <ScrollText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No audit receipts yet. Factory events will be recorded here.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {filtered.map((r) => {
            const Icon = RESULT_ICON[r.result] ?? Activity;
            return (
              <div key={r.id} className="flex items-start gap-3 p-3">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${RESULT_COLOR[r.result] ?? "text-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-xs">{r.action}</span>
                    <span className="text-[10px] text-muted-foreground">{r.event_type}</span>
                  </div>
                  {r.evidence && <p className="text-[11px] text-muted-foreground mt-0.5">{r.evidence}</p>}
                  {r.actor && <p className="text-[10px] text-muted-foreground/70 mt-0.5">by {r.actor}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{new Date(r.created_date).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}