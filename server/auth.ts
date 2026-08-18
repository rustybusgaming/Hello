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
  if (!hash || !salt) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  const computedBuf = Buffer.from(computed);
  const storedBuf = Buffer.from(hash);
  // timingSafeEqual throws on length mismatch, which a malformed stored hash would trigger
  if (computedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(computedBuf, storedBuf);
}

export function generateSessionToken(): string {
  return 'fh_sess_' + crypto.randomBytes(32).toString('hex');
}

export function getSessions(): Record<string, SessionRecord> {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      saveSessions({});
      return {};
    }
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8').trim();
    if (!raw) {
      saveSessions({});
      return {};
    }
    const parsed = JSON.parse(raw);
    // An array or primitive here would break every token lookup downstream
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      saveSessions({});
      return {};
    }
    return parsed as Record<string, SessionRecord>;
  } catch (err) {
    console.error('Error reading sessions:', err);
    return {};
  }
}

export function saveSessions(sessions: Record<string, SessionRecord>) {
  try {
    const tmpFile = `${SESSIONS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(sessions, null, 2));
    fs.renameSync(tmpFile, SESSIONS_FILE);
  } catch (err) {
    console.error('Error saving sessions:', err);
  }
}

export function createSession(userId: string): string {
  const token = generateSessionToken();
  const sessions = getSessions();

  // Drop sessions that have already expired so the file does not grow forever
  const nowMs = Date.now();
  for (const [existingToken, record] of Object.entries(sessions)) {
    if (new Date(record.expiresAt).getTime() < nowMs) {
      delete sessions[existingToken];
    }
  }
  
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
