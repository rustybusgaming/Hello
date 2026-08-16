import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { StoredUserAccount } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Session structure: token -> { userId, createdAt, expiresAt }
interface SessionRecord {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

export function generateSessionToken(): string {
  return 'fh_sess_' + crypto.randomBytes(32).toString('hex');
}

export function getSessions(): Record<string, SessionRecord> {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading sessions:', err);
    return {};
  }
}

export function saveSessions(sessions: Record<string, SessionRecord>) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error('Error saving sessions:', err);
  }
}

export function createSession(userId: string): string {
  const token = generateSessionToken();
  const sessions = getSessions();
  
  // 30-day session lifetime
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  sessions[token] = { userId, createdAt, expiresAt };
  saveSessions(sessions);
  return token;
}

export function getUserIdFromToken(token?: string): string | null {
  if (!token) return null;
  const sessions = getSessions();
  const session = sessions[token];
  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    delete sessions[token];
    saveSessions(sessions);
    return null;
  }

  return session.userId;
}

export function removeSession(token?: string) {
  if (!token) return;
  const sessions = getSessions();
  if (sessions[token]) {
    delete sessions[token];
    saveSessions(sessions);
  }
}
