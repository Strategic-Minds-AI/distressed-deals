import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Database, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  ImageOff, Copy, FileX, RefreshCw, ShieldCheck,
} from "lucide-react";
import { useLiveProperties } from "@/hooks/useLiveProperties";
import { auditPropertyCandidates } from "../../base44/shared/propertyIdentity.js";
import DistressedPropertyCard from "@/components/property/DistressedPropertyCard";

export default function InventoryCleaner() {
  const navigate = useNavigate();
  const { items: properties, loading, refresh } = useLiveProperties({}, { sort: "-created_date", limit: 500 });
  const [running, setRunning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [report, setReport] = useState(null);
  const [availReport, setAvailReport] = useState(null);
  const [error, setError] = useState(null);

  // Preview possible duplicates without treating ZIP, street or building matches as identity.
  const issues = useMemo(() => {
    const records = properties || [];
    const audit = auditPropertyCandidates(records);
    const reviewIds = new Set(audit.pairs.map(pair => pair.rightId));
    const dupes = records.filter(p => reviewIds.has(String(p.id)));
    const noImages = records.filter(p => !Array.isArray(p.images) || !p.images.some(Boolean));
    const incomplete = records.filter(p => !p.title || !p.address || p.asking_price == null || !p.category);
    return { dupes, candidateCount: audit.totalCandidates, ambiguousCount: audit.ambiguousCandidates, noImages, incomplete };
  }, [properties]);

  const runAvailabilityCheck = async () => {
    setCheckingAvail(true);
    setError(null);
    setAvailReport(null);
    try {
      const res = await base44.functions.invoke("validateAvailability", {});
      setAvailReport(res.data);
      refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Availability check failed");
    } finally {
      setCheckingAvail(false);
    }
  };

  const runClean = async (validate = false) => {
    if (validate) setValidating(true); else setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("cleanInventory", { mode: "audit", validateImages: validate });
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
    { label: "Review Candidates", value: issues.candidateCount, icon: Copy, tone: issues.candidateCount ? "text-amber-600" : "text-emerald-600" },
    { label: "Missing Image Links", value: issues.noImages.length, icon: ImageOff, tone: issues.noImages.length ? "text-rose-600" : "text-emerald-600" },
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
          <p className="text-muted-foreground text-sm">Conservative review identifies issues without altering property listings.</p>
        </div>
      </div>

      {/* Live status */}
      <div className="flex items-center gap-2 mt-4 mb-6 text-xs text-emerald-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Loaded inventory snapshot; audit does not change listing status
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
          {running ? "Auditing…" : "Audit Inventory"}
        </button>
        <button
          onClick={() => runClean(true)}
          disabled={running || validating}
          className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
        >
          {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {validating ? "Checking URL format…" : "Check Image URL Format"}
        </button>
        <button
          onClick={runAvailabilityCheck}
          disabled={running || validating || checkingAvail}
          className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
        >
          {checkingAvail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {checkingAvail ? "Validating…" : "Validate Availability"}
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
            <h2 className="font-display text-lg font-semibold text-foreground">Inventory Audit Report</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <ReportStat label="Listings scanned" value={report.total} />
            <ReportStat label="Missing image links" value={report.missingImageCandidates} />
            <ReportStat label="Invalid image URLs" value={report.invalidImageUrls} />
            <ReportStat label="Duplicate review pairs" value={report.duplicateCandidates} />
            <ReportStat label="Incomplete for review" value={report.incompleteCandidates} />
            <ReportStat label="Records changed" value={report.updated} />
            <ReportStat label="URL formats checked" value={report.urlFormatsChecked} />
            <ReportStat label="Mode" value={report.mode || "REVIEW_ONLY"} />
          </div>
        </div>
      )}

      {/* Availability validation report */}
      {availReport && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-lg font-semibold text-foreground">Availability Validation Report</h2>
            <span className="text-xs text-muted-foreground ml-auto">{new Date(availReport.checked_at).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <ReportStat label="Properties checked" value={availReport.report.total_checked} />
            <ReportStat label="Marked Sold" value={availReport.report.marked_sold} />
            <ReportStat label="Marked Withdrawn" value={availReport.report.marked_withdrawn} />
            <ReportStat label="Verified available" value={availReport.report.verified_available} ok />
          </div>
          {availReport.changes?.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Status Changes</h3>
              <div className="space-y-2">
                {availReport.changes.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.action === "Sold" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.action}
                    </span>
                    <span className="font-medium text-foreground truncate">{c.title}</span>
                    <span className="text-muted-foreground text-xs ml-auto truncate">{c.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Duplicate preview */}
      {issues.dupes.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-600" /> Possible Duplicate Review ({issues.candidateCount})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {issues.dupes.slice(0, 8).map((p, i) => (
              <DistressedPropertyCard key={p.id} property={p} index={i} onClick={() => navigate(`/portal/property/${p.id}`)} />
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