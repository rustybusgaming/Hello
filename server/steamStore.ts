import fs from 'fs';
import path from 'path';

/**
 * Steam store metadata: descriptions, genres, developers, release dates, screenshots.
 *
 * This comes from the store's `appdetails` endpoint, which is public but undocumented and
 * rate-limited (commonly about 200 requests per five minutes per address), with no promise it
 * stays the same. So it is used carefully and never relied on:
 *
 *   - one request per game, only when someone opens that game's page;
 *   - answers cached on disk for a week (a week's absence is cached for a day);
 *   - concurrent requests for one game share a single call;
 *   - a budget of 100 calls per five minutes, and five minutes' silence after a 429;
 *   - any failure returns what is cached, or nothing, and the page carries on without it.
 *
 * Ownership, playtime and achievements still come from the official Web API (server/steam.ts).
 */

export interface StoreScreenshot {
  thumb: string;
  full: string;
}

export interface StoreDetails {
  appId: number;
  type: string;
  name: string;
  description: string;
  genres: string[];
  categories: string[];
  developers: string[];
  publishers: string[];
  releaseDate: string | null;
  comingSoon: boolean;
  platforms: { windows: boolean; mac: boolean; linux: boolean };
  controllerSupport: 'full' | 'partial' | null;
  metacritic: { score: number; url: string | null } | null;
  isFree: boolean;
  website: string | null;
  screenshots: StoreScreenshot[];
}

export type StoreState = 'ok' | 'missing' | 'unavailable';

export interface StoreResult {
  state: StoreState;
  details: StoreDetails | null;
  /** When the cached answer came from Steam; null when there is none */
  fetchedAt: string | null;
  /** True when this is an older answer served because Steam could not be asked now */
  stale: boolean;
}

interface CacheEntry {
  fetchedAt: string;
  state: 'ok' | 'missing';
  details: StoreDetails | null;
}

type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
}>;

const OK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MISSING_TTL_MS = 24 * 60 * 60 * 1000;
const BUDGET = 100;
const BUDGET_WINDOW_MS = 5 * 60 * 1000;
const BACKOFF_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 5000;

/** Store text arrives with HTML entities and the odd tag; the page wants plain words. */
export function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const httpsOnly = (url: unknown): string | null =>
  typeof url === 'string' && /^https:\/\//.test(url) ? url : null;

/** Keep only what the hub shows, checked and in plain text. */
export function parseAppDetails(appId: number, body: any): CacheEntry['details'] | 'missing' {
  const entry = body?.[String(appId)];
  if (!entry || entry.success !== true || !entry.data || typeof entry.data !== 'object') return 'missing';
  const d = entry.data;
  const strings = (list: unknown) => (Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string' && !!s.trim()) : []);
  const described = (list: unknown) =>
    Array.isArray(list) ? list.map((x: any) => (typeof x?.description === 'string' ? x.description : '')).filter(Boolean) : [];

  return {
    appId,
    type: typeof d.type === 'string' ? d.type : 'unknown',
    name: typeof d.name === 'string' ? plainText(d.name) : `App ${appId}`,
    description: typeof d.short_description === 'string' ? plainText(d.short_description) : '',
    genres: described(d.genres),
    categories: described(d.categories),
    developers: strings(d.developers),
    publishers: strings(d.publishers),
    releaseDate: typeof d.release_date?.date === 'string' && d.release_date.date.trim() ? d.release_date.date.trim() : null,
    comingSoon: d.release_date?.coming_soon === true,
    platforms: {
      windows: d.platforms?.windows === true,
      mac: d.platforms?.mac === true,
      linux: d.platforms?.linux === true
    },
    controllerSupport: d.controller_support === 'full' || d.controller_support === 'partial' ? d.controller_support : null,
    metacritic: typeof d.metacritic?.score === 'number' ? { score: d.metacritic.score, url: httpsOnly(d.metacritic.url) } : null,
    isFree: d.is_free === true,
    website: httpsOnly(d.website),
    screenshots: (Array.isArray(d.screenshots) ? d.screenshots : [])
      .map((s: any) => ({ thumb: httpsOnly(s?.path_thumbnail), full: httpsOnly(s?.path_full) }))
      .filter((s: { thumb: string | null; full: string | null }): s is StoreScreenshot => !!s.thumb && !!s.full)
      .slice(0, 8)
  };
}

export function createSteamStore(
  dir: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  base = (process.env.STEAM_STORE_BASE || 'https://store.steampowered.com').replace(/\/$/, '')
) {
  const file = path.join(dir, 'steam-store.json');
  const inFlight = new Map<number, Promise<StoreResult>>();
  let calls: number[] = [];
  let quietUntil = 0;

  function readAll(): Record<string, CacheEntry> {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeEntry(appId: number, entry: CacheEntry) {
    const all = readAll();
    all[appId] = entry;
    const ids = Object.keys(all);
    if (ids.length > MAX_ENTRIES) {
      ids.sort((a, b) => all[a].fetchedAt.localeCompare(all[b].fetchedAt)).slice(0, ids.length - MAX_ENTRIES).forEach(id => delete all[id]);
    }
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(all));
    fs.renameSync(tmp, file);
  }

  const fromCache = (entry: CacheEntry, stale: boolean): StoreResult => ({
    state: entry.state,
    details: entry.details,
    fetchedAt: entry.fetchedAt,
    stale
  });

  const unavailable = (cached: CacheEntry | undefined): StoreResult =>
    cached ? fromCache(cached, true) : { state: 'unavailable', details: null, fetchedAt: null, stale: false };

  function withinBudget(now: number): boolean {
    if (now < quietUntil) return false;
    calls = calls.filter(t => now - t < BUDGET_WINDOW_MS);
    return calls.length < BUDGET;
  }

  async function ask(appId: number, cached: CacheEntry | undefined): Promise<StoreResult> {
    const now = Date.now();
    if (!withinBudget(now)) return unavailable(cached);
    calls.push(now);

    try {
      const res = await fetchImpl(`${base}/api/appdetails?appids=${appId}&l=english`, {
        headers: { 'User-Agent': 'FlashHub/2.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.status === 429 || res.status === 403) {
        // Steam is telling the hub to slow down: go quiet for a while
        quietUntil = Date.now() + BACKOFF_MS;
        return unavailable(cached);
      }
      if (!res.ok) return unavailable(cached);
      const parsed = parseAppDetails(appId, await res.json());
      const entry: CacheEntry =
        parsed === 'missing'
          ? { fetchedAt: new Date().toISOString(), state: 'missing', details: null }
          : { fetchedAt: new Date().toISOString(), state: 'ok', details: parsed };
      writeEntry(appId, entry);
      return fromCache(entry, false);
    } catch {
      return unavailable(cached);
    }
  }

  /** Store details for one app: cached when fresh, asked for when not, never thrown. */
  async function getDetails(appId: number): Promise<StoreResult> {
    if (!Number.isInteger(appId) || appId <= 0) return { state: 'missing', details: null, fetchedAt: null, stale: false };
    const cached = readAll()[appId];
    if (cached) {
      const age = Date.now() - Date.parse(cached.fetchedAt);
      if (age < (cached.state === 'ok' ? OK_TTL_MS : MISSING_TTL_MS)) return fromCache(cached, false);
    }
    const pending = inFlight.get(appId);
    if (pending) return pending;
    const request = ask(appId, cached).finally(() => inFlight.delete(appId));
    inFlight.set(appId, request);
    return request;
  }

  /** Only what is already cached, for when the hub must not spend a request. */
  function peek(appId: number): StoreDetails | null {
    const cached = readAll()[appId];
    return cached?.state === 'ok' ? cached.details : null;
  }

  return { getDetails, peek };
}

export type SteamStore = ReturnType<typeof createSteamStore>;
