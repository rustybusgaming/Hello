/**
 * Steam Web API client.
 *
 * Steam retired the old keyless `?xml=1` endpoints for a player's library and achievements —
 * they now redirect to the HTML profile page — so anything beyond the basic profile needs a
 * Web API key in STEAM_API_KEY. Global achievement rarity is the one exception and is still
 * public, so it is fetched without a key and merged in.
 *
 * Everything here fails soft: a private profile, a missing key or a Steam outage returns an
 * explanatory result rather than throwing, because none of it should break the hub.
 */

// Overridable so the client can be pointed at a stand-in during development and testing;
// unset in normal use, when it is Steam's own host.
const API = (process.env.STEAM_API_BASE || 'https://api.steampowered.com').replace(/\/$/, '');
const TIMEOUT_MS = 8000;

export interface SteamGame {
  appId: number;
  name: string;
  playtimeMinutes: number;
  playtimeRecentMinutes: number;
  iconUrl: string | null;
  headerUrl: string;
}

export interface SteamAchievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
  /** Share of all players who have this achievement, when Steam publishes it. */
  globalPercent: number | null;
}

export interface SteamAchievementSet {
  appId: number;
  gameName: string;
  total: number;
  unlocked: number;
  achievements: SteamAchievement[];
}

export interface SteamProfile {
  steamId: string;
  personaName: string;
  avatar: string;
  profileUrl: string;
  state: 'offline' | 'online' | 'busy' | 'away' | 'snooze' | 'looking to trade' | 'looking to play';
  visibility: 'public' | 'private';
  playingNow: string | null;
  countryCode: string | null;
  createdAt: string | null;
}

export class SteamUnavailable extends Error {
  constructor(message: string, readonly needsKey = false) {
    super(message);
    this.name = 'SteamUnavailable';
  }
}

export function isSteamConfigured(): boolean {
  return !!process.env.STEAM_API_KEY;
}

// --- tiny TTL cache -----------------------------------------------------------------
// Steam rate limits per key, and a player flipping between games in the UI would otherwise
// re-request the same schema repeatedly.
const cache = new Map<string, { value: unknown; expiresAt: number }>();
const MAX_ENTRIES = 400;

function cached<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function store<T>(key: string, value: T, ttlMs: number): T {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function clearSteamCache() {
  cache.clear();
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FlashHub/2.0' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (res.status === 401 || res.status === 403) {
    throw new SteamUnavailable('Steam rejected the API key', true);
  }
  if (!res.ok) {
    throw new SteamUnavailable(`Steam returned ${res.status}`);
  }
  return res.json();
}

function apiUrl(path: string, params: Record<string, string | number>): string {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    throw new SteamUnavailable('No Steam Web API key is configured on this server', true);
  }
  const query = new URLSearchParams({ key, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  return `${API}/${path}?${query.toString()}`;
}

const PERSONA_STATES: SteamProfile['state'][] = [
  'offline', 'online', 'busy', 'away', 'snooze', 'looking to trade', 'looking to play'
];

/** Turn a vanity name, profile URL or raw id into a 64-bit Steam id. */
export async function resolveSteamId(input: string): Promise<string | null> {
  let value = input.trim();

  const vanityMatch = value.match(/steamcommunity\.com\/id\/([^/?#]+)/i);
  const profileMatch = value.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profileMatch) return profileMatch[1];
  if (vanityMatch) value = vanityMatch[1];

  if (/^\d{17}$/.test(value)) return value;

  const cacheKey = `vanity:${value.toLowerCase()}`;
  const hit = cached<string | null>(cacheKey);
  if (hit !== undefined) return hit;

  if (isSteamConfigured()) {
    const data = await getJson(apiUrl('ISteamUser/ResolveVanityURL/v1/', { vanityurl: value }));
    const id = data?.response?.success === 1 ? String(data.response.steamid) : null;
    return store(cacheKey, id, 60 * 60 * 1000);
  }

  // Without a key the public profile XML still resolves vanity names
  const res = await fetch(`https://steamcommunity.com/id/${encodeURIComponent(value)}/?xml=1`, {
    headers: { 'User-Agent': 'FlashHub/2.0' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const xml = await res.text();
  const id = xml.match(/<steamID64>(\d{17})<\/steamID64>/)?.[1] || null;
  return store(cacheKey, id, 60 * 60 * 1000);
}

export async function getProfile(steamId: string): Promise<SteamProfile | null> {
  const cacheKey = `profile:${steamId}`;
  const hit = cached<SteamProfile | null>(cacheKey);
  if (hit !== undefined) return hit;

  const data = await getJson(apiUrl('ISteamUser/GetPlayerSummaries/v2/', { steamids: steamId }));
  const player = data?.response?.players?.[0];
  if (!player) return store(cacheKey, null, 60 * 1000);

  const profile: SteamProfile = {
    steamId: String(player.steamid),
    personaName: player.personaname || 'Unknown',
    avatar: player.avatarfull || player.avatarmedium || player.avatar || '',
    profileUrl: player.profileurl || `https://steamcommunity.com/profiles/${steamId}`,
    state: PERSONA_STATES[player.personastate] || 'offline',
    // communityvisibilitystate 3 is public; anything else hides the library
    visibility: player.communityvisibilitystate === 3 ? 'public' : 'private',
    playingNow: player.gameextrainfo || null,
    countryCode: player.loccountrycode || null,
    createdAt: player.timecreated ? new Date(player.timecreated * 1000).toISOString() : null
  };

  return store(cacheKey, profile, 5 * 60 * 1000);
}

export async function getSteamLevel(steamId: string): Promise<number | null> {
  const cacheKey = `level:${steamId}`;
  const hit = cached<number | null>(cacheKey);
  if (hit !== undefined) return hit;

  const data = await getJson(apiUrl('IPlayerService/GetSteamLevel/v1/', { steamid: steamId }));
  const level = typeof data?.response?.player_level === 'number' ? data.response.player_level : null;
  return store(cacheKey, level, 60 * 60 * 1000);
}

function toGame(raw: any): SteamGame {
  return {
    appId: raw.appid,
    name: raw.name || `App ${raw.appid}`,
    playtimeMinutes: raw.playtime_forever || 0,
    playtimeRecentMinutes: raw.playtime_2weeks || 0,
    iconUrl: raw.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${raw.appid}/${raw.img_icon_url}.jpg`
      : null,
    headerUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${raw.appid}/header.jpg`
  };
}

export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  const cacheKey = `games:${steamId}`;
  const hit = cached<SteamGame[]>(cacheKey);
  if (hit !== undefined) return hit;

  const data = await getJson(
    apiUrl('IPlayerService/GetOwnedGames/v1/', {
      steamid: steamId,
      include_appinfo: 1,
      include_played_free_games: 1
    })
  );

  const games: SteamGame[] = (data?.response?.games || [])
    .map(toGame)
    .sort((a: SteamGame, b: SteamGame) => b.playtimeMinutes - a.playtimeMinutes);

  return store(cacheKey, games, 5 * 60 * 1000);
}

export async function getRecentGames(steamId: string): Promise<SteamGame[]> {
  const cacheKey = `recent:${steamId}`;
  const hit = cached<SteamGame[]>(cacheKey);
  if (hit !== undefined) return hit;

  const data = await getJson(apiUrl('IPlayerService/GetRecentlyPlayedGames/v1/', { steamid: steamId }));
  const games: SteamGame[] = (data?.response?.games || []).map(toGame);
  return store(cacheKey, games, 5 * 60 * 1000);
}

/** Achievement names, art and descriptions for a game. Same for every player, so cached hard. */
async function getSchema(appId: number): Promise<{ gameName: string; achievements: Map<string, any> }> {
  const cacheKey = `schema:${appId}`;
  const hit = cached<{ gameName: string; achievements: Map<string, any> }>(cacheKey);
  if (hit !== undefined) return hit;

  const data = await getJson(apiUrl('ISteamUserStats/GetSchemaForGame/v2/', { appid: appId }));
  const list = data?.game?.availableGameStats?.achievements || [];
  const achievements = new Map<string, any>();
  for (const entry of list) achievements.set(entry.name, entry);

  return store(cacheKey, { gameName: data?.game?.gameName || `App ${appId}`, achievements }, 24 * 60 * 60 * 1000);
}

/** Global unlock rates. This endpoint is public, so it works even with no key configured. */
async function getGlobalPercentages(appId: number): Promise<Map<string, number>> {
  const cacheKey = `global:${appId}`;
  const hit = cached<Map<string, number>>(cacheKey);
  if (hit !== undefined) return hit;

  const percentages = new Map<string, number>();
  try {
    const data = await getJson(
      `${API}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`
    );
    for (const entry of data?.achievementpercentages?.achievements || []) {
      percentages.set(entry.name, Number(entry.percent));
    }
  } catch {
    // Rarity is a nice-to-have; an outage here should not hide the achievements themselves
  }

  return store(cacheKey, percentages, 24 * 60 * 60 * 1000);
}

export async function getAchievements(steamId: string, appId: number): Promise<SteamAchievementSet> {
  const cacheKey = `ach:${steamId}:${appId}`;
  const hit = cached<SteamAchievementSet>(cacheKey);
  if (hit !== undefined) return hit;

  const [playerData, schema, globals] = await Promise.all([
    getJson(apiUrl('ISteamUserStats/GetPlayerAchievements/v1/', { steamid: steamId, appid: appId, l: 'english' })),
    getSchema(appId),
    getGlobalPercentages(appId)
  ]);

  if (playerData?.playerstats?.success === false) {
    // Steam says this for games with no achievements and for hidden stats alike
    throw new SteamUnavailable(playerData?.playerstats?.error || 'Steam has no achievement data for this game');
  }

  const achievements: SteamAchievement[] = (playerData?.playerstats?.achievements || []).map((entry: any) => {
    const meta = schema.achievements.get(entry.apiname);
    const unlocked = entry.achieved === 1;
    return {
      id: entry.apiname,
      name: entry.name || meta?.displayName || entry.apiname,
      description: entry.description || meta?.description || '',
      icon: (unlocked ? meta?.icon : meta?.icongray) || meta?.icon || null,
      unlocked,
      unlockedAt: unlocked && entry.unlocktime ? new Date(entry.unlocktime * 1000).toISOString() : null,
      globalPercent: globals.has(entry.apiname) ? globals.get(entry.apiname)! : null
    };
  });

  // Unlocked first, most recent at the top; then locked ordered by how common they are
  achievements.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked && b.unlocked) return (b.unlockedAt || '').localeCompare(a.unlockedAt || '');
    return (b.globalPercent ?? 0) - (a.globalPercent ?? 0);
  });

  const set: SteamAchievementSet = {
    appId,
    gameName: playerData?.playerstats?.gameName || schema.gameName,
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    achievements
  };

  return store(cacheKey, set, 5 * 60 * 1000);
}

export interface SteamLibrarySummary {
  profile: SteamProfile | null;
  level: number | null;
  gameCount: number;
  totalPlaytimeMinutes: number;
  topGames: SteamGame[];
  recentGames: SteamGame[];
}

export async function getLibrarySummary(steamId: string): Promise<SteamLibrarySummary> {
  // Checked up front: the per-call catches below are for partial outages, and would
  // otherwise turn a missing key into a library that merely looks empty.
  if (!isSteamConfigured()) {
    throw new SteamUnavailable('No Steam Web API key is configured on this server', true);
  }

  const [profile, level, owned, recent] = await Promise.all([
    getProfile(steamId).catch(() => null),
    getSteamLevel(steamId).catch(() => null),
    getOwnedGames(steamId).catch(() => [] as SteamGame[]),
    getRecentGames(steamId).catch(() => [] as SteamGame[])
  ]);

  return {
    profile,
    level,
    gameCount: owned.length,
    totalPlaytimeMinutes: owned.reduce((sum, g) => sum + g.playtimeMinutes, 0),
    topGames: owned.slice(0, 12),
    recentGames: recent
  };
}

export interface SteamAchievementOverview {
  unlocked: number;
  total: number;
  perfectGames: number;
  recent: (SteamAchievement & { appId: number; gameName: string })[];
  perGame: { appId: number; gameName: string; unlocked: number; total: number; headerUrl: string }[];
}

/**
 * Achievement rollup across the games a player actually touches. Deliberately limited to a
 * handful of titles: a full library would mean one request per game and blow the rate limit.
 */
export async function getAchievementOverview(steamId: string, maxGames = 8): Promise<SteamAchievementOverview> {
  if (!isSteamConfigured()) {
    throw new SteamUnavailable('No Steam Web API key is configured on this server', true);
  }

  const [owned, recent] = await Promise.all([
    getOwnedGames(steamId).catch(() => [] as SteamGame[]),
    getRecentGames(steamId).catch(() => [] as SteamGame[])
  ]);

  const candidates: SteamGame[] = [];
  const seen = new Set<number>();
  for (const game of [...recent, ...owned]) {
    if (seen.has(game.appId) || game.playtimeMinutes === 0) continue;
    seen.add(game.appId);
    candidates.push(game);
    if (candidates.length >= maxGames) break;
  }

  const sets = await Promise.all(
    candidates.map(game =>
      getAchievements(steamId, game.appId)
        .then(set => ({ set, game }))
        .catch(() => null)
    )
  );

  const overview: SteamAchievementOverview = {
    unlocked: 0,
    total: 0,
    perfectGames: 0,
    recent: [],
    perGame: []
  };

  for (const entry of sets) {
    if (!entry || entry.set.total === 0) continue;
    const { set, game } = entry;

    overview.unlocked += set.unlocked;
    overview.total += set.total;
    if (set.unlocked === set.total) overview.perfectGames++;
    overview.perGame.push({
      appId: set.appId,
      gameName: set.gameName,
      unlocked: set.unlocked,
      total: set.total,
      headerUrl: game.headerUrl
    });

    for (const achievement of set.achievements) {
      if (achievement.unlocked && achievement.unlockedAt) {
        overview.recent.push({ ...achievement, appId: set.appId, gameName: set.gameName });
      }
    }
  }

  overview.recent.sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''));
  overview.recent = overview.recent.slice(0, 12);
  overview.perGame.sort((a, b) => b.unlocked / b.total - a.unlocked / a.total);

  return overview;
}
