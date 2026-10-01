import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="gradient-navy rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gold/10" />

          <div className="relative z-10">
            <div className="w-14 h-14 gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">
              Stay Ahead of the Market
            </h2>
            <p className="text-white/70 font-body mb-8 max-w-md mx-auto">
              Get exclusive listings, market insights, and curated property reports delivered to your inbox weekly.
            </p>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 text-emerald-300 font-body font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  You're subscribed! Expect great things.
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm font-body outline-none focus:border-gold transition-colors duration-150"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 gradient-gold text-white text-sm font-body font-semibold rounded-xl hover:opacity-90 transition-opacity duration-150 flex-shrink-0"
                  >
                    Subscribe
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-white/40 text-xs font-body mt-4">
              No spam, ever. Unsubscribe in one click.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}