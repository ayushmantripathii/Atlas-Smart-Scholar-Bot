"use client";

import { useCallback, useEffect, useState } from "react";
import type { Upload } from "@/types";

/**
 * Hook to fetch the current user's uploaded files from /api/uploads.
 * Returns the list, loading state, error, and a refetch function.
 */
export function useUserUploads() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/uploads");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to load uploads.");
        return;
      }

      const data: Upload[] = await res.json();
      setUploads(data);
    } catch {
      setError("Failed to fetch uploads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  return { uploads, loading, error, refetch: fetchUploads };
}
