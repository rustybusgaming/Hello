import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Local play history: when each game was last launched, how long it has been played and how
 * many sessions it has had, measured by the player's own session timer.
 *
 * Stage 1 keeps this in the browser. The shape is the one the account will store in stage 2,
 * so syncing it is a matter of sending these records up, not reworking the screens.
 */

export interface PlayRecord {
  /** ISO time of the last launch; null for entries carried over from the old id-only list */
  lastPlayedAt: string | null;
  totalSeconds: number;
  sessions: number;
}

export type PlayHistory = Record<string, PlayRecord>;

const KEY = 'flashhub-play-history';
const LEGACY_KEY = 'flashhub-recently-played';
const MAX_ENTRIES = 500;

function read(): PlayHistory {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as PlayHistory;
    }
    // Older builds kept only the ids of the last eight games, newest first. They carry over
    // with no time attached: their order is known, when they were played is not.
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const ids = JSON.parse(legacy);
      if (Array.isArray(ids)) {
        const migrated: PlayHistory = {};
        ids.filter((id): id is string => typeof id === 'string').forEach(id => {
          migrated[id] = { lastPlayedAt: null, totalSeconds: 0, sessions: 0 };
        });
        return migrated;
      }
    }
  } catch {
    /* private mode or corrupt storage: start empty */
  }
  return {};
}

function write(history: PlayHistory) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    /* quota or private mode: history lives for this visit only */
  }
}

/** Keys ordered by last launch, newest first; untimed legacy entries keep their old order after. */
export function orderByRecency(history: PlayHistory, legacyOrder: string[] = []): string[] {
  const timed = Object.entries(history)
    .filter(([, r]) => r.lastPlayedAt)
    .sort((a, b) => (b[1].lastPlayedAt as string).localeCompare(a[1].lastPlayedAt as string))
    .map(([key]) => key);
  const untimed = Object.entries(history)
    .filter(([, r]) => !r.lastPlayedAt)
    .map(([key]) => key)
    .sort((a, b) => {
      const ia = legacyOrder.indexOf(a);
      const ib = legacyOrder.indexOf(b);
      return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
    });
  return [...timed, ...untimed];
}

export function usePlayHistory() {
  const [history, setHistory] = useState<PlayHistory>(read);
  const [legacyOrder] = useState<string[]>(() => {
    try {
      const ids = JSON.parse(window.localStorage.getItem(LEGACY_KEY) || '[]');
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  });

  useEffect(() => write(history), [history]);

  // Another tab played something: pick it up
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setHistory(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const recordLaunch = useCallback((key: string) => {
    setHistory(prev => {
      const current = prev[key] || { lastPlayedAt: null, totalSeconds: 0, sessions: 0 };
      const next: PlayHistory = { ...prev, [key]: { ...current, lastPlayedAt: new Date().toISOString() } };
      const keys = Object.keys(next);
      if (keys.length > MAX_ENTRIES) {
        // Forget the games played longest ago
        orderByRecency(next).slice(MAX_ENTRIES).forEach(k => delete next[k]);
      }
      return next;
    });
  }, []);

  /** Bank a finished session. Sessions under five seconds are a misclick, not a session. */
  const recordSession = useCallback((key: string, seconds: number) => {
    if (seconds < 5) return;
    setHistory(prev => {
      const current = prev[key] || { lastPlayedAt: new Date().toISOString(), totalSeconds: 0, sessions: 0 };
      return {
        ...prev,
        [key]: { ...current, totalSeconds: current.totalSeconds + Math.round(seconds), sessions: current.sessions + 1 }
      };
    });
  }, []);

  const recentKeys = useMemo(() => orderByRecency(history, legacyOrder), [history, legacyOrder]);

  return { history, recentKeys, recordLaunch, recordSession };
}
