import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Server-side property stats via aggregate + count.
 * Subscribes to property changes so stats stay live.
 */
export function usePropertyStats(query = { status: "Active" }) {
  const [stats, setStats] = useState({ totalDeals: 0, avgRoi: 0, totalEquity: 0 });
  const [loading, setLoading] = useState(true);

  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    try {
      const q = JSON.parse(queryKey);
      const [count, agg] = await Promise.all([
        base44.entities.Property.count(q),
        base44.entities.Property.aggregate({ query: q, avg: "projected_roi", sum: ["arv", "asking_price"] }),
      ]);
      const row = (agg.rows && agg.rows[0]) || {};
      setStats({
        totalDeals: count,
        avgRoi: Math.round(row.avg_projected_roi || 0),
        totalEquity: Math.round((row.sum_arv || 0) - (row.sum_asking_price || 0)),
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Property.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  return { stats, loading };
}