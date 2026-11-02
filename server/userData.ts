import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Everything the library keeps per player and per game, on disk beside the accounts:
 *
 *   user-library.json     userId -> { favourites, collections }
 *   play-history.json     userId -> { libraryKey -> { lastPlayedAt, totalSeconds, sessions } }
 *   play-stats.json       gameId -> { total, days: { YYYY-MM-DD -> plays } }
 *   catalogue-dates.json  { baselineAt, games: { gameId -> addedAt | null } }
 *   steam-libraries.json  steamId -> the last owned-games list Steam returned
 *
 * Every number here is counted, never estimated. Writes go through a temp file so a crash
 * mid-write cannot truncate a store.
 */

export interface PlayRecord {
  lastPlayedAt: string | null;
  totalSeconds: number;
  sessions: number;
}

export interface Collection {
  id: string;
  name: string;
  keys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserLibrary {
  favourites: string[];
  collections: Collection[];
}

export interface SteamSnapshot<T = unknown> {
  fetchedAt: string;
  data: T;
}

interface PlayStats {
  [gameId: string]: { total: number; days: Record<string, number> };
}

interface CatalogueDates {
  baselineAt: string;
  games: Record<string, string | null>;
}

export const LIMITS = {
  favourites: 2000,
  collections: 100,
  collectionName: 60,
  keysPerCollection: 2000,
  historyEntries: 2000,
  /** One sitting is capped at a day: anything longer is a bad clock, not a session */
  sessionSeconds: 24 * 60 * 60,
  /** A sitting shorter than this is a misclick, not a play */
  playThresholdSeconds: 30,
  /** The same player starting the same game again within this window is one play */
  playDedupeMs: 30 * 60 * 1000,
  statsDays: 90
};

/** A library key is a Flashhub game id or steam:<appId>. Anything else is refused. */
export function isLibraryKey(value: unknown): value is string {
  return typeof value === 'string' && (/^steam:\d{1,10}$/.test(value) || /^[A-Za-z0-9][\w.-]{0,159}$/.test(value));
}

export function cleanKeys(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const k of value) {
    if (!isLibraryKey(k)) return null;
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
  }
  return keys.length <= max ? keys : null;
}

function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.replace(/\s+/g, ' ').trim();
  return name && name.length <= LIMITS.collectionName ? name : null;
}

function dayKey(at: Date): string {
  return at.toISOString().slice(0, 10);
}

export function createUserDataStore(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = (name: string) => path.join(dir, name);

  function read<T>(name: string, fallback: T): T {
    try {
      const raw = fs.readFileSync(file(name), 'utf8').trim();
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(name: string, value: unknown) {
    const target = file(name);
    const tmp = `${target}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, target);
  }

  // --- Favourites and collections -----------------------------------------------------

  function getLibrary(userId: string): UserLibrary {
    const all = read<Record<string, UserLibrary>>('user-library.json', {});
    const mine = all[userId];
    return {
      favourites: Array.isArray(mine?.favourites) ? mine.favourites : [],
      collections: Array.isArray(mine?.collections) ? mine.collections : []
    };
  }

  function updateLibrary(userId: string, change: (lib: UserLibrary) => UserLibrary): UserLibrary {
    const all = read<Record<string, UserLibrary>>('user-library.json', {});
    const next = change(getLibrary(userId));
    all[userId] = next;
    write('user-library.json', all);
    return next;
  }

  /** Replace the favourites. Returns null when the list is not a valid set of keys. */
  function setFavourites(userId: string, value: unknown): UserLibrary | null {
    const keys = cleanKeys(value, LIMITS.favourites);
    if (!keys) return null;
    return updateLibrary(userId, lib => ({ ...lib, favourites: keys }));
  }

  /** Add favourites without removing any: how a browser's local list joins the account. */
  function mergeFavourites(userId: string, value: unknown): UserLibrary | null {
    const incoming = cleanKeys(value, LIMITS.favourites);
    if (!incoming) return null;
    return updateLibrary(userId, lib => {
      const merged = [...lib.favourites];
      for (const k of incoming) if (!merged.includes(k)) merged.push(k);
      return { ...lib, favourites: merged.slice(0, LIMITS.favourites) };
    });
  }

  function createCollection(userId: string, nameValue: unknown, keysValue: unknown = []): Collection | 'invalid' | 'limit' {
    const name = cleanName(nameValue);
    const keys = cleanKeys(keysValue, LIMITS.keysPerCollection);
    if (!name || !keys) return 'invalid';
    if (getLibrary(userId).collections.length >= LIMITS.collections) return 'limit';
    const now = new Date().toISOString();
    const collection: Collection = { id: `col_${crypto.randomBytes(6).toString('hex')}`, name, keys, createdAt: now, updatedAt: now };
    updateLibrary(userId, lib => ({ ...lib, collections: [...lib.collections, collection] }));
    return collection;
  }

  function updateCollection(userId: string, id: string, patch: { name?: unknown; keys?: unknown }): Collection | 'invalid' | 'missing' {
    const lib = getLibrary(userId);
    const existing = lib.collections.find(c => c.id === id);
    if (!existing) return 'missing';
    const name = patch.name === undefined ? existing.name : cleanName(patch.name);
    const keys = patch.keys === undefined ? existing.keys : cleanKeys(patch.keys, LIMITS.keysPerCollection);
    if (!name || !keys) return 'invalid';
    const updated: Collection = { ...existing, name, keys, updatedAt: new Date().toISOString() };
    updateLibrary(userId, l => ({ ...l, collections: l.collections.map(c => (c.id === id ? updated : c)) }));
    return updated;
  }

  function deleteCollection(userId: string, id: string): boolean {
    const lib = getLibrary(userId);
    if (!lib.collections.some(c => c.id === id)) return false;
    updateLibrary(userId, l => ({ ...l, collections: l.collections.filter(c => c.id !== id) }));
    return true;
  }

  // --- Play history ---------------------------------------------------------------------

  function getHistory(userId: string): Record<string, PlayRecord> {
    const all = read<Record<string, Record<string, PlayRecord>>>('play-history.json', {});
    return all[userId] || {};
  }

  function saveHistory(userId: string, history: Record<string, PlayRecord>) {
    const all = read<Record<string, Record<string, PlayRecord>>>('play-history.json', {});
    // Keep the most recently played entries if a history ever grows past the cap
    const keys = Object.keys(history);
    if (keys.length > LIMITS.historyEntries) {
      keys
        .sort((a, b) => (history[b].lastPlayedAt || '').localeCompare(history[a].lastPlayedAt || ''))
        .slice(LIMITS.historyEntries)
        .forEach(k => delete history[k]);
    }
    all[userId] = history;
    write('play-history.json', all);
  }

  /** Bank one finished session. Returns the updated record, or null for an invalid one. */
  function recordSession(userId: string, key: unknown, secondsValue: unknown, at = new Date()): PlayRecord | null {
    const seconds = Math.round(Number(secondsValue));
    if (!isLibraryKey(key) || key.startsWith('steam:') || !Number.isFinite(seconds) || seconds < 1) return null;
    const history = getHistory(userId);
    const current = history[key] || { lastPlayedAt: null, totalSeconds: 0, sessions: 0 };
    const record: PlayRecord = {
      lastPlayedAt: at.toISOString(),
      totalSeconds: current.totalSeconds + Math.min(seconds, LIMITS.sessionSeconds),
      sessions: current.sessions + 1
    };
    history[key] = record;
    saveHistory(userId, history);
    return record;
  }

  /**
   * Fold a browser's local history into the account. Field by field the larger value wins,
   * never the sum: importing twice, or from two devices, can under-count but never inflate.
   */
  function importHistory(userId: string, value: unknown): Record<string, PlayRecord> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const history = getHistory(userId);
    for (const [key, raw] of Object.entries(value as Record<string, any>)) {
      if (!isLibraryKey(key) || key.startsWith('steam:') || !raw || typeof raw !== 'object') continue;
      const totalSeconds = Math.min(Math.max(0, Math.round(Number(raw.totalSeconds) || 0)), LIMITS.sessionSeconds * 365);
      const sessions = Math.min(Math.max(0, Math.round(Number(raw.sessions) || 0)), 100000);
      const at = typeof raw.lastPlayedAt === 'string' && !Number.isNaN(Date.parse(raw.lastPlayedAt)) && Date.parse(raw.lastPlayedAt) <= Date.now() + 60000
        ? new Date(raw.lastPlayedAt).toISOString()
        : null;
      const current = history[key] || { lastPlayedAt: null, totalSeconds: 0, sessions: 0 };
      history[key] = {
        lastPlayedAt: [current.lastPlayedAt, at].filter(Boolean).sort().pop() || null,
        totalSeconds: Math.max(current.totalSeconds, totalSeconds),
        sessions: Math.max(current.sessions, sessions)
      };
    }
    saveHistory(userId, history);
    return history;
  }

  // --- Play counts ----------------------------------------------------------------------

  const lastCounted = new Map<string, number>();

  /**
   * Count a play: a session of at least 30 seconds, once per player per game per half hour.
   * `actor` is the account id, or the caller's address for a guest.
   */
  function recordPlay(gameId: unknown, actor: string, secondsValue: unknown, at = new Date()): boolean {
    const seconds = Number(secondsValue);
    if (!isLibraryKey(gameId) || gameId.startsWith('steam:') || !Number.isFinite(seconds) || seconds < LIMITS.playThresholdSeconds) return false;
    const dedupeKey = `${actor}|${gameId}`;
    const previous = lastCounted.get(dedupeKey);
    if (previous !== undefined && at.getTime() - previous < LIMITS.playDedupeMs) return false;
    lastCounted.set(dedupeKey, at.getTime());
    if (lastCounted.size > 20000) {
      // Forget entries older than the window rather than growing without bound
      for (const [k, t] of lastCounted) if (at.getTime() - t > LIMITS.playDedupeMs) lastCounted.delete(k);
    }

    const stats = read<PlayStats>('play-stats.json', {});
    const entry = stats[gameId] || { total: 0, days: {} };
    const day = dayKey(at);
    entry.total += 1;
    entry.days[day] = (entry.days[day] || 0) + 1;
    // Only the recent days are needed for "popular"; the total keeps the rest
    const cutoff = dayKey(new Date(at.getTime() - LIMITS.statsDays * 86400000));
    for (const d of Object.keys(entry.days)) if (d < cutoff) delete entry.days[d];
    stats[gameId] = entry;
    write('play-stats.json', stats);
    return true;
  }

  /** Plays per game: all time, and within the last `days` days. */
  function getPlayCounts(days = 30, now = new Date()): Map<string, { total: number; recent: number }> {
    const stats = read<PlayStats>('play-stats.json', {});
    const cutoff = dayKey(new Date(now.getTime() - (days - 1) * 86400000));
    const out = new Map<string, { total: number; recent: number }>();
    for (const [id, entry] of Object.entries(stats)) {
      const recent = Object.entries(entry.days || {}).reduce((sum, [d, n]) => (d >= cutoff ? sum + n : sum), 0);
      out.set(id, { total: entry.total || 0, recent });
    }
    return out;
  }

  // --- Dates added ----------------------------------------------------------------------

  /**
   * Note which games are in the catalogue and since when. The first time this runs there is
   * no history to go on, so that whole catalogue is the baseline and gets no date: claiming it
   * all arrived today would be false. Games that appear later are dated when first seen, or
   * by their own upload date when they carry one.
   */
  function noteCatalogue(ids: string[], knownDates: Record<string, string> = {}, now = new Date()): { baselineAt: string; addedAt: Map<string, string | null> } {
    const stored = read<CatalogueDates | null>('catalogue-dates.json', null);
    const first = !stored || !stored.games;
    const record: CatalogueDates = first ? { baselineAt: now.toISOString(), games: {} } : stored!;
    let changed = first;

    for (const id of ids) {
      const known = knownDates[id] && !Number.isNaN(Date.parse(knownDates[id])) ? new Date(knownDates[id]).toISOString() : null;
      if (!(id in record.games)) {
        record.games[id] = known || (first ? null : now.toISOString());
        changed = true;
      } else if (known && record.games[id] !== known) {
        // An upload's own metadata is the better source than when the hub noticed it
        record.games[id] = known;
        changed = true;
      }
    }
    if (changed) write('catalogue-dates.json', record);
    return { baselineAt: record.baselineAt, addedAt: new Map(ids.map(id => [id, record.games[id] ?? null])) };
  }

  // --- Steam library snapshots --------------------------------------------------------

  function getSteamSnapshot<T>(steamId: string): SteamSnapshot<T> | null {
    const all = read<Record<string, SteamSnapshot<T>>>('steam-libraries.json', {});
    return all[steamId] || null;
  }

  function saveSteamSnapshot<T>(steamId: string, data: T, at = new Date()) {
    const all = read<Record<string, SteamSnapshot<T>>>('steam-libraries.json', {});
    all[steamId] = { fetchedAt: at.toISOString(), data };
    write('steam-libraries.json', all);
  }

  function dropSteamSnapshot(steamId: string) {
    const all = read<Record<string, SteamSnapshot>>('steam-libraries.json', {});
    if (all[steamId]) {
      delete all[steamId];
      write('steam-libraries.json', all);
    }
  }

  /** Remove everything held for an account, for account deletion. */
  function forgetUser(userId: string) {
    for (const name of ['user-library.json', 'play-history.json']) {
      const all = read<Record<string, unknown>>(name, {});
      if (userId in all) {
        delete all[userId];
        write(name, all);
      }
    }
  }

  return {
    getLibrary,
    setFavourites,
    mergeFavourites,
    createCollection,
    updateCollection,
    deleteCollection,
    getHistory,
    recordSession,
    importHistory,
    recordPlay,
    getPlayCounts,
    noteCatalogue,
    getSteamSnapshot,
    saveSteamSnapshot,
    dropSteamSnapshot,
    forgetUser
  };
}

export type UserDataStore = ReturnType<typeof createUserDataStore>;
