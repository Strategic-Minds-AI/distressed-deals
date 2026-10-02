import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, TrendingUp, DollarSign, Percent, Calculator, Lightbulb, AlertTriangle } from "lucide-react";
import { useLiveProperties } from "@/hooks/useLiveProperties";
import { formatCurrency, maxOffer70, roiPercent, equityPercent } from "@/lib/investment";

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    key_metrics: {
      type: "object",
      properties: {
        cap_rate: { type: "number" },
        monthly_cash_flow: { type: "number" },
        cash_on_cash_return: { type: "number" },
        net_operating_income: { type: "number" },
        gross_rent_multiplier: { type: "number" },
        debt_service_coverage_ratio: { type: "number" },
      },
    },
    ai_investment_summary: { type: "string", description: "A 3-4 paragraph SWOT-style analysis: strengths, weaknesses, opportunities, threats, and a clear recommendation." },
    ai_property_potential: {
      type: "object",
      properties: {
        short_term_appreciation_forecast: { type: "string" },
        long_term_appreciation_forecast: { type: "string" },
        rental_growth_potential: { type: "string" },
        value_add_opportunities: { type: "array", items: { type: "string" } },
      },
    },
    recommendation: { type: "string", enum: ["Strong Buy", "Buy", "Hold", "Pass"], description: "overall recommendation" },
    confidence_score: { type: "number", description: "0-100 confidence in the analysis" },
  },
};

export default function DealAnalysis() {
  const { items: properties, loading } = useLiveProperties({ status: "Active" }, { sort: "-projected_roi", limit: 200 });
  const [selectedId, setSelectedId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const property = properties.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId && properties.length) setSelectedId(properties[0].id);
  }, [properties, selectedId]);

  const runAnalysis = async () => {
    if (!property) return;
    setAnalyzing(true);
    setError(null);
    setReport(null);
    try {
      const maxOffer = maxOffer70(property.arv, property.estimated_repair_cost);
      const profit = (property.arv || 0) - (property.asking_price || 0) - (property.estimated_repair_cost || 0);
      const roi = roiPercent(property.arv, property.asking_price, property.estimated_repair_cost);
      const equity = equityPercent(property.arv, property.asking_price);

      const prompt = `Analyze this distressed real estate investment deal and produce a professional investment analysis.
Property: ${property.title}
Address: ${property.address}, ${property.city}, ${property.state} ${property.zip}
Category: ${property.category} — ${property.distress_reason || ""}
Asking Price: $${property.asking_price}
After Repair Value (ARV): $${property.arv || "N/A"}
Estimated Repair Cost: $${property.estimated_repair_cost || 0}
Beds/Baths: ${property.beds || "?"}/${property.baths || "?"} | SqFt: ${property.sqft || "?"} | Year: ${property.year_built || "?"}
Condition: ${property.condition_grade || "Unknown"}
Computed: 70% Max Offer = $${maxOffer} | Projected Profit = $${profit} | ROI = ${roi}% | Equity = ${equity}%
Description: ${property.description || ""}
Repair Summary: ${property.repair_summary || ""}

Provide realistic cap rate, cash flow, cash-on-cash return, NOI, GRM and DSCR assuming a typical 25% down, 7% interest, 30-year amortization investor loan and market rents for the area. Be conservative and deterministic.`;

      const res = await base44.functions.invoke("aiProxy", {
        prompt,
        response_json_schema: ANALYSIS_SCHEMA,
      });
      setReport(res.data?.json);
    } catch (e) {
      setError(e?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">AI Deal Analysis</h1>
          <p className="text-muted-foreground text-sm">Select a deal for a full AI investment analysis — cap rate, cash flow, SWOT, and recommendation.</p>
        </div>
      </div>

      {/* Property picker */}
      <div className="mt-5 mb-6">
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setReport(null); }}
          disabled={loading}
          className="w-full max-w-xl border border-border rounded-lg px-3 py-2.5 bg-card text-sm outline-none focus:border-primary"
        >
          {loading && <option>Loading deals…</option>}
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} — {formatCurrency(p.asking_price)} ({p.category})
            </option>
          ))}
        </select>
      </div>

      {property && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Metric label="Asking" value={formatCurrency(property.asking_price)} />
          <Metric label="ARV" value={formatCurrency(property.arv)} />
          <Metric label="Max Offer (70%)" value={formatCurrency(maxOffer70(property.arv, property.estimated_repair_cost))} accent />
          <Metric label="Projected ROI" value={`${roiPercent(property.arv, property.asking_price, property.estimated_repair_cost)}%`} accent />
        </div>
      )}

      <button
        onClick={runAnalysis}
        disabled={!property || analyzing}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mb-6"
      >
        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {analyzing ? "Analyzing…" : "Run AI Analysis"}
      </button>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {analyzing && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {report && !analyzing && (
        <div className="space-y-4">
          {/* Recommendation banner */}
          <div className="gradient-navy rounded-2xl p-5 text-white flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-white/60 text-xs uppercase tracking-widest">AI Recommendation</div>
              <div className="font-display text-3xl font-bold">{report.recommendation || "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-xs uppercase tracking-widest">Confidence</div>
              <div className="font-display text-2xl font-bold">{report.confidence_score ?? "—"}%</div>
            </div>
          </div>

          {/* Key metrics */}
          {report.key_metrics && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Metric label="Cap Rate" value={`${report.key_metrics.cap_rate ?? "—"}%`} icon={Percent} />
              <Metric label="Monthly Cash Flow" value={formatCurrency(report.key_metrics.monthly_cash_flow)} icon={DollarSign} />
              <Metric label="Cash-on-Cash" value={`${report.key_metrics.cash_on_cash_return ?? "—"}%`} icon={TrendingUp} />
              <Metric label="NOI" value={formatCurrency(report.key_metrics.net_operating_income)} />
              <Metric label="GRM" value={report.key_metrics.gross_rent_multiplier ?? "—"} />
              <Metric label="DSCR" value={report.key_metrics.debt_service_coverage_ratio ?? "—"} />
            </div>
          )}

          {/* Summary */}
          {report.ai_investment_summary && (
            <Card title="Investment Summary" icon={Sparkles}>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{report.ai_investment_summary}</p>
            </Card>
          )}

          {/* Potential */}
          {report.ai_property_potential && (
            <Card title="AI Property Potential" icon={Lightbulb}>
              <div className="space-y-2 text-sm">
                <Row label="Short-term appreciation" value={report.ai_property_potential.short_term_appreciation_forecast} />
                <Row label="Long-term appreciation" value={report.ai_property_potential.long_term_appreciation_forecast} />
                <Row label="Rental growth" value={report.ai_property_potential.rental_growth_potential} />
                {report.ai_property_potential.value_add_opportunities?.length > 0 && (
                  <div>
                    <div className="text-muted-foreground mb-1">Value-add opportunities:</div>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {report.ai_property_potential.value_add_opportunities.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent, icon: Icon }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${accent ? "bg-emerald-50" : "bg-card border border-border"}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </div>
      <div className={`text-base font-bold ${accent ? "text-emerald-700" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-[140px] flex-shrink-0">{label}:</span>
      <span className="text-foreground">{value || "—"}</span>
    </div>
  );
}