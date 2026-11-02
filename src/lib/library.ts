import { Game, SteamGameSummary } from '../types';
import { isFlashGame } from './games';
import { STATIC_PREVIEW, drawnCoverDataUri } from './preview';

/**
 * The unified library.
 *
 * Flashhub's own catalogue and a player's Steam library become one list of entries. Every entry
 * says where it launches: `flashhub` entries play in the hub's player, `steam` entries hand off
 * to the Steam client through a steam:// link. Nothing a Steam entry shows is invented: its
 * playtime and last-played time come from Steam's Web API, its art from Steam's image servers.
 */

export type LaunchTarget = 'flashhub' | 'steam';

/** How a game actually runs. The label the library shows beside the genre. */
export type Runtime = 'Flash' | 'HTML5' | 'WebGL' | 'Emulator' | 'Web port' | 'Steam';

export interface LibraryEntry {
  /** Stable key: the Flashhub game id, or `steam:<appId>` */
  key: string;
  title: string;
  launch: LaunchTarget;
  runtime: Runtime;
  /** Genres only; runtime tags such as "Flash" or "3D" are carried by `runtime` instead */
  genres: string[];
  /** Card art, and what to show when it fails to load */
  art: string;
  artFallback: string;
  /** Steam's wide library banner when the game has a Steam app id; may 404, so callers fall back */
  heroArt: string | null;
  steamAppId: number | null;
  description?: string;
  /** When the hub first had it; null for the catalogue it started with, undefined for Steam */
  addedAt?: string | null;
  /** Counted plays on this hub (Flashhub games only) */
  plays?: { total: number; recent: number };
  game?: Game;
  steam?: SteamGameSummary;
}

const STEAM_ASSETS = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps';

/** Tags in the catalogue that describe the runtime rather than the kind of game. */
const RUNTIME_TAGS = new Set(['flash', 'flash game', 'html5', 'html5 game', '3d', 'webport', 'web port', 'emulator', 'webgl', 'unity']);

export const RUNTIME_ORDER: Runtime[] = ['Flash', 'HTML5', 'WebGL', 'Web port', 'Emulator', 'Steam'];

export const RUNTIME_DESCRIPTION: Record<Runtime, string> = {
  Flash: 'Flash, played through the Ruffle emulator',
  HTML5: 'HTML5, runs natively in the browser',
  WebGL: 'WebGL build, runs in the browser',
  'Web port': 'A Unity or Godot web port',
  Emulator: 'A console emulator: load your own ROM',
  Steam: 'In your Steam library; opens in the Steam client'
};

function steamAppIdFromUrl(url: string | undefined): number | null {
  const match = url?.match(/steam\/apps\/(\d+)\//);
  return match ? Number(match[1]) : null;
}

function drawnCover(id: string, title: string): string {
  // The Pages preview has no server to draw covers, so it draws them itself
  if (STATIC_PREVIEW) return drawnCoverDataUri(id, title);
  return `/api/cover/${encodeURIComponent(id)}?title=${encodeURIComponent(title)}`;
}

/** Art the server serves (/api/...) does not exist in the Pages preview: use the drawn cover. */
function cardArt(thumbnail: string | undefined, id: string, title: string): string {
  if (!thumbnail || (STATIC_PREVIEW && thumbnail.startsWith('/api/'))) return drawnCover(id, title);
  return thumbnail;
}

export function runtimeOf(game: Game): Runtime {
  if (isFlashGame(game) || game.source === 'archive') return 'Flash';
  if (/\/api\/(webports|webport-proxy)\//.test(game.embedUrl)) return 'Web port';
  const tags = new Set(game.genres.map(g => g.toLowerCase()));
  if (tags.has('emulator')) return 'Emulator';
  if (tags.has('3d') || tags.has('webgl')) return 'WebGL';
  if (tags.has('webport')) return 'Web port';
  return 'HTML5';
}

export function steamHeroUrl(appId: number): string {
  return `${STEAM_ASSETS}/${appId}/library_hero.jpg`;
}

export function steamHeaderUrl(appId: number): string {
  return `${STEAM_ASSETS}/${appId}/header.jpg`;
}

export function fromGame(game: Game): LibraryEntry {
  const steamAppId = steamAppIdFromUrl(game.thumbnail);
  return {
    key: game.id,
    title: game.title,
    launch: 'flashhub',
    runtime: runtimeOf(game),
    genres: game.genres.filter(g => !RUNTIME_TAGS.has(g.toLowerCase())),
    art: cardArt(game.thumbnail, game.id, game.title),
    artFallback: drawnCover(game.id, game.title),
    heroArt: steamAppId ? steamHeroUrl(steamAppId) : null,
    steamAppId,
    description: game.description,
    addedAt: game.addedAt ?? null,
    plays: game.plays,
    game
  };
}

export function steamKey(appId: number): string {
  return `steam:${appId}`;
}

export function fromSteam(game: SteamGameSummary): LibraryEntry {
  const key = steamKey(game.appId);
  return {
    key,
    title: game.name,
    launch: 'steam',
    runtime: 'Steam',
    genres: [],
    art: game.headerUrl || steamHeaderUrl(game.appId),
    artFallback: drawnCover(key, game.name),
    heroArt: steamHeroUrl(game.appId),
    steamAppId: game.appId,
    steam: game
  };
}

/** Hands the game to the Steam client. The browser asks before it opens Steam. */
export function steamRunUrl(appId: number): string {
  return `steam://run/${appId}`;
}

export function steamInstallUrl(appId: number): string {
  return `steam://install/${appId}`;
}

export function steamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}/`;
}

// --- Formatting ---------------------------------------------------------------------

/** "45 min", "3.5 h", "1,204 h". Zero prints as "0 min", never as a dash. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return hours < 100 ? `${hours.toFixed(1)} h` : `${Math.round(hours).toLocaleString()} h`;
}

export function formatSeconds(seconds: number): string {
  if (seconds === 0) return '0 min';
  if (seconds < 60) return `${seconds} s`;
  return formatMinutes(seconds / 60);
}

/** Recency in words for lists: "Today", "Yesterday", "4 days ago", then the date. */
export function formatWhen(iso: string | null | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - then.getTime()) / 86400000) + 1;
  if (then.getTime() >= startOfToday.getTime()) return 'Today';
  if (days <= 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: then.getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' });
}
