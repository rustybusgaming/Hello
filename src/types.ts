export interface GameMirror {
  id: string;
  name: string;
  type: 'html5' | 'ruffle' | 'webport' | 'archive' | 'mirror' | 'custom';
  url: string;
  isArchiveIndependent?: boolean;
}

export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  /** Hand-assigned in the catalogue data; not a measured figure, so the UI does not show it */
  rating?: number;
  source: 'webporting' | 'steam' | 'archive' | 'custom';
  embedUrl: string;
  genres: string[];
  hidden?: boolean;
  mirrors?: GameMirror[];
  swfUrl?: string;
  html5Url?: string;
  isArchiveIndependent?: boolean;
  description?: string;
  /** When the hub first saw the game; null for the catalogue it started with */
  addedAt?: string | null;
  /** Counted plays: sessions of 30 s or more, one per player per half hour */
  plays?: { total: number; recent: number };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserAchievement {
  achievementId: string;
  earnedAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  role: 'admin' | 'user';
  avatarUrl: string;
  createdAt: string;
  lastLogin?: string;
  steamId?: string;
  steamPersonaName?: string;
  steamAvatar?: string;
  steamProfileUrl?: string;
  steamLevel?: number;
  steamGamesCount?: number;
  steamLinkedAt?: string;
  /** Set when Steam itself confirmed ownership through Sign in through Steam */
  steamVerifiedAt?: string;
  savesCount: number;
  totalPlaytimeMinutes?: number;
  achievements?: UserAchievement[];
}

export interface StoredUserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  /** Cumulative minutes played, banked when a game closes. */
  totalPlaytimeMinutes?: number;
  displayName?: string;
  bio?: string;
  role: 'admin' | 'user';
  avatarUrl: string;
  createdAt: string;
  lastLogin?: string;
  steamId?: string;
  steamPersonaName?: string;
  steamAvatar?: string;
  steamProfileUrl?: string;
  steamLevel?: number;
  steamGamesCount?: number;
  steamLinkedAt?: string;
  steamVerifiedAt?: string;
  /** When steamLevel / steamGamesCount last came from Steam's API; absent means not from Steam */
  steamStatsAt?: string;
  achievements?: UserAchievement[];
}

export interface AuthResponse {
  status: 'ok' | 'error';
  token?: string;
  user?: UserAccount;
  error?: string;
  message?: string;
}

export interface GameSave {
  id: string;
  gameId: string;
  gameTitle: string;
  userId: string;
  slotName: string;
  saveData: string;
  timestamp: string;
  playtimeMinutes: number;
  highScore?: number;
  notes?: string;
}

export interface SystemStats {
  totalGames: number;
  activeAccounts: number;
  totalSaves: number;
  cachedProxyItems: number;
  memoryUsageMb: number;
  uptimeSeconds: number;
  isSyncing: boolean;
  syncProgressMessage: string;
}

// --- Steam library & achievements (see server/steam.ts) ---

export interface SteamGameSummary {
  appId: number;
  name: string;
  playtimeMinutes: number;
  playtimeRecentMinutes: number;
  /** Steam's own last-launch time; null when the game was never run. */
  lastPlayedAt: string | null;
  iconUrl: string | null;
  headerUrl: string;
}

/** The whole owned-games list, as /api/steam/owned returns it. */
export interface SteamOwnedLibrary {
  steamId: string;
  personaName: string | null;
  visibility: 'public' | 'private' | 'unknown';
  games: SteamGameSummary[];
  /** When this list came from Steam */
  fetchedAt: string;
  /** True when Steam could not be reached and this is the last list it gave */
  stale?: boolean;
}

export interface PlayRecord {
  lastPlayedAt: string | null;
  totalSeconds: number;
  sessions: number;
}

export interface GameCollection {
  id: string;
  name: string;
  keys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SteamAchievementEntry {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
  /** Percentage of all players who own it; null when Steam publishes no figure. */
  globalPercent: number | null;
}

export interface SteamAchievementSet {
  appId: number;
  gameName: string;
  total: number;
  unlocked: number;
  achievements: SteamAchievementEntry[];
}

export interface SteamProfileSummary {
  steamId: string;
  personaName: string;
  avatar: string;
  profileUrl: string;
  state: string;
  visibility: 'public' | 'private';
  playingNow: string | null;
  countryCode: string | null;
  createdAt: string | null;
}

export interface SteamLibrary {
  profile: SteamProfileSummary | null;
  level: number | null;
  gameCount: number;
  totalPlaytimeMinutes: number;
  topGames: SteamGameSummary[];
  recentGames: SteamGameSummary[];
}

export interface SteamAchievementOverview {
  unlocked: number;
  total: number;
  perfectGames: number;
  recent: (SteamAchievementEntry & { appId: number; gameName: string })[];
  perGame: { appId: number; gameName: string; unlocked: number; total: number; headerUrl: string }[];
}

// --- Steam store metadata (see server/steamStore.ts) ---

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
  screenshots: { thumb: string; full: string }[];
}

export interface StoreResult {
  state: 'ok' | 'missing' | 'unavailable';
  details: StoreDetails | null;
  fetchedAt: string | null;
  stale: boolean;
}
