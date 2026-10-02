import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Sparkles, Loader2, Bot, X } from "lucide-react";
import DistressedPropertyCard from "@/components/property/DistressedPropertyCard";

const CATEGORIES = [
  "Pre-Foreclosure", "Foreclosure", "Short Sale", "Bank-Owned (REO)",
  "Auction", "Tax Lien", "Probate", "Distressed Sale",
];

const PARSE_SCHEMA = {
  type: "object",
  properties: {
    city: { type: "string", description: "city name or empty" },
    state: { type: "string", description: "US state abbreviation or empty" },
    category: { type: "string", enum: CATEGORIES, description: "distress category or empty" },
    min_price: { type: "number", description: "minimum asking price in USD, 0 if none" },
    max_price: { type: "number", description: "maximum asking price in USD, 0 if none" },
    min_beds: { type: "number", description: "minimum bedrooms, 0 if none" },
    min_roi: { type: "number", description: "minimum projected ROI percent, 0 if none" },
    keywords: { type: "array", items: { type: "string" }, description: "other keywords to match in title/description" },
  },
};

const EXAMPLES = [
  "3 bedroom foreclosures in Tampa under 150k",
  "REO properties in Phoenix with 50% ROI",
  "short sales in Atlanta GA",
  "tax lien deals in Texas under 100k",
];

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);

  const runSearch = async (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const aiRes = await base44.functions.invoke("aiProxy", {
        prompt: `Parse this distressed-property search request into structured filters. Only use the fields provided. Today's categories: ${CATEGORIES.join(", ")}. Request: "${term}"`,
        response_json_schema: PARSE_SCHEMA,
      });
      const f = aiRes.data?.json || {};
      setParsed(f);

      const mongo = { status: "Active" };
      if (f.city) mongo.city = { $regex: f.city, $options: "i" };
      if (f.state) mongo.state = { $regex: f.state, $options: "i" };
      if (f.category) mongo.category = f.category;
      if (f.min_price > 0) mongo.asking_price = { ...(mongo.asking_price || {}), $gte: f.min_price };
      if (f.max_price > 0) mongo.asking_price = { ...(mongo.asking_price || {}), $lte: f.max_price };
      if (f.min_beds > 0) mongo.beds = { $gte: f.min_beds };
      if (f.min_roi > 0) mongo.projected_roi = { $gte: f.min_roi };
      if (f.keywords && f.keywords.length) {
        mongo.$or = f.keywords.map((k) => ({ title: { $regex: k, $options: "i" } }));
      }

      const res = await base44.entities.Property.filter(mongo, { sort: "-projected_roi", limit: 60 });
      setResults(res.items || res);
    } catch (e) {
      setError(e?.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">AI Property Search</h1>
          <p className="text-muted-foreground text-sm">Describe what you want in plain English — AI finds matching distressed deals.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mt-5 mb-3 max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="e.g. 3br foreclosures in Tampa under 150k"
          className="w-full pl-12 pr-32 py-3.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => runSearch()}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Examples */}
      {!searched && (
        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setQuery(ex); runSearch(ex); }}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Parsed filters */}
      {parsed && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">AI filters:</span>
          {Object.entries(parsed).filter(([, v]) => v && !(Array.isArray(v) && v.length === 0)).map(([k, v]) => (
            <span key={k} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 mb-6">
          <X className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-display text-lg font-semibold text-foreground">No deals matched your search</p>
          <p className="text-sm mt-1">Try rephrasing or broadening the criteria.</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            {results.length} match{results.length === 1 ? "" : "es"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((p, i) => (
              <DistressedPropertyCard key={p.id} property={p} index={i} onClick={() => window.location.assign(`/portal/property/${p.id}`)} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}