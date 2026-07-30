import { useCallback, useEffect, useRef, useState } from 'react';

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
  /** True while a manual pull-to-refresh is in flight — drives
   * RefreshControl's `refreshing` prop. */
  isRefreshing: boolean;
  error: unknown;
  /** Force a fresh fetch right now (pull-to-refresh), bypassing nothing —
   * there's no time-based staleness in this cache, so this is the only way
   * to guarantee the very latest data (e.g. right after an admin edit). */
  refetch: () => Promise<void>;
};

/** Stale-while-revalidate GET. Returns cached data instantly (if any) with
 * isLoading=false, then always revalidates in the background. Pass a stable
 * `path` (changing it triggers a fresh fetch, e.g. a product handle). */
export function useApiQuery<T>(path: string | null): QueryState<T> {
  const cached = path ? getCachedApi<T>(path) : undefined;
  const [data, setData] = useState<T | undefined>(cached);
  const [isLoading, setIsLoading] = useState(path != null && cached === undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    const instanceId = Math.random().toString(36).slice(2, 8);
    console.log(`[useApiQuery:${instanceId}] GET ${path} — starting`);

    // Belt-and-suspenders: api.get() already races its own fetch against a
    // 15s timeout, but the vehicles screen has shown isLoading getting stuck
    // even after the fetch/json-parse steps logged as complete — something
    // downstream of that isn't reliably reaching this component's state.
    // Whatever the exact cause, this effect must never leave isLoading stuck
    // forever, so force it to settle on its own after a hard ceiling.
    const hardStop = setTimeout(() => {
      console.log(`[useApiQuery:${instanceId}] GET ${path} — hard-stop fired, forcing isLoading=false`);
      if (cancelled) return;
      setIsLoading(false);
      if (getCachedApi<T>(path) === undefined) {
        setError(new Error('Timed out waiting for a response.'));
      }
    }, 20000);

    api
      .get<T>(path)
      .then((fresh) => {
        console.log(`[useApiQuery:${instanceId}] GET ${path} — resolved, cancelled=${cancelled}`);
        clearTimeout(hardStop);
        if (cancelled) return;
        cache.set(path, fresh);
        setData(fresh);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.log(`[useApiQuery:${instanceId}] GET ${path} — rejected, cancelled=${cancelled}, err=${err instanceof Error ? err.message : String(err)}`);
        clearTimeout(hardStop);
        if (cancelled) return;
        setIsLoading(false);
        // Keep showing stale cached data on a background-refresh failure —
        // only surface the error when there was nothing to show at all.
        if (getCachedApi<T>(path) === undefined) setError(err);
      });

    return () => {
      console.log(`[useApiQuery:${instanceId}] GET ${path} — cleanup (unmount or path change)`);
      cancelled = true;
      clearTimeout(hardStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const refetch = useCallback(async () => {
    if (!path) return;
    console.log(`[useApiQuery] GET ${path} — refetch() called`);
    setIsRefreshing(true);
    try {
      const fresh = await api.get<T>(path);
      cache.set(path, fresh);
      setData(fresh);
      // Whichever path actually landed fresh data, the full-page spinner
      // must never keep showing on top of it — vehicles was observed
      // getting data through this function while isLoading (only ever
      // cleared by the mount effect above) stayed stuck true forever.
      setIsLoading(false);
      setError(null);
    } catch (err) {
      if (getCachedApi<T>(path) === undefined) setError(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [path]);

  return { data, isLoading, isRefreshing, error, refetch };
}
