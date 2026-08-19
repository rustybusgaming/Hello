import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * On-disk cache for proxied game assets.
 *
 * Without it, every play re-pulls the whole game from jsDelivr through this process — tens of
 * megabytes for a Unity build — so a replay is as slow as the first play and the upstream
 * round trip competes with the game itself for bandwidth. Cached files are served straight
 * from disk, which also keeps a game playable if the CDN is having a bad day.
 */

const CACHE_DIR = path.join(process.cwd(), 'data', 'asset-cache');

// Individual files are capped so one enormous Unity blob cannot fill the disk, and the cache
// as a whole is trimmed back to the budget when it grows past it.
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const TRIM_TARGET = 0.8;

let totalBytes = 0;
let initialised = false;

interface CacheEntry {
  file: string;
  contentType: string;
  size: number;
}

const index = new Map<string, CacheEntry>();

function keyFor(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function init() {
  if (initialised) return;
  initialised = true;

  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    for (const name of fs.readdirSync(CACHE_DIR)) {
      if (!name.endsWith('.meta')) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, name), 'utf8'));
        const body = path.join(CACHE_DIR, meta.file);
        if (!fs.existsSync(body)) continue;
        const size = fs.statSync(body).size;
        index.set(meta.key, { file: meta.file, contentType: meta.contentType, size });
        totalBytes += size;
      } catch {
        // A half-written entry from a previous run is simply skipped
      }
    }
  } catch (err) {
    console.error('[AssetCache] Could not initialise:', err);
  }
}

/** Evict least-recently-used entries until the cache is back under budget. */
function trim() {
  if (totalBytes <= MAX_TOTAL_BYTES) return;

  const entries = [...index.entries()]
    .map(([key, entry]) => {
      let atime = 0;
      try {
        atime = fs.statSync(path.join(CACHE_DIR, entry.file)).atimeMs;
      } catch {
        atime = 0;
      }
      return { key, entry, atime };
    })
    .sort((a, b) => a.atime - b.atime);

  const target = MAX_TOTAL_BYTES * TRIM_TARGET;
  for (const { key, entry } of entries) {
    if (totalBytes <= target) break;
    try {
      fs.rmSync(path.join(CACHE_DIR, entry.file), { force: true });
      fs.rmSync(path.join(CACHE_DIR, `${key}.meta`), { force: true });
    } catch {
      /* already gone */
    }
    index.delete(key);
    totalBytes -= entry.size;
  }
}

export function getCached(url: string): { path: string; contentType: string; size: number } | null {
  init();
  const key = keyFor(url);
  const entry = index.get(key);
  if (!entry) return null;

  const file = path.join(CACHE_DIR, entry.file);
  if (!fs.existsSync(file)) {
    index.delete(key);
    totalBytes -= entry.size;
    return null;
  }

  // Touch so the trim pass treats it as recently used
  const now = new Date();
  try {
    fs.utimesSync(file, now, now);
  } catch {
    /* not fatal */
  }

  return { path: file, contentType: entry.contentType, size: entry.size };
}

/** Store a fully-downloaded asset. Partial or oversized responses are skipped. */
export function putCached(url: string, body: Buffer, contentType: string): void {
  init();
  if (body.length === 0 || body.length > MAX_FILE_BYTES) return;

  const key = keyFor(url);
  const fileName = `${key}.bin`;
  const target = path.join(CACHE_DIR, fileName);

  try {
    // Write to a temp name first so a crash cannot leave a truncated asset behind
    const tmp = `${target}.tmp`;
    fs.writeFileSync(tmp, body);
    fs.renameSync(tmp, target);
    fs.writeFileSync(path.join(CACHE_DIR, `${key}.meta`), JSON.stringify({ key, file: fileName, contentType, url }));

    const previous = index.get(key);
    if (previous) totalBytes -= previous.size;
    index.set(key, { file: fileName, contentType, size: body.length });
    totalBytes += body.length;
    trim();
  } catch (err) {
    console.error('[AssetCache] Could not store asset:', err);
  }
}

export function cacheStats(): { entries: number; megabytes: number } {
  init();
  return { entries: index.size, megabytes: Math.round(totalBytes / (1024 * 1024)) };
}

export function clearAssetCache(): void {
  init();
  for (const [key, entry] of index) {
    try {
      fs.rmSync(path.join(CACHE_DIR, entry.file), { force: true });
      fs.rmSync(path.join(CACHE_DIR, `${key}.meta`), { force: true });
    } catch {
      /* ignore */
    }
  }
  index.clear();
  totalBytes = 0;
}
