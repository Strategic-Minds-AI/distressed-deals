import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Database, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  ImageOff, Copy, FileX, RefreshCw, ShieldCheck,
} from "lucide-react";
import { useLiveProperties } from "@/hooks/useLiveProperties";
import DistressedPropertyCard from "@/components/property/DistressedPropertyCard";

export default function InventoryCleaner() {
  const { items: properties, loading, refresh } = useLiveProperties({}, { sort: "-created_date", limit: 500 });
  const [running, setRunning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Deterministic client-side mirror of inventory health
  const issues = useMemo(() => {
    const dupes = [];
    const seen = new Map();
    const noImages = [];
    const incomplete = [];
    (properties || []).forEach((p) => {
      const key = `${(p.address || "").toLowerCase().replace(/[^a-z0-9]/g, "")}|${(p.city || "").toLowerCase()}`;
      if (key && key !== "|") {
        if (seen.has(key)) dupes.push(p);
        else seen.set(key, p);
      }
      if (!Array.isArray(p.images) || p.images.filter(Boolean).length === 0) noImages.push(p);
      if (!p.title || !p.address || p.asking_price == null || !p.category) incomplete.push(p);
    });
    return { dupes, noImages, incomplete };
  }, [properties]);

  const runClean = async (validate = false) => {
    if (validate) setValidating(true); else setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("cleanInventory", { mode: "clean", validateImages: validate });
      setReport(res.data);
      refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Clean failed");
    } finally {
      setRunning(false);
      setValidating(false);
    }
  };

  const health = [
    { label: "Total Listings", value: properties.length, icon: Database, tone: "text-foreground" },
    { label: "Duplicate Addresses", value: issues.dupes.length, icon: Copy, tone: issues.dupes.length ? "text-amber-600" : "text-emerald-600" },
    { label: "Missing Images", value: issues.noImages.length, icon: ImageOff, tone: issues.noImages.length ? "text-rose-600" : "text-emerald-600" },
    { label: "Incomplete Records", value: issues.incomplete.length, icon: FileX, tone: issues.incomplete.length ? "text-rose-600" : "text-emerald-600" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Inventory Cleaner</h1>
          <p className="text-muted-foreground text-sm">Deterministic cleanup keeps your deal inventory perfectly clean.</p>
        </div>
      </div>

      {/* Live status */}
      <div className="flex items-center gap-2 mt-4 mb-6 text-xs text-emerald-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live auto-refresh active — inventory updates in real time
      </div>

      {/* Health cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {health.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <Icon className={`w-5 h-5 mb-2 ${s.tone}`} />
              <div className="font-display text-2xl font-bold text-foreground">{loading ? "—" : s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => runClean(false)}
          disabled={running || validating}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {running ? "Cleaning…" : "Clean Now"}
        </button>
        <button
          onClick={() => runClean(true)}
          disabled={running || validating}
          className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
        >
          {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {validating ? "Validating images…" : "Validate Image URLs"}
        </button>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-lg font-semibold text-foreground">Cleanup Report</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <ReportStat label="Listings scanned" value={report.total} />
            <ReportStat label="Images added" value={report.imagesFixed} />
            <ReportStat label="Dead images replaced" value={report.deadImagesReplaced} />
            <ReportStat label="Duplicates withdrawn" value={report.duplicatesWithdrawn} />
            <ReportStat label="Incomplete withdrawn" value={report.incompleteWithdrawn} />
            <ReportStat label="Records updated" value={report.updated} />
            <ReportStat label="Images validated" value={report.validated} />
            <ReportStat label="Status" value="Complete" ok />
          </div>
        </div>
      )}

      {/* Duplicate preview */}
      {issues.dupes.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-600" /> Detected Duplicates ({issues.dupes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {issues.dupes.slice(0, 8).map((p, i) => (
              <DistressedPropertyCard key={p.id} property={p} index={i} onClick={() => window.location.assign(`/portal/property/${p.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportStat({ label, value, ok }) {
  return (
    <div>
      <div className={`font-display text-xl font-bold ${ok ? "text-emerald-600" : "text-foreground"}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}