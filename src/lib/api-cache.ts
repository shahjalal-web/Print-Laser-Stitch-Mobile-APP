import { useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api';

/** Module-level cache (survives across screens/remounts for the lifetime of
 * the JS runtime, cleared on app restart) — the RN equivalent of what the
 * website gets for free from Next.js's per-route data cache + revalidate.
 * Stale-while-revalidate: a cached value renders immediately (no spinner),
 * while a background refetch keeps it fresh for next time. */
const cache = new Map<string, unknown>();

export function primeApiCache<T>(path: string, value: T): void {
  cache.set(path, value);
}

export function getCachedApi<T>(path: string): T | undefined {
  return cache.get(path) as T | undefined;
}

type QueryState<T> = {
  data: T | undefined;
  /** True only on a hard miss (no cached value to show while fetching). */
  isLoading: boolean;
  error: unknown;
};

/** Stale-while-revalidate GET. Returns cached data instantly (if any) with
 * isLoading=false, then always revalidates in the background. Pass a stable
 * `path` (changing it triggers a fresh fetch, e.g. a product handle). */
export function useApiQuery<T>(path: string | null): QueryState<T> {
  const cached = path ? getCachedApi<T>(path) : undefined;
  const [data, setData] = useState<T | undefined>(cached);
  const [isLoading, setIsLoading] = useState(path != null && cached === undefined);
  const [error, setError] = useState<unknown>(null);
  const lastPath = useRef(path);

  useEffect(() => {
    if (!path) return;
    // Reset to this path's cached value (or loading) when the path itself
    // changes — e.g. navigating from one product handle to another re-uses
    // this same mounted hook instance in some navigators.
    if (lastPath.current !== path) {
      const next = getCachedApi<T>(path);
      setData(next);
      setIsLoading(next === undefined);
      setError(null);
      lastPath.current = path;
    }

    let cancelled = false;
    api
      .get<T>(path)
      .then((fresh) => {
        if (cancelled) return;
        cache.set(path, fresh);
        setData(fresh);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setIsLoading(false);
        // Keep showing stale cached data on a background-refresh failure —
        // only surface the error when there was nothing to show at all.
        if (getCachedApi<T>(path) === undefined) setError(err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, isLoading, error };
}
