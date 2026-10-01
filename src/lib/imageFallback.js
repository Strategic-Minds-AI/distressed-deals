// Distressed-property fallback image — used when an image URL fails to load.
// A reliable Unsplash photo of a distressed/renovation property.
export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1564013799925-ab319b078b8f?w=800&q=70";

// Ensure an images array always has at least one usable entry.
export function normalizeImages(images) {
  const arr = Array.isArray(images) ? images.filter(Boolean) : [];
  return arr.length ? arr : [FALLBACK_IMAGE];
}