"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkItem } from "@/lib/dev/types";

export function useDevWorkItems(projectId: string | undefined) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/work-items?projectId=${projectId}`);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refresh: fetchItems, setItems };
}
