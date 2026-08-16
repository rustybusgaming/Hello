import fs from 'fs';
import path from 'path';
import { UserAccount, StoredUserAccount, GameSave, SystemStats } from '../src/types';
import { hashPassword } from './auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const SAVES_FILE = path.join(DATA_DIR, 'saves.json');
const GAME_SETTINGS_FILE = path.join(DATA_DIR, 'game_settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Admin & Demo Accounts with proper hashed passwords
const adminPass = hashPassword('admin1234');
const gamerPass = hashPassword('gamer1234');

const DEFAULT_STORED_ACCOUNTS: StoredUserAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@flashhub.local',
    displayName: 'FlashHub Root Admin',
    bio: 'System Administrator and Lead Curator of FlashHub Retro Arcade.',
    passwordHash: adminPass.hash,
    passwordSalt: adminPass.salt,
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastLogin: new Date().toISOString(),
    steamId: '76561198000000000',
    steamPersonaName: 'AdminPlayer',
    steamAvatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    steamProfileUrl: 'https://steamcommunity.com/id/admin',
    steamLevel: 42,
    steamGamesCount: 156,
    steamLinkedAt: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'user-retro-gamer',
    username: 'RetroMaster99',
    email: 'gamer@retro.arcade',
    displayName: 'Retro Speedrunner',
    bio: 'Preserving 2000s Flash games and webports. Speedrunner of Karlson and Super Mario 64.',
    passwordHash: gamerPass.hash,
    passwordSalt: gamerPass.salt,
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    lastLogin: new Date().toISOString(),
    steamId: '76561198123456789',
    steamPersonaName: 'RetroGamer',
    steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4607f3ab0d44f0b38d3be933642c4c_full.jpg',
    steamProfileUrl: 'https://steamcommunity.com/profiles/76561198123456789',
    steamLevel: 18,
    steamGamesCount: 48,
    steamLinkedAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

const DEFAULT_SAVES: GameSave[] = [
  {
    id: 'save-1',
    gameId: 'webport-milkman-karlson',
    gameTitle: 'Milkman Karlson',
    userId: 'user-admin',
    slotName: 'Slot 1 (Level 8)',
    saveData: JSON.stringify({ level: 8, milkBottles: 14, timeElapsed: 482 }),
    timestamp: new Date().toISOString(),
    playtimeMinutes: 45,
    highScore: 12400,
    notes: 'Completed Chapter 1 speedrun'
  },
  {
    id: 'save-2',
    gameId: 'webport-buckshot-roulette',
    gameTitle: 'Buckshot Roulette',
    userId: 'user-admin',
    slotName: 'Double or Nothing Streak',
    saveData: JSON.stringify({ streak: 4, cash: 140000, pillsTaken: 2 }),
    timestamp: new Date().toISOString(),
    playtimeMinutes: 28,
    highScore: 140000,
    notes: 'Round 4 with sawed-off shotgun'
  },
  {
    id: 'save-3',
    gameId: 'flash-super-smash-flash-2',
    gameTitle: 'Super Smash Flash 2',
    userId: 'user-retro-gamer',
    slotName: 'All Characters Unlocked',
    saveData: JSON.stringify({ unlocked: ['luffy', 'naruto', 'goku', 'ichigo', 'mario', 'sonic', 'megaman'], campaignCleared: true }),
    timestamp: new Date().toISOString(),
    playtimeMinutes: 120,
    highScore: 98500,
    notes: 'Classic Mode Hard 100% complete'
  }
];

export function getStoredAccounts(): StoredUserAccount[] {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(DEFAULT_STORED_ACCOUNTS, null, 2));
      return DEFAULT_STORED_ACCOUNTS;
    }
    const raw = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    if (!Array.isArray(raw) || raw.length === 0) {
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(DEFAULT_STORED_ACCOUNTS, null, 2));
      return DEFAULT_STORED_ACCOUNTS;
    }

    // Migrate any legacy accounts missing passwordHash
    let needsSave = false;
    const accounts: StoredUserAccount[] = raw.map(acc => {
      if (!acc.passwordHash || !acc.passwordSalt) {
        const defaultHash = hashPassword(acc.username === 'admin' ? 'admin1234' : 'gamer1234');
        needsSave = true;
        return {
          ...acc,
          passwordHash: defaultHash.hash,
          passwordSalt: defaultHash.salt
        };
      }
      return acc;
    });

    if (needsSave) {
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
    }

    return accounts;
  } catch (err) {
    console.error('Error reading accounts:', err);
    return DEFAULT_STORED_ACCOUNTS;
  }
}

export function saveStoredAccounts(accounts: StoredUserAccount[]) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  } catch (err) {
    console.error('Error saving accounts:', err);
  }
}

export function toPublicAccount(stored: StoredUserAccount, savesCount?: number, totalPlaytime?: number): UserAccount {
  const { passwordHash, passwordSalt, ...safe } = stored;
  return {
    ...safe,
    savesCount: typeof savesCount === 'number' ? savesCount : 0,
    totalPlaytimeMinutes: typeof totalPlaytime === 'number' ? totalPlaytime : 0
  };
}

export function getPublicAccounts(): UserAccount[] {
  const stored = getStoredAccounts();
  const saves = getSaves();
  return stored.map(acc => {
    const userSaves = saves.filter(s => s.userId === acc.id);
    const totalPlaytime = userSaves.reduce((sum, s) => sum + (s.playtimeMinutes || 0), 0);
    return toPublicAccount(acc, userSaves.length, totalPlaytime);
  });
}

export function getSaves(): GameSave[] {
  try {
    if (!fs.existsSync(SAVES_FILE)) {
      fs.writeFileSync(SAVES_FILE, JSON.stringify(DEFAULT_SAVES, null, 2));
      return DEFAULT_SAVES;
    }
    const data = JSON.parse(fs.readFileSync(SAVES_FILE, 'utf8'));
    return Array.isArray(data) ? data : DEFAULT_SAVES;
  } catch (err) {
    console.error('Error reading saves:', err);
    return DEFAULT_SAVES;
  }
}

export function saveSaves(saves: GameSave[]) {
  try {
    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2));
  } catch (err) {
    console.error('Error writing saves:', err);
  }
}

export function getGameSettings(): { hiddenGameIds: string[]; customGames: any[] } {
  try {
    if (!fs.existsSync(GAME_SETTINGS_FILE)) {
      const initial = { hiddenGameIds: [], customGames: [] };
      fs.writeFileSync(GAME_SETTINGS_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(GAME_SETTINGS_FILE, 'utf8'));
  } catch (err) {
    return { hiddenGameIds: [], customGames: [] };
  }
}

export function saveGameSettings(settings: { hiddenGameIds: string[]; customGames: any[] }) {
  try {
    fs.writeFileSync(GAME_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Error saving game settings:', err);
  }
}
