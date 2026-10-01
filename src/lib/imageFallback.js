// Distressed-property fallback image — a bundled SVG illustration that always
// renders (no network dependency), so no deal card or hero ever shows a broken image.
import FALLBACK_SVG from "@/assets/distressed-house.svg";

export const FALLBACK_IMAGE = FALLBACK_SVG;

// Ensure an images array always has at least one usable entry.
export function normalizeImages(images) {
  const arr = Array.isArray(images) ? images.filter(Boolean) : [];
  return arr.length ? arr : [FALLBACK_IMAGE];
}