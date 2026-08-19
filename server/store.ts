import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { UserAccount, StoredUserAccount, GameSave } from '../src/types';
import { hashPassword } from './auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const SAVES_FILE = path.join(DATA_DIR, 'saves.json');
const GAME_SETTINGS_FILE = path.join(DATA_DIR, 'game_settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Accounts are created through /api/auth/register; the store starts empty and the
// first account to register is promoted to admin.
const DEFAULT_STORED_ACCOUNTS: StoredUserAccount[] = [];

const DEFAULT_SAVES: GameSave[] = [];

// Write via a temp file so a crash mid-write cannot leave a truncated JSON store behind
function writeJsonFile(file: string, value: unknown) {
  const tmpFile = `${file}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(value, null, 2));
  fs.renameSync(tmpFile, file);
}

// Returns null when the file is missing, empty or unparseable, so callers can re-seed it
function readJsonFile<T>(file: string): T | null {
  try {
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${path.basename(file)}:`, err);
    return null;
  }
}

export function getStoredAccounts(): StoredUserAccount[] {
  try {
    const raw = readJsonFile<StoredUserAccount[]>(ACCOUNTS_FILE);
    if (!Array.isArray(raw) || raw.length === 0) {
      writeJsonFile(ACCOUNTS_FILE, DEFAULT_STORED_ACCOUNTS);
      return [...DEFAULT_STORED_ACCOUNTS];
    }

    // Migrate any legacy accounts missing passwordHash. Such an account cannot be signed
    // into until its owner resets the password, which is safer than assigning a known one.
    let needsSave = false;
    const accounts: StoredUserAccount[] = raw.map(acc => {
      if (!acc.passwordHash || !acc.passwordSalt) {
        const placeholder = hashPassword(crypto.randomUUID());
        needsSave = true;
        console.warn(`Account "${acc.username}" had no password hash; locked it pending a reset.`);
        return {
          ...acc,
          passwordHash: placeholder.hash,
          passwordSalt: placeholder.salt
        };
      }
      return acc;
    });

    if (needsSave) {
      writeJsonFile(ACCOUNTS_FILE, accounts);
    }

    return accounts;
  } catch (err) {
    console.error('Error reading accounts:', err);
    return [...DEFAULT_STORED_ACCOUNTS];
  }
}

export function saveStoredAccounts(accounts: StoredUserAccount[]) {
  try {
    writeJsonFile(ACCOUNTS_FILE, accounts);
  } catch (err) {
    console.error('Error saving accounts:', err);
  }
}

/*
 * Playtime is the account's own banked counter, not a sum over save slots. Slots are
 * overwritten in place (so their minutes replace rather than accumulate) and only Flash
 * titles have them at all, which made the old derived figure meaningless.
 */
export function toPublicAccount(stored: StoredUserAccount, savesCount?: number): UserAccount {
  const { passwordHash, passwordSalt, ...safe } = stored;
  return {
    ...safe,
    savesCount: typeof savesCount === 'number' ? savesCount : 0,
    totalPlaytimeMinutes: stored.totalPlaytimeMinutes || 0,
    achievements: stored.achievements || []
  };
}

export function getPublicAccounts(): UserAccount[] {
  const stored = getStoredAccounts();
  const saves = getSaves();
  return stored.map(acc => toPublicAccount(acc, saves.filter(s => s.userId === acc.id).length));
}

export function getSaves(): GameSave[] {
  try {
    const data = readJsonFile<GameSave[]>(SAVES_FILE);
    if (!Array.isArray(data)) {
      writeJsonFile(SAVES_FILE, DEFAULT_SAVES);
      return [...DEFAULT_SAVES];
    }
    return data;
  } catch (err) {
    console.error('Error reading saves:', err);
    return [...DEFAULT_SAVES];
  }
}

export function saveSaves(saves: GameSave[]) {
  try {
    writeJsonFile(SAVES_FILE, saves);
  } catch (err) {
    console.error('Error writing saves:', err);
  }
}

export interface GameSettings {
  hiddenGameIds: string[];
  customGames: any[];
}

export function getGameSettings(): GameSettings {
  try {
    const data = readJsonFile<Partial<GameSettings>>(GAME_SETTINGS_FILE);
    if (!data || typeof data !== 'object') {
      const initial: GameSettings = { hiddenGameIds: [], customGames: [] };
      writeJsonFile(GAME_SETTINGS_FILE, initial);
      return initial;
    }
    // Tolerate partially written settings files
    return {
      hiddenGameIds: Array.isArray(data.hiddenGameIds) ? data.hiddenGameIds : [],
      customGames: Array.isArray(data.customGames) ? data.customGames : []
    };
  } catch (err) {
    console.error('Error reading game settings:', err);
    return { hiddenGameIds: [], customGames: [] };
  }
}

export function saveGameSettings(settings: GameSettings) {
  try {
    writeJsonFile(GAME_SETTINGS_FILE, settings);
  } catch (err) {
    console.error('Error saving game settings:', err);
  }
}
