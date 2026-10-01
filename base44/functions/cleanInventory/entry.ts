import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1564013799925-ab319b078b8f?w=800&q=70";

async function isImageAlive(url, timeoutMs = 5000) {
  if (!url || typeof url !== "string") return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    return ct.startsWith("image/") || ct.includes("octet-stream") || ct === "";
  } catch {
    return false;
  }
}

async function pool(items, fn, concurrency = 8) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const validateImages = body.validateImages === true;

    const isAdmin = user.role === "admin";
    const isAgent = user.data && user.data.portal_role === "agent";
    if (!isAdmin && !isAgent) {
      return Response.json({ error: "Forbidden — admin or agent only" }, { status: 403 });
    }

    const all = await base44.asServiceRole.entities.Property.filter(
      {},
      { limit: 500, sort: "created_date" }
    );
    const items = all.items || all;

    const norm = (s) =>
      (s || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    const seen = new Set();
    const updates = [];
    let imagesFixed = 0;
    let deadImagesReplaced = 0;
    let duplicatesWithdrawn = 0;
    let incompleteWithdrawn = 0;
    const toValidate = [];

    for (const p of items) {
      const patch = {};
      const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
      if (imgs.length === 0) {
        patch.images = [FALLBACK_IMAGE];
        imagesFixed++;
      } else if (validateImages) {
        toValidate.push({ p, imgs });
      }

      const key = norm(p.address) + "|" + norm(p.city) + "|" + norm(p.state);
      if (key && key !== "||") {
        if (seen.has(key)) {
          if (p.status !== "Withdrawn") {
            patch.status = "Withdrawn";
            duplicatesWithdrawn++;
          }
        } else {
          seen.add(key);
        }
      }

      if (!p.title || !p.address || p.asking_price == null || !p.category) {
        if (p.status !== "Withdrawn") {
          patch.status = "Withdrawn";
          incompleteWithdrawn++;
        }
      }

      if (Object.keys(patch).length) updates.push({ id: p.id, ...patch });
    }

    if (validateImages && toValidate.length) {
      const capped = toValidate.slice(0, 120);
      const results = await pool(capped, async ({ p, imgs }) => {
        const alive = await isImageAlive(imgs[0]);
        return { p, imgs, alive };
      });
      for (const { p, imgs, alive } of results) {
        if (!alive) {
          const existing = updates.find((u) => u.id === p.id);
          const newImgs = [FALLBACK_IMAGE, ...imgs.slice(1)];
          if (existing) {
            existing.images = newImgs;
          } else {
            updates.push({ id: p.id, images: newImgs });
          }
          deadImagesReplaced++;
        }
      }
    }

    if (updates.length) {
      await base44.asServiceRole.entities.Property.bulkUpdate(updates);
    }

    return Response.json({
      total: items.length,
      imagesFixed,
      deadImagesReplaced,
      duplicatesWithdrawn,
      incompleteWithdrawn,
      updated: updates.length,
      validated: validateImages ? Math.min(toValidate.length, 120) : 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}