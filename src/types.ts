export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  source: 'webporting' | 'steam' | 'archive' | 'custom';
  embedUrl: string;
  genres: string[];
  hidden?: boolean;
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
}

export interface StoredUserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
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
