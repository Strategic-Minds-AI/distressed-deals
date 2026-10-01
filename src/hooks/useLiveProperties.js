import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Loads a page of properties and subscribes to realtime changes so the
 * list stays perfectly in sync without a manual refresh.
 */
export function useLiveProperties(query, options = {}) {
  const { sort = "-created_date", limit = 100 } = options;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    try {
      const q = JSON.parse(queryKey);
      const res = await base44.entities.Property.filter(q, { sort, limit });
      setItems(res.items || res);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [queryKey, sort, limit]);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Property.subscribe(() => {
      // Refetch on any property create/update/delete for a perfectly clean view.
      load();
    });
    return unsubscribe;
  }, [load]);

  return { items, loading, error, refresh: load };
}