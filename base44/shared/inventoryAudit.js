import { auditPropertyCandidates } from './propertyIdentity.js';
// Pure, read-only audit. No bulkUpdate, withdraw, delete or external HTTP.
export function auditInventoryRecords(items, { checkImageFormat = false } = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const duplicates = auditPropertyCandidates(items);
  let noImages = 0, incomplete = 0, invalidImageUrls = 0, urlFormatsChecked = 0;
  for (const row of items) {
    const images = Array.isArray(row?.images) ? row.images.filter(x=>typeof x === 'string' && x.trim()) : [];
    if (!images.length) noImages++;
    if (!row?.title || !row?.address || row?.asking_price == null || !row?.category) incomplete++;
    if (checkImageFormat) {
      for (const img of images.slice(0, 5)) {
        urlFormatsChecked++;
        try {
          const url = new URL(img);
          if (url.protocol !== 'https:' || !url.hostname.includes('.')) invalidImageUrls++;
        } catch { invalidImageUrls++; }
      }
    }
  }
  return {
    total:items.length, mode:'REVIEW_ONLY', applied:false, updated:0,
    imagesFixed:0, deadImagesReplaced:0, duplicatesWithdrawn:0, incompleteWithdrawn:0, validated:0,
    duplicateCandidates: duplicates.totalCandidates,
    ambiguousCandidates: duplicates.ambiguousCandidates,
    duplicateReviewPairs: duplicates.pairs,
    duplicatePairsTruncated: duplicates.truncated,
    missingImageCandidates: noImages, incompleteCandidates:incomplete,
    urlFormatsChecked, invalidImageUrls,
    notice:'Review-only. No listings or status values were changed. Image URL format checks do not establish remote availability.'
  };
}
