import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCollection, PlayRecord, UserAccount } from '../types';
import { useLocalStorage } from './hooks';
import { PlayHistory, orderByRecency, usePlayHistory } from './playHistory';

/**
 * Favourites, collections and play history, from the account when signed in and from this
 * browser when not.
 *
 * Signing in folds the browser's history into the account every time (the server keeps the
 * larger of each figure, so repeating it cannot inflate anything) and adds this browser's
 * favourites to the account's once. From then on the account is the record: changes are
 * applied on screen at once and sent to the server, and put back if the server refuses.
 */

interface AccountState {
  favourites: string[];
  collections: GameCollection[];
  history: PlayHistory;
}

export interface SessionResult {
  /** The account after banking the session, when signed in */
  user?: UserAccount;
}

const json = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.status !== 'ok') throw new Error(body?.error || `HTTP ${res.status}`);
  return body.data as T;
}

export function useAccountLibrary(user: UserAccount | null) {
  const [localFavourites, setLocalFavourites] = useLocalStorage<string[]>('flashhub-favorites', []);
  const local = usePlayHistory();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [syncError, setSyncError] = useState(false);
  const userId = user?.id || null;

  // The latest local values, read by the sign-in sync without re-running it on every change
  const localRef = useRef({ history: local.history, favourites: localFavourites });
  localRef.current = { history: local.history, favourites: localFavourites };

  const loadAccount = useCallback(async (id: string) => {
    const mergedFlag = `flashhub-favourites-merged-${id}`;
    try {
      await api('/api/play/history/import', json({ history: localRef.current.history }));
      let alreadyMerged = false;
      try {
        alreadyMerged = window.localStorage.getItem(mergedFlag) === '1';
      } catch { /* private mode */ }
      if (!alreadyMerged && localRef.current.favourites.length) {
        await api('/api/library/favourites/merge', json({ keys: localRef.current.favourites }));
      }
      try {
        window.localStorage.setItem(mergedFlag, '1');
      } catch { /* private mode */ }

      const [lib, history] = await Promise.all([
        api<{ favourites: string[]; collections: GameCollection[] }>('/api/library/me'),
        api<PlayHistory>('/api/play/history')
      ]);
      setAccount({ favourites: lib.favourites, collections: lib.collections, history });
      setSyncError(false);
    } catch {
      // The account could not be read: carry on with this browser's copy and say so
      setAccount(null);
      setSyncError(true);
    }
  }, []);

  useEffect(() => {
    setAccount(null);
    setSyncError(false);
    if (userId) loadAccount(userId);
  }, [userId, loadAccount]);

  const favourites = account ? account.favourites : localFavourites;
  const history = account ? account.history : local.history;
  const recentKeys = useMemo(() => (account ? orderByRecency(account.history) : local.recentKeys), [account, local.recentKeys]);
  const collections = account?.collections ?? [];

  const toggleFavourite = useCallback(
    (key: string) => {
      if (!account) {
        setLocalFavourites(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
        return;
      }
      const before = account.favourites;
      const next = before.includes(key) ? before.filter(k => k !== key) : [...before, key];
      setAccount(a => (a ? { ...a, favourites: next } : a));
      fetch('/api/library/favourites', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: next }) })
        .then(res => {
          if (!res.ok) throw new Error();
        })
        .catch(() => setAccount(a => (a ? { ...a, favourites: before } : a)));
    },
    [account, setLocalFavourites]
  );

  const recordLaunch = useCallback(
    (key: string) => {
      local.recordLaunch(key);
      setAccount(a => {
        if (!a) return a;
        const current: PlayRecord = a.history[key] || { lastPlayedAt: null, totalSeconds: 0, sessions: 0 };
        return { ...a, history: { ...a.history, [key]: { ...current, lastPlayedAt: new Date().toISOString() } } };
      });
    },
    [local]
  );

  /**
   * A sitting ended. It goes into this browser's history, and to the server, which counts the
   * play for everyone and, when signed in, banks it on the account.
   */
  const finishSession = useCallback(
    async (key: string, seconds: number): Promise<SessionResult> => {
      local.recordSession(key, seconds);
      if (seconds < 1) return {};
      try {
        const res = await fetch('/api/play/session', json({ gameId: key, seconds: Math.round(seconds) }));
        const body = await res.json().catch(() => null);
        if (res.ok && body?.record) {
          setAccount(a => (a ? { ...a, history: { ...a.history, [key]: body.record } } : a));
        }
        return { user: body?.user };
      } catch {
        return {};
      }
    },
    [local]
  );

  /** Take a game out of recently played: this browser's copy and, signed in, the account's. */
  const removeFromHistory = useCallback(
    async (key: string) => {
      local.removeEntry(key);
      if (!account) return;
      const before = account.history;
      setAccount(a => {
        if (!a) return a;
        const next = { ...a.history };
        delete next[key];
        return { ...a, history: next };
      });
      const res = await fetch(`/api/play/history/${encodeURIComponent(key)}`, { method: 'DELETE' }).catch(() => null);
      if (!res || (!res.ok && res.status !== 404)) setAccount(a => (a ? { ...a, history: before } : a));
    },
    [account, local]
  );

  // --- Collections (account only) ---

  const replaceCollection = (updated: GameCollection) =>
    setAccount(a => (a ? { ...a, collections: a.collections.map(c => (c.id === updated.id ? updated : c)) } : a));

  const createCollection = useCallback(async (name: string, keys: string[] = []): Promise<GameCollection> => {
    const created = await api<GameCollection>('/api/library/collections', json({ name, keys }));
    setAccount(a => (a ? { ...a, collections: [...a.collections, created] } : a));
    return created;
  }, []);

  const renameCollection = useCallback(async (id: string, name: string) => {
    replaceCollection(
      await api<GameCollection>(`/api/library/collections/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
    );
  }, []);

  const setCollectionKeys = useCallback(async (id: string, keys: string[]) => {
    replaceCollection(
      await api<GameCollection>(`/api/library/collections/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys })
      })
    );
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    await api(`/api/library/collections/${encodeURIComponent(id)}`, { method: 'DELETE' });
    setAccount(a => (a ? { ...a, collections: a.collections.filter(c => c.id !== id) } : a));
  }, []);

  return {
    /** True once the account's copy is loaded; false while signed out or if it failed */
    synced: !!account,
    syncError,
    favourites,
    toggleFavourite,
    history,
    recentKeys,
    recordLaunch,
    finishSession,
    removeFromHistory,
    collections,
    createCollection,
    renameCollection,
    setCollectionKeys,
    deleteCollection
  };
}
