import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Boxes, Terminal, ShieldCheck, FolderSearch, Activity, ArrowRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const RESULT_ICON = { pass: CheckCircle, fail: XCircle, blocked: AlertCircle, info: Activity };
const RESULT_COLOR = { pass: "text-green-600", fail: "text-red-600", blocked: "text-amber-600", info: "text-blue-600" };

export default function CommandCenter() {
  const [stats, setStats] = useState({ projects: 0, registry: 0, runs: 0, pending: 0, artifacts: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projects, registry, runs, pending, artifacts, auditPage] = await Promise.all([
          base44.entities.FactoryProject.count(),
          base44.entities.RegistryEntry.count(),
          base44.entities.RunRecord.count(),
          base44.entities.Approval.count({ status: "pending" }),
          base44.entities.Artifact.count(),
          base44.entities.AuditReceipt.filter({}, { sort: "-created_date", limit: 8 }),
        ]);
        setStats({ projects, registry, runs, pending, artifacts });
        setRecent(auditPage.items || []);
      } catch { /* entities may require admin */ }
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: "Projects", value: stats.projects, icon: FolderKanban, path: "/factory/projects", color: "text-blue-600" },
    { label: "Registry Entries", value: stats.registry, icon: Boxes, path: "/factory/capabilities", color: "text-purple-600" },
    { label: "Runs", value: stats.runs, icon: Terminal, path: "/factory/runs", color: "text-slate-600" },
    { label: "Pending Approvals", value: stats.pending, icon: ShieldCheck, path: "/factory/approvals", color: "text-amber-600" },
    { label: "Artifacts", value: stats.artifacts, icon: FolderSearch, path: "/factory/artifacts", color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Command Center</h1>
        <p className="text-sm text-muted-foreground">Factory overview — source truth, governance, and build status</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} to={c.path} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
              <Icon className={`w-5 h-5 mb-2 ${c.color}`} />
              <div className="font-display text-2xl font-bold text-foreground">{loading ? "…" : c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground">Recent Activity</h2>
            <Link to="/factory/audit" className="text-xs text-primary flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded yet</p>
          ) : (
            <div className="space-y-2">
              {recent.map((a) => {
                const Icon = RESULT_ICON[a.result] ?? Activity;
                return (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <Icon className={`w-3.5 h-3.5 ${RESULT_COLOR[a.result] ?? "text-muted-foreground"}`} />
                    <span className="font-medium text-foreground">{a.action}</span>
                    <span className="text-muted-foreground truncate">{a.event_type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-display font-semibold text-foreground mb-3">System Health</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">AI Gateway</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Credits Exhausted</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Vercel Gateway Key</span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Supabase Connector</span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Factory Build</span>
              <Link to="/factory/settings" className="text-primary text-xs">8/50 modules →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}