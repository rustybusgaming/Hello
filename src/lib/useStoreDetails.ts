import { useEffect, useState } from 'react';
import { StoreResult } from '../types';

/**
 * Steam store details for one app, fetched when a page that shows them opens. Answers are
 * kept for the visit, so going back to a game does not ask again; the server keeps its own
 * cache on disk and decides when to ask Steam.
 */

export type StoreLoad = { status: 'loading' } | { status: 'done'; result: StoreResult } | { status: 'refused' };

const memory = new Map<number, StoreResult>();
const pending = new Map<number, Promise<StoreResult | null>>();

function load(appId: number): Promise<StoreResult | null> {
  const known = memory.get(appId);
  if (known) return Promise.resolve(known);
  const inFlight = pending.get(appId);
  if (inFlight) return inFlight;
  const request = fetch(`/api/steam/store/${appId}`)
    .then(async res => {
      if (!res.ok) return null;
      const body = await res.json().catch(() => null);
      const result = body?.status === 'ok' ? (body.data as StoreResult) : null;
      // An answer worth keeping; "unavailable" is asked again next time
      if (result && result.state !== 'unavailable') memory.set(appId, result);
      return result;
    })
    .catch(() => null)
    .finally(() => pending.delete(appId));
  pending.set(appId, request);
  return request;
}

/** What is already known about an app without asking, for features that must not spend requests. */
export function knownStoreDetails(appId: number): StoreResult | undefined {
  return memory.get(appId);
}

export function useStoreDetails(appId: number | null | undefined): StoreLoad | null {
  const [state, setState] = useState<StoreLoad | null>(() => {
    if (!appId) return null;
    const known = memory.get(appId);
    return known ? { status: 'done', result: known } : { status: 'loading' };
  });

  useEffect(() => {
    if (!appId) {
      setState(null);
      return;
    }
    let cancelled = false;
    const known = memory.get(appId);
    setState(known ? { status: 'done', result: known } : { status: 'loading' });
    if (!known) {
      load(appId).then(result => {
        if (!cancelled) setState(result ? { status: 'done', result } : { status: 'refused' });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [appId]);

  return state;
}

/** Several apps at once (a handful at most), for recommendations seeded by Steam games. */
export function useStoreDetailsFor(appIds: number[]): Map<number, StoreResult> {
  const [results, setResults] = useState<Map<number, StoreResult>>(() => new Map());
  const key = appIds.join(',');

  useEffect(() => {
    let cancelled = false;
    Promise.all(appIds.map(id => load(id).then(r => [id, r] as const))).then(pairs => {
      if (cancelled) return;
      const next = new Map<number, StoreResult>();
      for (const [id, r] of pairs) if (r) next.set(id, r);
      setResults(next);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return results;
}
