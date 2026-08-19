import express from 'express';

/**
 * In-memory sliding-window limiter for the endpoints that verify a password.
 *
 * pbkdf2 at 10k iterations is cheap enough to attack in bulk, so credential checks are
 * throttled per client *and* per targeted account: an attacker rotating IPs still hits the
 * account bucket, and one attacker cannot lock every user out by hammering a shared bucket.
 */

interface Attempt {
  failures: number[];
  blockedUntil: number;
}

const WINDOW_MS = 15 * 60 * 1000; // failures older than this stop counting

// The account bucket is the tight one: it is what actually stops a password from being
// guessed. The IP bucket is deliberately loose because this hub gets played on school and
// office networks, where hundreds of legitimate players share one address.
const MAX_FAILURES_PER_ACCOUNT = 8;
const MAX_FAILURES_PER_IP = 30;

const BASE_BLOCK_MS = 60 * 1000; // doubles for each further failure while blocked
const MAX_BLOCK_MS = 60 * 60 * 1000;
const MAX_BUCKETS = 5000;

function thresholdFor(key: string): number {
  return key.includes(':ip:') ? MAX_FAILURES_PER_IP : MAX_FAILURES_PER_ACCOUNT;
}

const buckets = new Map<string, Attempt>();

function prune(now: number) {
  for (const [key, attempt] of buckets) {
    const active = attempt.failures.some(t => now - t < WINDOW_MS);
    if (!active && attempt.blockedUntil < now) {
      buckets.delete(key);
    }
  }

  // Hard ceiling so a flood of unique keys cannot grow the map without bound
  if (buckets.size > MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= overflow) break;
    }
  }
}

export function clientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export interface RateLimitStatus {
  blocked: boolean;
  retryAfterSeconds: number;
}

/** Check every bucket without recording anything. */
export function checkRateLimit(keys: string[]): RateLimitStatus {
  const now = Date.now();
  let blockedUntil = 0;

  for (const key of keys) {
    const attempt = buckets.get(key);
    if (attempt && attempt.blockedUntil > now) {
      blockedUntil = Math.max(blockedUntil, attempt.blockedUntil);
    }
  }

  return {
    blocked: blockedUntil > now,
    retryAfterSeconds: blockedUntil > now ? Math.ceil((blockedUntil - now) / 1000) : 0
  };
}

/** Record a failed credential check and block the buckets once they cross the threshold. */
export function recordFailure(keys: string[]) {
  const now = Date.now();

  for (const key of keys) {
    const attempt = buckets.get(key) || { failures: [], blockedUntil: 0 };
    attempt.failures = attempt.failures.filter(t => now - t < WINDOW_MS);
    attempt.failures.push(now);

    const threshold = thresholdFor(key);
    if (attempt.failures.length >= threshold) {
      const over = attempt.failures.length - threshold;
      const block = Math.min(BASE_BLOCK_MS * Math.pow(2, over), MAX_BLOCK_MS);
      attempt.blockedUntil = now + block;
    }

    buckets.set(key, attempt);
  }

  prune(now);
}

/** A successful sign-in clears that client's history so normal users are never stuck. */
export function clearFailures(keys: string[]) {
  for (const key of keys) buckets.delete(key);
}

/**
 * Guard a password-verifying route. Returns null when the caller is blocked (the response
 * has already been sent), otherwise the keys to pass to recordFailure/clearFailures.
 */
/**
 * Enforce a limit against a set of pre-built keys. Returns the keys to pass on to
 * recordFailure/clearFailures, or null when the caller is already blocked (the 429 has been
 * sent). Sending the 429 in one place keeps the message and headers consistent.
 */
export function guardKeys(res: express.Response, keys: string[]): string[] | null {
  const status = checkRateLimit(keys);
  if (status.blocked) {
    res.setHeader('Retry-After', String(status.retryAfterSeconds));
    res.status(429).json({
      error: `Too many attempts. Try again in ${Math.ceil(status.retryAfterSeconds / 60)} minute(s).`,
      retryAfterSeconds: status.retryAfterSeconds
    });
    return null;
  }
  return keys;
}

export function guardCredentials(
  req: express.Request,
  res: express.Response,
  scope: string,
  identifier?: string
): string[] | null {
  const ip = clientIp(req);
  const keys = [`${scope}:ip:${ip}`];
  if (identifier) keys.push(`${scope}:id:${identifier.toLowerCase()}`);
  return guardKeys(res, keys);
}
