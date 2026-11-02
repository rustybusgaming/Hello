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
  rating: number;
  source: 'webporting' | 'steam' | 'archive' | 'custom';
  embedUrl: string;
  genres: string[];
  hidden?: boolean;
  mirrors?: GameMirror[];
  swfUrl?: string;
  html5Url?: string;
  isArchiveIndependent?: boolean;
  description?: string;
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
