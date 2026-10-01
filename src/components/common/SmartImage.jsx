import { useState } from "react";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";

/**
 * Bulletproof image: tries the original URL, retries once (cache-busted),
 * then falls back to a guaranteed-working placeholder. No broken image
 * icons ever render.
 */
export default function SmartImage({ src, alt = "", className = "", loading = "lazy", ...rest }) {
  const [attempt, setAttempt] = useState(0);

  // attempt 0 → original, 1 → retry original (cache-bust), 2 → fallback
  const resolved =
    attempt >= 2 || !src
      ? FALLBACK_IMAGE
      : attempt === 1
      ? `${src}${src.includes("?") ? "&" : "?"}_r=1`
      : src;

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={loading}
      draggable={false}
      onError={() => setAttempt((a) => Math.min(a + 1, 2))}
      {...rest}
    />
  );
}