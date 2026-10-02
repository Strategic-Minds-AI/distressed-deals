import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";

const SYSTEM_PROMPT = `You are the DistressDeals AI Investment Coach — an expert advisor on distressed real estate investing (foreclosures, short sales, REOs, auctions, tax liens, probate). Give concise, actionable, deterministic advice. When relevant, reference the 70% rule: Max Offer = (ARV × 0.70) − Repair Cost. Warn about risks (title defects, redemption periods, hidden liens, repair overruns). Keep answers under 180 words unless the user asks for depth.`;

const SUGGESTIONS = [
  "How does the 70% rule work?",
  "What's the difference between a short sale and an REO?",
  "How do I estimate repair costs on a distressed property?",
  "What due diligence should I do before bidding at auction?",
];

export default function Coach() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your distressed-property investment coach. Ask me about deal analysis, the 70% rule, foreclosure types, auction strategy, or anything else." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const convoMessages = next.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
      const res = await base44.functions.invoke("aiProxy", {
        system_prompt: SYSTEM_PROMPT,
        messages: convoMessages,
      });
      setMessages((m) => [...m, { role: "assistant", content: res.data?.content || "Sorry, I couldn't respond just now." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't respond just now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto flex flex-col h-[calc(100vh-64px)] md:h-screen">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">AI Investment Coach</h1>
          <p className="text-muted-foreground text-sm">Ask anything about distressed real estate investing.</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide space-y-4 bg-card border border-border rounded-2xl p-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === "user" ? "gradient-gold" : "gradient-navy"}`}>
              {m.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full gradient-navy flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" /> {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the coach…"
          className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
          aria-label="Send"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}