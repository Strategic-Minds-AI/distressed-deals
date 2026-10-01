import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Heart, Bed, Bath, Square, MapPin, TrendingUp, Wrench, AlertTriangle,
  Calendar, Phone, Mail, Send, CheckCircle2, Calculator, Building2, DollarSign,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import SmartImage from "@/components/common/SmartImage";
import {
  formatCurrency, formatCurrencyFull, maxOffer70, projectedProfit, roiPercent, equityPercent,
  CATEGORY_COLORS, STATUS_COLORS, CONDITION_COLORS,
} from "@/lib/investment";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [watched, setWatched] = useState(null);
  const [showOffer, setShowOffer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    amount: "", offer_type: "Cash", earnest_money: "", closing_timeline_days: "30", contingencies: "", message: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const p = await base44.entities.Property.get(id);
        setProperty(p);
        setForm(f => ({ ...f, amount: String(p.asking_price) }));
        const wl = await base44.entities.Watchlist.filter({ property_id: id }, { limit: 1 });
        const wlItems = wl.items || wl;
        if (wlItems.length) setWatched(wlItems[0]);
      } catch (e) {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleWatch = async () => {
    if (watched) {
      await base44.entities.Watchlist.delete(watched.id);
      setWatched(null);
    } else {
      const rec = await base44.entities.Watchlist.create({
        property_id: id,
        property_title: property.title,
        property_address: `${property.address}, ${property.city}, ${property.state}`,
        asking_price: property.asking_price,
        category: property.category,
      });
      setWatched(rec);
    }
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Offer.create({
        property_id: id,
        property_title: property.title,
        property_address: `${property.address}, ${property.city}, ${property.state}`,
        amount: Number(form.amount),
        offer_type: form.offer_type,
        earnest_money: Number(form.earnest_money) || 0,
        closing_timeline_days: Number(form.closing_timeline_days) || 30,
        contingencies: form.contingencies,
        message: form.message,
        status: "Submitted",
        investor_name: user?.full_name || "",
        investor_email: user?.email || "",
      });
      setSubmitted(true);
      setShowOffer(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center min-h-[80vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Property not found.</p>
        <Link to="/portal/browse" className="text-primary hover:underline">Back to deals</Link>
      </div>
    );
  }

  const maxOffer = maxOffer70(property.arv, property.estimated_repair_cost);
  const profit = projectedProfit(property.arv, property.asking_price, property.estimated_repair_cost);
  const roi = roiPercent(property.arv, property.asking_price, property.estimated_repair_cost);
  const equity = equityPercent(property.arv, property.asking_price);
  const dealScore = Math.min(100, Math.round((roi / 100) * 100 + (equity / 2)));

  return (
    <div className="pb-12">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={toggleWatch}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
              watched ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            <Heart className={`w-4 h-4 ${watched ? "fill-rose-500" : ""}`} />
            {watched ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Gallery */}
        <div className="rounded-2xl overflow-hidden mb-6 bg-muted h-64 sm:h-96">
          <SmartImage src={property.images?.[imgIdx]} alt={property.title} className="w-full h-full object-cover" />
        </div>
        {property.images?.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors duration-150 ${
                  i === imgIdx ? "border-primary" : "border-transparent"
                }`}
              >
                <SmartImage src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[property.category] || ""}`}>{property.category}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[property.status] || ""}`}>{property.status}</span>
              {property.auction_date && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Auction {new Date(property.auction_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">{property.title}</h1>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
              <MapPin className="w-4 h-4" />
              {property.address}, {property.city}, {property.state} {property.zip}
            </div>

            {/* Specs */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {property.beds > 0 && <Spec icon={Bed} label={`${property.beds} Beds`} />}
              {property.baths > 0 && <Spec icon={Bath} label={`${property.baths} Baths`} />}
              <Spec icon={Square} label={`${property.sqft?.toLocaleString()} ft²`} />
              <Spec icon={Building2} label={`Built ${property.yearBuilt}`} />
              <span className={`font-medium ${CONDITION_COLORS[property.condition_grade] || ""}`}>{property.condition_grade}</span>
            </div>

            {/* Investment analysis */}
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-gold" />
                <h2 className="font-display text-lg font-semibold text-foreground">Investment Analysis</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Asking Price" value={formatCurrencyFull(property.asking_price)} />
                <Stat label="After Repair Value" value={formatCurrencyFull(property.arv)} accent />
                <Stat label="Est. Repairs" value={formatCurrencyFull(property.estimated_repair_cost)} icon={Wrench} />
                <Stat label="Max Offer (70%)" value={formatCurrencyFull(maxOffer)} accent />
                <Stat label="Projected Profit" value={formatCurrencyFull(profit)} accent />
                <Stat label="Projected ROI" value={`${roi}%`} accent />
                <Stat label="Equity %" value={`${equity}%`} />
                {property.cap_rate > 0 && <Stat label="Cap Rate" value={`${property.cap_rate}%`} />}
                <Stat label="Deal Score" value={`${dealScore}/100`} accent />
              </div>
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
                {roi >= 50
                  ? `Strong deal — ${roi}% projected ROI. Max offer under the 70% rule is ${formatCurrencyFull(maxOffer)}.`
                  : `Moderate deal — ${roi}% projected ROI. Evaluate repair accuracy before bidding.`}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">Property Overview</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{property.description}</p>
            </div>

            {/* Distress info */}
            <div className="mb-6">
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">Distress Details</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <div className="font-medium text-amber-900 mb-1">Reason: {property.distress_reason}</div>
                <p className="text-amber-800">{property.repair_summary}</p>
              </div>
            </div>

            {/* Agent */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Listing Agent</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-navy flex items-center justify-center text-white font-bold">
                  {property.agent_name?.[0] || "A"}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{property.agent_name}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{property.agent_phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{property.agent_email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: offer CTA */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-20 bg-card rounded-2xl border border-border p-5">
              <div className="text-center mb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Asking Price</div>
                <div className="font-display text-3xl font-bold text-foreground">{formatCurrencyFull(property.asking_price)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {property.sqft ? `${formatCurrencyFull(Math.round(property.asking_price / property.sqft))}/ft²` : ""}
                </div>
              </div>

              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                  <div className="font-display text-lg font-semibold text-foreground">Offer Submitted!</div>
                  <p className="text-sm text-muted-foreground mt-1">Track it under My Offers.</p>
                  <Link to="/portal/offers" className="block mt-4 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity duration-150">
                    Go to My Offers
                  </Link>
                </div>
              ) : showOffer ? (
                <form onSubmit={submitOffer} className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Offer Amount ($)</label>
                    <input type="number" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Offer Type</label>
                    <select value={form.offer_type} onChange={e => setForm({ ...form, offer_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary bg-card">
                      {["Cash", "Conventional", "FHA", "Hard Money", "Subject-To", "Wholesale Assignment"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Earnest $</label>
                      <input type="number" value={form.earnest_money} onChange={e => setForm({ ...form, earnest_money: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Close (days)</label>
                      <input type="number" value={form.closing_timeline_days} onChange={e => setForm({ ...form, closing_timeline_days: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Contingencies</label>
                    <input value={form.contingencies} onChange={e => setForm({ ...form, contingencies: e.target.value })} placeholder="Inspection, financing..."
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Message to Agent</label>
                    <textarea rows={2} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary resize-none" />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Offer"}
                  </button>
                  <button type="button" onClick={() => setShowOffer(false)} className="w-full text-sm text-muted-foreground hover:text-foreground py-1">Cancel</button>
                </form>
              ) : (
                <button
                  onClick={() => setShowOffer(true)}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity duration-150 flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" /> Submit an Offer
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Max Offer (70%)</span><span className="font-semibold text-foreground">{formatCurrency(maxOffer)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Est. Profit</span><span className="font-semibold text-emerald-600">{formatCurrency(profit)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Projected ROI</span><span className="font-semibold text-emerald-600">{roi}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label }) {
  return <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="w-4 h-4" /> {label}</span>;
}

function Stat({ label, value, accent, icon: Icon }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-emerald-50" : "bg-muted"}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-2.5 h-2.5" />}{label}
      </div>
      <div className={`text-base font-bold ${accent ? "text-emerald-700" : "text-foreground"}`}>{value}</div>
    </div>
  );
}