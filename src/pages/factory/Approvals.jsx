import { useState, useEffect } from "react";
import { ShieldCheck, Check, X, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ACTION_LABELS } from "@/lib/factoryHelpers";

const STATUS_ICON = { pending: Clock, approved: Check, rejected: X, expired: X };
const STATUS_COLOR = { pending: "text-amber-600", approved: "text-green-600", rejected: "text-red-600", expired: "text-slate-400" };

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const page = await base44.entities.Approval.filter({}, { sort: "-created_date", limit: 50 });
      setApprovals(page.items || []);
    } catch { /* admin only */ }
    setLoading(false);
  }

  async function decide(id, status) {
    try {
      await base44.entities.Approval.update(id, { status, decided_at: new Date().toISOString() });
      load();
    } catch (e) { alert(e.message); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Approvals</h1>
        <p className="text-sm text-muted-foreground">Governance gate — protected actions require operator approval before execution</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : approvals.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No approval requests. Protected actions will queue here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.map((a) => {
            const Icon = STATUS_ICON[a.status] ?? Clock;
            return (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${STATUS_COLOR[a.status]}`} />
                      <span className="font-medium text-foreground text-sm">{ACTION_LABELS[a.action_type] ?? a.action_type}</span>
                    </div>
                    {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                    <div className="text-[10px] text-muted-foreground font-mono mt-1">{a.approval_id}</div>
                  </div>
                  {a.status === "pending" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => decide(a.id, "approved")} className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:opacity-90">
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => decide(a.id, "rejected")} className="flex items-center gap-1 bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:opacity-90">
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}