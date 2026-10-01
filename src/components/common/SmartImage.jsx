import { useState } from "react";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";

/**
 * Bulletproof image: a guaranteed SVG background (bundled, never 404s) sits
 * behind a real <img> that only becomes visible once it successfully loads.
 * A broken URL never shows a browser "broken image" icon — the SVG base
 * always remains visible underneath, and the top image stays invisible
 * until onLoad fires. Retries once (cache-busted) before giving up entirely.
 */
export default function SmartImage({ src, alt = "", className = "", loading = "lazy", ...rest }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // attempt 0 → original, 1 → retry original (cache-bust), 2 → give up (show base only)
  const resolved =
    attempt >= 2 || !src ? null : attempt === 1 ? `${src}${src.includes("?") ? "&" : "?"}_r=1` : src;

  return (
    <div
      className={`relative overflow-hidden bg-muted ${className}`}
      style={{
        backgroundImage: `url(${FALLBACK_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {resolved && (
        <img
          src={resolved}
          alt={alt}
          loading={loading}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setAttempt((a) => Math.min(a + 1, 2));
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          {...rest}
        />
      )}
    </div>
  );
}