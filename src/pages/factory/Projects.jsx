import { useState, useEffect } from "react";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INTAKE_TYPES = ["idea", "client", "business", "workflow", "app", "website", "system_requirement"];
const STATUS_COLOR = {
  intake: "bg-slate-100 text-slate-700", discovery: "bg-blue-100 text-blue-700",
  brand_options: "bg-purple-100 text-purple-700", approved: "bg-green-100 text-green-700",
  building: "bg-amber-100 text-amber-700", validating: "bg-cyan-100 text-cyan-700",
  release_ready: "bg-emerald-100 text-emerald-700", operating: "bg-green-100 text-green-700",
  on_hold: "bg-slate-100 text-slate-500", cancelled: "bg-red-100 text-red-700",
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", intake_type: "idea" });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const page = await base44.entities.FactoryProject.filter({}, { sort: "-created_date", limit: 50 });
      setProjects(page.items || []);
    } catch { /* admin only */ }
    setLoading(false);
  }

  async function create() {
    if (!form.title.trim()) return;
    try {
      await base44.entities.FactoryProject.create({
        title: form.title, description: form.description, intake_type: form.intake_type,
        status: "intake", current_phase: "plan",
      });
      setForm({ title: "", description: "", intake_type: "idea" });
      setShowForm(false);
      load();
    } catch (e) { alert(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Projects / Intake</h1>
          <p className="text-sm text-muted-foreground">Transform ideas, clients, and requirements into validated build artifacts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project title…" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description…" rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
          <div className="flex items-center gap-2">
            <select value={form.intake_type} onChange={(e) => setForm({ ...form, intake_type: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              {INTAKE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <button onClick={create} className="bg-gold text-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Create</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No projects yet. Create one to start the pipeline.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="min-w-0">
                <div className="font-medium text-foreground text-sm">{p.title}</div>
                {p.description && <div className="text-xs text-muted-foreground truncate mt-0.5">{p.description}</div>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.intake_type?.replace(/_/g, " ")}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] ?? "bg-slate-100 text-slate-600"}`}>{p.status?.replace(/_/g, " ")}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}