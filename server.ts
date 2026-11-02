import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import { syncGamesLibrary } from './sync-games';
import { CURATED_FLASH_COLLECTIONS } from './src/data/flashArchives';
import { GENIZY_WEBPORT_GAMES } from './src/data/webportGames';
import { QUASAR_GAMES } from './src/data/quasarGames';
import { formatGameInfo } from './src/utils/gameTitles';
import {
  getStoredAccounts,
  saveStoredAccounts,
  toPublicAccount,
  getPublicAccounts,
  getSaves,
  saveSaves,
  getGameSettings,
  saveGameSettings
} from './server/store';
import {
  hashPassword,
  verifyPassword,
  createSession,
  getUserIdFromToken,
  removeSession,
  removeUserSessions
} from './server/auth';
import { guardCredentials, guardKeys, recordFailure, clearFailures, clientIp, checkRateLimit } from './server/rateLimit';
import { runHealthCheck, getHealthReport } from './server/healthCheck';
import { FRAME_STORAGE_SCRIPT, FRAME_STORAGE_MARKER } from './server/frameStorage';
import { getCached, putCached, cacheStats, clearAssetCache } from './server/assetCache';
import {
  isSteamConfigured,
  resolveSteamId,
  getLibrarySummary,
  getProfile,
  getOwnedGames,
  forgetPlayerCache,
  getAchievements,
  getAchievementOverview,
  clearSteamCache,
  redactSteamKey,
  SteamUnavailable
} from './server/steam';
import { UserAccount, StoredUserAccount, GameSave } from './src/types';
import { buildSteamLoginUrl, verifySteamAssertion, OPENID_FAILURE_MESSAGE } from './server/steamOpenId';
import { createUserDataStore } from './server/userData';
import { createSteamStore } from './server/steamStore';
import { checkAchievements, ACHIEVEMENTS } from './server/achievements';
import { isFlashGame } from './src/lib/games';

dotenv.config();

const ALLOWED_GAME_EXTENSIONS = ['.swf', '.html', '.htm'];
/*
 * No SVG here on purpose: /custom_games is served off the hub's own origin and is exempt
 * from the security-header middleware, so an uploaded SVG would be a script running with
 * the hub's origin. Every format below is a raster container with a checkable magic number.
 */
const ALLOWED_THUMB_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/** First bytes that identify each accepted image container. */
const THUMB_SIGNATURES: { ext: string[]; test: (head: Buffer) => boolean }[] = [
  { ext: ['.png'], test: h => h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: ['.jpg', '.jpeg'], test: h => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff },
  { ext: ['.gif'], test: h => h.subarray(0, 6).toString('ascii').startsWith('GIF8') },
  { ext: ['.webp'], test: h => h.subarray(0, 4).toString('ascii') === 'RIFF' && h.subarray(8, 12).toString('ascii') === 'WEBP' }
];

const upload = multer({
  dest: path.join(process.cwd(), 'public', 'custom_games'),
  limits: { fileSize: 100 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = file.fieldname === 'thumbnail' ? ALLOWED_THUMB_EXTENSIONS : ALLOWED_GAME_EXTENSIONS;
    if (!allowed.includes(ext)) {
      cb(new Error(`Unsupported ${file.fieldname} file type "${ext || 'unknown'}". Allowed: ${allowed.join(', ')}`));
      return;
    }
    cb(null, true);
  }
});

// Play history, favourites, collections, play counts, dates added and Steam snapshots
const userData = createUserDataStore(path.join(process.cwd(), 'data'));
// Steam store metadata (descriptions, genres, screenshots), cached on disk; see server/steamStore.ts
const steamStore = createSteamStore(path.join(process.cwd(), 'data'));

// Ensure custom_games dir exists
const customGamesDir = path.join(process.cwd(), 'public', 'custom_games');
if (!fs.existsSync(customGamesDir)) {
  fs.mkdirSync(customGamesDir, { recursive: true });
}

/**
 * Forward size/range headers, but only when the bytes on the wire still match them.
 * fetch() transparently decompresses gzip/br responses while leaving the upstream
 * Content-Length describing the *compressed* size; forwarding it truncates the asset.
 */
function copyLengthHeaders(upstream: Response, res: express.Response) {
  if (upstream.headers.get('content-encoding')) return;

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) res.setHeader('Content-Length', contentLength);

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) {
    res.setHeader('Content-Range', contentRange);
    res.setHeader('Accept-Ranges', 'bytes');
    res.status(206);
  }
}

/**
 * Pipe an upstream fetch body straight to the client instead of buffering it.
 * Returns false if the client hung up mid-transfer, which is normal when a player
 * closes a game while its assets are still downloading.
 */
const CLIENT_GONE_CODES = new Set([
  'ERR_STREAM_PREMATURE_CLOSE',
  'ERR_STREAM_UNABLE_TO_PIPE',
  'ERR_STREAM_DESTROYED',
  'ERR_STREAM_WRITE_AFTER_END',
  'EPIPE',
  'ECONNRESET'
]);

async function streamUpstream(upstream: Response, res: express.Response): Promise<boolean> {
  // A player closing a game mid-download, or a health probe reading only the first byte,
  // leaves a destroyed response here. That is routine, not an error worth throwing over.
  if (res.destroyed || res.writableEnded) {
    await upstream.body?.cancel().catch(() => {});
    return false;
  }

  if (!upstream.body) {
    res.end();
    return true;
  }

  try {
    await pipeline(Readable.fromWeb(upstream.body as any), res);
    return true;
  } catch (err: any) {
    if (CLIENT_GONE_CODES.has(err?.code)) return false;
    throw err;
  }
}

/**
 * Put the storage bridge in front of a proxied game's own scripts. Sandboxed frames have no
 * usable localStorage, so without this a game's progress silently evaporates.
 */
function injectFrameStorage(html: string): string {
  const tag = `<script>${FRAME_STORAGE_SCRIPT}</script>`;
  if (html.includes(FRAME_STORAGE_MARKER)) return html;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, match => `${match}${tag}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, match => `${match}${tag}`);
  }
  return tag + html;
}

// Ports that live one level deeper in the repository than their catalogue id suggests
const WEBPORT_SUBPATHS = GENIZY_WEBPORT_GAMES
  .map(g => g.repoKey)
  .filter(key => key.includes('/'));

/**
 * The handful of passwords that turn up first in any credential-stuffing list. A full
 * breach corpus is out of scope here; this just stops the worst of it at the door.
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwertyuiop', 'qwerty123', 'letmein1', 'welcome1', 'iloveyou', 'admin123',
  'football1', 'monkey12', 'trustno1', 'sunshine', 'princess', 'dragon12',
  'baseball', 'superman', 'starwars', 'passw0rd', 'flashhub', 'gamer1234',
  'player1234', 'admin1234', 'changeme', 'secret12'
]);

// Escape untrusted text before interpolating it into HTML/SVG responses
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Custom games that live in the repository.
 *
 * Every uploaded game already writes a `metadata.json` next to its file, so the folder is
 * self-describing: committing `public/custom_games/` is enough to share a game with anyone
 * who clones the repo. `data/game_settings.json` stays out of git — it is runtime state
 * that sits next to password hashes and session tokens — so it cannot be the only record.
 */
function readCustomGamesFromDisk(): any[] {
  const games: any[] = [];
  try {
    if (!fs.existsSync(customGamesDir)) return games;
    for (const dir of fs.readdirSync(customGamesDir)) {
      if (dir.startsWith('.')) continue;
      const metaPath = path.join(customGamesDir, dir, 'metadata.json');
      if (!fs.existsSync(metaPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        // The folder name is the id of record; a metadata.json that disagrees is stale
        if (meta && typeof meta === 'object' && meta.title) {
          games.push({ ...meta, id: dir });
        }
      } catch (err) {
        console.warn(`Skipping unreadable custom game metadata in ${dir}:`, err);
      }
    }
  } catch (err) {
    console.error('Could not scan custom games:', err);
  }
  return games;
}

// Track syncing status
let isSyncing = false;
let syncProgressMessage = 'Idle';

async function runSync() {
  if (isSyncing) return;
  isSyncing = true;
  syncProgressMessage = 'Syncing games repository in background...';
  console.log(syncProgressMessage);

  try {
    await syncGamesLibrary();
    syncProgressMessage = 'Games synchronized successfully!';
    console.log(syncProgressMessage);
  } catch (error: any) {
    syncProgressMessage = `Sync failed: ${error.message || error}`;
    console.error(`Sync error: ${error.message || error}`);
  } finally {
    isSyncing = false;
  }
}

// itemId -> best .swf filename inside that Archive.org item (null = item has no playable SWF)
const archiveSwfCache = new Map<string, string | null>();

async function resolveArchiveSwf(itemId: string): Promise<string | null> {
  if (archiveSwfCache.has(itemId)) return archiveSwfCache.get(itemId)!;

  try {
    const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(itemId)}`, {
      headers: { 'User-Agent': 'FlashHub/2.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data: any = await res.json();
      const swfFiles: string[] = (data?.files || [])
        .map((f: any) => f.name as string)
        .filter((name: string) => name.toLowerCase().endsWith('.swf'));

      // Prefer the plain release over hacked/beta/"made easy" re-uploads
      swfFiles.sort((a, b) => {
        const score = (n: string) =>
          (/hack/i.test(n) ? 4 : 0) + (/beta/i.test(n) ? 2 : 0) + (/easy|cheat/i.test(n) ? 1 : 0);
        return score(a) - score(b) || a.length - b.length;
      });

      const best = swfFiles[0] || null;
      archiveSwfCache.set(itemId, best);
      return best;
    }
  } catch {
    // Metadata API unavailable; fall through without caching so it can be retried later
  }

  return null;
}

// In-memory cache for Archive.org results
let cachedArchiveGames: any[] = [...CURATED_FLASH_COLLECTIONS];
let lastArchiveFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

async function fetchArchiveGames() {
  const now = Date.now();
  if (cachedArchiveGames.length > 0 && now - lastArchiveFetchTime < CACHE_TTL_MS && lastArchiveFetchTime > 0) {
    return cachedArchiveGames;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      'https://archive.org/advancedsearch.php?q=collection:(softwarelibrary_flash)+AND+mediatype:(software)&fl[]=identifier,title,subject,downloads&sort[]=downloads+desc&rows=50&output=json',
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FlashHub/2.0',
          'Accept': 'application/json, text/plain, */*'
        }
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      const docs = data?.response?.docs || [];

      const games = docs.map((doc: any) => {
        let genres = ['Flash'];
        if (doc.subject) {
          if (Array.isArray(doc.subject)) {
            genres = doc.subject.slice(0, 3);
          } else if (typeof doc.subject === 'string') {
            genres = doc.subject.split(',').map((s: string) => s.trim()).slice(0, 3);
          }
        }
        
        // Archive.org subjects are free text: some are useful tags, others are whole
        // sentences. Keep only short, tag-shaped values so the genre rail stays readable.
        genres = genres
          .map(g => g.trim())
          .filter(g => g.length > 1 && g.length <= 18 && !/[?!.]/.test(g) && g.split(/\s+/).length <= 2)
          .map(g => g.charAt(0).toUpperCase() + g.slice(1));

        const title = doc.title || 'Unknown Title';
        // Play the item's own .swf through Ruffle. The Archive embed player is only offered
        // as a secondary mirror because some items are video captures of the game.
        const playUrl = `/play.html?title=${encodeURIComponent(title)}&swf=/api/archive-swf/${encodeURIComponent(doc.identifier)}&autoplay=1`;

        return {
          id: doc.identifier,
          title,
          thumbnail: `/api/archive-img/${doc.identifier}`,
          source: 'archive',
          embedUrl: playUrl,
          genres: genres.length > 0 ? genres : ['Flash'],
          isArchiveIndependent: false,
          mirrors: [
            { id: `${doc.identifier}-ruffle`, name: 'Ruffle', type: 'ruffle', url: playUrl, isArchiveIndependent: true },
            { id: `${doc.identifier}-embed`, name: 'Archive.org', type: 'archive', url: `https://archive.org/embed/${doc.identifier}`, isArchiveIndependent: false }
          ]
        };
      });

      if (games.length > 0) {
        // Merge live results with the curated collection. Curated entries are hand-verified
        // (exact .swf filename, working mirrors), so they take precedence on id collisions.
        const map = new Map<string, any>();
        games.forEach(g => map.set(g.id, g));
        CURATED_FLASH_COLLECTIONS.forEach(g => map.set(g.id, g));
        
        const merged = Array.from(map.values());
        cachedArchiveGames = merged;
        lastArchiveFetchTime = now;
        return merged;
      }
    }
  } catch (_e: any) {
    // When live Archive.org search API is rate-limited, offline or blocked, fallback seamlessly to curated archive
    lastArchiveFetchTime = now; // prevent repeated immediate failures
  }

  // Use full curated library of 40+ iconic games directly playable via Internet Archive & Ruffle
  return CURATED_FLASH_COLLECTIONS;
}

async function fetchLocalWebports() {
  const localGames = [];

  // 1. Scan aukak/gameports
  try {
    const gameportsDir = path.join(process.cwd(), 'public', 'gameports');
    if (fs.existsSync(gameportsDir)) {
      const dirs = fs.readdirSync(gameportsDir);
      for (const dir of dirs) {
        if (dir.startsWith('.')) continue;
        const indexPath = path.join(gameportsDir, dir, 'index.html');
        if (fs.existsSync(indexPath)) {
          // Verify and patch jsdelivr 403 CDN URLs if present
          try {
            let html = fs.readFileSync(indexPath, 'utf8');
            if (html.includes('cdn.jsdelivr.net/gh/genizy/web-port@main/')) {
              html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/genizy\/web-port@main\//g, 'https://raw.githubusercontent.com/genizy/web-port/main/');
              fs.writeFileSync(indexPath, html, 'utf8');
            }
          } catch(err) {}

          const rawTitle = dir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const info = formatGameInfo(`gameports-${dir}`, rawTitle, ['Web Port', 'Gameports']);
          localGames.push({
            id: `gameports-${dir}`,
            title: info.title,
            description: info.description,
            thumbnail: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(info.title)}&backgroundColor=09090b`,
            rating: info.rating,
            source: 'webporting',
            embedUrl: `/gameports/${encodeURIComponent(dir)}/index.html`,
            genres: info.genres,
            isArchiveIndependent: true
          });
        }
      }
    }
  } catch(e) { console.error('Error scanning gameports:', e); }

  // 2. Scan slqntdevss/quasar
  try {
    const quasarDir = path.join(process.cwd(), 'public', 'quasar', 'storage', 'flash');
    if (fs.existsSync(quasarDir)) {
      const dirs = fs.readdirSync(quasarDir);
      for (const dir of dirs) {
        if (dir.startsWith('.')) continue;
        const gameHtml = path.join(quasarDir, dir, 'index.html');
        const gameSwf = path.join(quasarDir, dir, 'game.swf');
        
        let embedUrl = '';
        if (fs.existsSync(gameHtml)) {
          embedUrl = `/quasar/storage/flash/${encodeURIComponent(dir)}/index.html`;
        } else if (fs.existsSync(gameSwf)) {
          embedUrl = `/play.html?swf=/quasar/storage/flash/${encodeURIComponent(dir)}/game.swf`;
        }
        
        if (embedUrl) {
          const rawTitle = dir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const info = formatGameInfo(`quasar-${dir}`, rawTitle, ['Flash', 'Quasar']);
          localGames.push({
            id: `quasar-${dir}`,
            title: info.title,
            description: info.description,
            thumbnail: `/quasar/img/games/${encodeURIComponent(dir)}.png`, // fallback handled by frontend if needed
            rating: info.rating,
            source: 'webporting',
            embedUrl,
            genres: info.genres,
            isArchiveIndependent: true
          });
        }
      }
    }
  } catch(e) { console.error('Error scanning quasar:', e); }

  // 3. Scan custom_games
  try {
    const customDir = path.join(process.cwd(), 'public', 'custom_games');
    if (fs.existsSync(customDir)) {
      const dirs = fs.readdirSync(customDir);
      for (const dir of dirs) {
        if (dir.startsWith('.')) continue;
        const metaPath = path.join(customDir, dir, 'metadata.json');
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          localGames.push(meta);
        }
      }
    }
  } catch(e) { console.error('Error scanning custom games:', e); }

  return localGames;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  /*
   * Trust exactly as many proxy hops as are actually in front of this server. `true` would
   * accept X-Forwarded-For from any caller, letting one client present a fresh IP per request
   * and slip past the per-IP rate limit entirely.
   */
  const trustedProxyHops = Number(process.env.TRUSTED_PROXY_HOPS ?? 0);
  app.set('trust proxy', Number.isFinite(trustedProxyHops) && trustedProxyHops > 0 ? trustedProxyHops : false);

  const isProduction = process.env.NODE_ENV === 'production';

  /**
   * An origin from the environment, as "https://host". Hosts like Render fill in another
   * service's address as a bare hostname, so a value without a scheme is taken as https.
   */
  const originFromEnv = (value: string | undefined): string => {
    const trimmed = (value || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  /*
   * FLASHHUB_ROLE=games runs this server as the game origin only: a second deployment of the
   * same code whose own address isolates games from the hub, for hosts where one service
   * cannot have two hostnames (no custom domain). It serves the game routes and sends
   * everything else to the hub at HUB_ORIGIN, so it never shows a second, separate hub.
   */
  const gamesOnly = process.env.FLASHHUB_ROLE === 'games';

  /*
   * Game isolation is the security model: games are third-party code and must not share an
   * origin with the hub. In development that is free — localhost and 127.0.0.1 are the same
   * server but distinct origins — but a real deployment has only one hostname unless
   * GAME_ORIGIN names a second one. Without it every game runs with the hub's cookies in
   * reach, silently. That is a refusal to start, not a warning to scroll past.
   */
  // The games-only server is itself the second origin, so it needs no GAME_ORIGIN of its own
  if (isProduction && !gamesOnly && !process.env.GAME_ORIGIN) {
    if (process.env.ALLOW_SAME_ORIGIN_GAMES === '1') {
      console.error(
        '\n!!  GAME_ORIGIN is unset and ALLOW_SAME_ORIGIN_GAMES=1.\n' +
        '!!  Games are running on the hub\'s own origin with no isolation.\n'
      );
    } else {
      console.error(
        '\nRefusing to start: GAME_ORIGIN is not set.\n\n' +
        'Games are third-party code and must be framed from a second hostname pointing at\n' +
        'this server, or they can reach the hub\'s session cookie and storage.\n\n' +
        '  GAME_ORIGIN=https://games.example.com\n\n' +
        'To start anyway and accept that risk, set ALLOW_SAME_ORIGIN_GAMES=1.\n'
      );
      process.exit(1);
    }
  }

  /*
   * With `trust proxy` off, req.ip is the peer address. Behind a load balancer that is the
   * balancer for every request, so the per-IP rate limit becomes one shared bucket and the
   * whole internet shares one budget.
   */
  if (isProduction && !(trustedProxyHops > 0)) {
    console.warn(
      'TRUSTED_PROXY_HOPS is 0. If anything proxies this server, set it to the number of\n' +
      'hops in front — otherwise per-IP rate limiting sees only the proxy address.'
    );
  }

  /**
   * Baseline security headers for the hub itself.
   *
   * Game routes are skipped on purpose: they are meant to be embedded, and they run
   * third-party engine code that a strict policy would break. Their isolation comes from
   * being served on a separate origin instead.
   */
  const GAME_ROUTES = /^\/(api\/(quasar|webports|webport-proxy|archive-swf)|custom_games|gameports|quasar|play\.html|frame-storage\.js)/;

  if (gamesOnly) {
    const hub = originFromEnv(process.env.HUB_ORIGIN);
    console.log(`[FlashHub] Running as the game origin only${hub ? `; everything else goes to ${hub}` : ''}.`);
    app.use((req, res, next) => {
      if (GAME_ROUTES.test(req.path)) return next();
      if (hub) return res.redirect(302, hub + req.originalUrl);
      res.status(404).type('text/plain').send('This server only serves games for the Flashhub hub.');
    });
  }

  app.use((req, res, next) => {
    if (GAME_ROUTES.test(req.path)) return next();

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Vite injects inline scripts and styles in development, so the script policy can only
    // be tightened for the built bundle.
    const scriptSrc = isProduction
      ? "'self'"
      : "'self' 'unsafe-inline' 'unsafe-eval'";

    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src ${scriptSrc} https://unpkg.com`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://api.steampowered.com https://steamcommunity.com ws: wss:",
        // Games are framed from the second origin, so frames must be allowed broadly
        "frame-src 'self' http: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    );
    next();
  });

  // Middleware to parse JSON (cloud saves and backup imports can be sizeable)
  app.use(express.json({ limit: '10mb' }));

  // MIME types for webports proxy
  const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.wasm': 'application/wasm',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.pck': 'application/octet-stream',
    '.data': 'application/octet-stream',
    '.unityweb': 'application/octet-stream',
    '.swf': 'application/x-shockwave-flash',
    '.webp': 'image/webp',
    '.txt': 'text/plain; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.br': 'application/octet-stream',
    '.gz': 'application/octet-stream',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
  };

  // API Route: Play any genizy/web-port game with dynamic CDN patching.
  // Catch-all paths are regex routes: Express 5 rejects a bare `*`, and a regex capture
  // still arrives as req.params[0], which is what these handlers read.
  app.get(/^\/api\/webports\/play\/(.+)$/, async (req, res) => {
    const gameId = (req.params as any)[0] as string;

    if (!gameId || gameId.split('/').some(segment => segment === '..')) {
      return res.status(400).type('text/plain').send('Invalid game path');
    }

    try {
      const encodedPath = gameId.split('/').map(encodeURIComponent).join('/');
      const targetUrl = `https://raw.githubusercontent.com/genizy/web-port/main/${encodedPath}/index.html`;
      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      if (!response.ok) {
        return res.status(response.status).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Game Loading Error</title><style>body{background:#111;color:#eee;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head>
            <body>
              <div style="text-align:center;">
                <h2>Game port not found</h2>
                <p>Could not load game "${escapeHtml(gameId)}" from repository (Status ${response.status}).</p>
              </div>
            </body>
          </html>
        `);
      }

      let html = await response.text();

      // Replace jsdelivr base URL with local proxy base
      const baseHref = `/api/webport-proxy/${gameId.split('/').map(encodeURIComponent).join('/')}/`;
      if (html.includes('<base href=')) {
        html = html.replace(/<base href="[^"]*">/i, `<base href="${baseHref}">`);
      } else if (html.includes('<head>')) {
        html = html.replace('<head>', `<head><base href="${baseHref}">`);
      } else {
        html = `<base href="${baseHref}">` + html;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(injectFrameStorage(html));
    } catch (err: any) {
      console.error(`Error loading webport ${gameId}:`, err);
      res.status(500).type('text/plain').send(`Error loading game: ${err.message}`);
    }
  });

  // API Route: Proxy assets for genizy/web-port games on demand (no 10GB download needed, no 403 errors)
  app.get(/^\/api\/webport-proxy\/(.+)$/, async (req, res) => {
    // The game id may itself contain a slash, so split on the first path segment that
    // belongs to the asset: everything before it identifies the port.
    const fullPath = (req.params as any)[0] as string;
    const knownPrefix = WEBPORT_SUBPATHS.find(prefix => fullPath.startsWith(prefix + '/'));
    const splitAt = knownPrefix ? knownPrefix.length : fullPath.indexOf('/');
    if (splitAt < 0) {
      // Nothing after the game id: there is no asset being asked for
      return res.status(400).type('text/plain').send('Invalid asset path');
    }
    const gameId = fullPath.slice(0, splitAt);
    const assetPath = fullPath.slice(splitAt + 1);

    // Never let a crafted asset path climb out of the game's folder upstream
    if (assetPath.split('/').some(segment => segment === '..')) {
      return res.status(400).type('text/plain').send('Invalid asset path');
    }

    try {
      const targetUrl = `https://raw.githubusercontent.com/genizy/web-port/main/${gameId.split('/').map(encodeURIComponent).join('/')}/${encodeURI(assetPath)}`;
      
      const upstreamRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          ...(req.headers.range ? { range: req.headers.range } : {})
        }
      });

      if (!upstreamRes.ok) {
        return res.status(upstreamRes.status).type('text/plain').send(`Asset not found: ${assetPath}`);
      }

      const ext = path.extname(assetPath.split('?')[0]).toLowerCase();
      const contentType = MIME_TYPES[ext] || upstreamRes.headers.get('content-type') || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(upstreamRes.status === 206 ? 206 : upstreamRes.status);
      copyLengthHeaders(upstreamRes, res);

      await streamUpstream(upstreamRes, res);
    } catch (err: any) {
      console.error(`Error proxying webport asset for ${gameId}/${assetPath}:`, err);
      if (!res.headersSent) res.status(500).type('text/plain').send(`Error proxying asset: ${err.message}`);
      else res.end();
    }
  });

  // Storage bridge for sandboxed game frames (see server/frameStorage.ts)
  // The Ruffle player page is static, but it needs the storage bridge inlined before its
  // own scripts run, so it is served through here rather than straight off disk.
  app.get('/play.html', (_req, res) => {
    try {
      const source = fs.readFileSync(path.join(process.cwd(), 'public', 'play.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(injectFrameStorage(source));
    } catch (err: any) {
      console.error('Could not serve play.html:', err);
      res.status(500).type('text/plain').send('Player unavailable');
    }
  });

  // --- ARCHIVE.ORG SWF PROXY ---
  // Streams a single .swf out of an Archive.org item so Ruffle can play the actual game.
  // Embedding archive.org/embed/<id> is deliberately avoided: several items are video
  // captures, and embedding those plays a video instead of the game.
  const streamArchiveSwf = async (req: express.Request, res: express.Response) => {
    const { itemId } = req.params;
    let fileName = req.params.fileName;

    if (!/^[A-Za-z0-9._-]+$/.test(itemId)) {
      return res.status(400).type('text/plain').send('Invalid archive item');
    }

    // Without an explicit filename, look up the item's best .swf from its metadata
    if (!fileName) {
      const resolved = await resolveArchiveSwf(itemId);
      if (!resolved) {
        return res.status(404).type('text/plain').send('This Archive.org item does not contain a playable SWF');
      }
      fileName = resolved;
    }

    if (fileName.includes('/') || !/\.swf$/i.test(fileName)) {
      return res.status(400).type('text/plain').send('Invalid archive file');
    }

    try {
      const upstream = await fetch(
        `https://archive.org/download/${encodeURIComponent(itemId)}/${encodeURIComponent(fileName)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 FlashHub/2.0',
            ...(req.headers.range ? { range: req.headers.range as string } : {})
          }
        }
      );

      if (!upstream.ok) {
        return res.status(upstream.status).type('text/plain').send('SWF not available from the Internet Archive');
      }

      res.setHeader('Content-Type', 'application/x-shockwave-flash');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      copyLengthHeaders(upstream, res);

      await streamUpstream(upstream, res);
    } catch (err: any) {
      console.error(`Error proxying archive SWF ${itemId}/${fileName}:`, err);
      if (!res.headersSent) res.status(502).type('text/plain').send(`Error fetching SWF: ${err.message}`);
      else res.end();
    }
  };

  app.get('/api/archive-swf/:itemId', streamArchiveSwf);
  app.get('/api/archive-swf/:itemId/:fileName', streamArchiveSwf);

  // --- GENERATED COVER ART ---
  // Deterministic poster art for games whose upstream thumbnail is gone, so the grid never
  // shows a broken image. Colours derive from the id, so a game always gets the same cover.
  app.get('/api/cover/:seed', (req, res) => {
    const seed = req.params.seed;
    const rawTitle = typeof req.query.title === 'string' && req.query.title.trim()
      ? req.query.title.trim()
      : seed.replace(/[-_]+/g, ' ');

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    // One flat, low-chroma field per game: enough to tell covers apart in a grid without
    // turning the library into a row of candy. No gradients, no pattern.
    const hue = hash % 360;

    const words = rawTitle.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 16 && current) {
        lines.push(current);
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
      if (lines.length === 2) break;
    }
    if (current && lines.length < 3) lines.push(current);

    // The title sits flush left at the foot of the cover, the way the hub sets type
    const fontSize = lines.length > 2 ? 32 : 38;
    const leading = fontSize * 1.04;
    const firstBaseline = 300 - 28 - (lines.length - 1) * leading;
    const textNodes = lines
      .map((line, i) => `<text x="26" y="${(firstBaseline + i * leading).toFixed(1)}" fill="#f3f2f2" font-family="Archivo, Helvetica Neue, Arial, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-0.8">${escapeHtml(line)}</text>`)
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="hsl(${hue}, 18%, 17%)"/>
      <rect x="26" y="26" width="28" height="6" fill="#ec3013"/>
      ${textNodes}
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(svg);
  });

  // --- QUASAR MIRROR PROXY ---
  // Streams Flash/HTML5 games out of the slqntdevss/quasar repository on demand. jsDelivr is
  // the primary source (fast, CORS-friendly, correct MIME); raw.githubusercontent is the
  // fallback for files jsDelivr will not serve. Nothing here needs Archive.org.
  const QUASAR_REPO_PATH = 'slqntdevss/quasar';
  const QUASAR_REF = 'main';
  const QUASAR_ROOT = 'public/assets';

  const quasarSources = (assetPath: string) => [
    `https://cdn.jsdelivr.net/gh/${QUASAR_REPO_PATH}@${QUASAR_REF}/${QUASAR_ROOT}/${assetPath}`,
    `https://raw.githubusercontent.com/${QUASAR_REPO_PATH}/${QUASAR_REF}/${QUASAR_ROOT}/${assetPath}`
  ];

  app.get(/^\/api\/quasar\/(.+)$/, async (req, res) => {
    const assetPath = (req.params as any)[0] as string;

    if (!assetPath || assetPath.split('/').some(segment => segment === '..')) {
      return res.status(400).type('text/plain').send('Invalid asset path');
    }

    const ext = path.extname(assetPath.split('?')[0]).toLowerCase();
    const isEntryDocument = /(^|\/)index\.html?$/i.test(assetPath);
    const cacheKey = `quasar:${assetPath}`;

    // A replay should not re-pull tens of megabytes through the CDN. Entry documents are
    // rewritten per request, so only the heavy static assets are cached.
    if (!isEntryDocument) {
      const hit = getCached(cacheKey);
      if (hit) {
        res.setHeader('Content-Type', MIME_TYPES[ext] || hit.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-FlashHub-Cache', 'hit');
        return res.sendFile(hit.path);
      }
    }

    try {
      let upstreamRes: Response | null = null;
      for (const candidate of quasarSources(assetPath)) {
        const attempt = await fetch(candidate, {
          // Cap each upstream attempt: a hanging CDN path must not tie up the player's
          // request. On timeout the loop simply moves on to the next source.
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent': 'FlashHub/2.0',
            ...(req.headers.range && !isEntryDocument ? { range: req.headers.range as string } : {})
          }
        }).catch(() => null);
        if (!attempt) continue;
        if (attempt.ok) {
          upstreamRes = attempt;
          break;
        }
      }

      if (!upstreamRes) {
        return res.status(404).type('text/plain').send('Game asset not found in mirror');
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Rewrite the entry document so the game's relative asset URLs resolve back through
      // this proxy instead of hitting the CDN (which serves HTML as text/plain).
      if (isEntryDocument) {
        let html = await upstreamRes.text();
        const existingBase = html.match(/<base\s+href="([^"]*)"/i);

        // Many entries in this mirror are thin launchers whose assets live on another CDN,
        // declared with an absolute <base href>. Rewriting that would break them, so only
        // relative or missing bases get pointed back at this proxy.
        const hasExternalBase = !!existingBase && /^https?:\/\//i.test(existingBase[1]);

        if (!hasExternalBase) {
          const baseHref = `/api/quasar/${assetPath.replace(/index\.html?$/i, '')}`;

          // Several games were authored for a site root and reference their own files with
          // root-absolute paths ("/js/main.js"). Those ignore <base> entirely and would land
          // on the hub's root, so they are re-pointed at the game's own folder.
          html = html.replace(
            /(<(?:script|link|img|source|iframe)\b[^>]*?\s(?:src|href)=")\/(?!\/|api\/)([^"]*)"/gi,
            (_match, prefix, rest) => `${prefix}${baseHref}${rest}"`
          );

          if (existingBase) {
            html = html.replace(/<base\s+href="[^"]*"\s*\/?>/i, `<base href="${baseHref}">`);
          } else if (/<head[^>]*>/i.test(html)) {
            html = html.replace(/<head[^>]*>/i, match => `${match}<base href="${baseHref}">`);
          } else {
            html = `<base href="${baseHref}">` + html;
          }
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(injectFrameStorage(html));
      }

      const contentType = MIME_TYPES[ext] || upstreamRes.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-FlashHub-Cache', 'miss');

      // A whole-file response can be kept for next time; a ranged one cannot, since it is
      // only a slice of the asset.
      const isFullResponse = upstreamRes.status === 200 && !req.headers.range;
      if (isFullResponse) {
        const body = Buffer.from(await upstreamRes.arrayBuffer());
        putCached(cacheKey, body, contentType);
        res.setHeader('Content-Length', String(body.length));
        return res.send(body);
      }

      copyLengthHeaders(upstreamRes, res);
      await streamUpstream(upstreamRes, res);
    } catch (err: any) {
      console.error(`Error proxying quasar asset ${assetPath}:`, err);
      if (!res.headersSent) res.status(502).type('text/plain').send(`Error proxying asset: ${err.message}`);
      else res.end();
    }
  });

  // Assemble the full catalogue: custom uploads, webports, local mirrors, the quasar
  // mirror, Archive.org titles and the handful of curated links.
  const buildCatalog = async () => {
    const archiveGames = await fetchArchiveGames();
    const localGames = await fetchLocalWebports();
    const settings = getGameSettings();
    const hiddenSet = new Set(settings.hiddenGameIds || []);

    // Disk first: a committed metadata.json is the shared record, and the dedupe below
    // keeps the local settings entry from shadowing it.
    let allGames = [
      ...readCustomGamesFromDisk(),
      ...(settings.customGames || []),
      ...GENIZY_WEBPORT_GAMES,
      ...localGames,
      ...QUASAR_GAMES,
      ...archiveGames
    ];

    // Deduplicate games by ID
    const seenIds = new Set<string>();
    allGames = allGames.filter(g => {
      if (seenIds.has(g.id)) return false;
      seenIds.add(g.id);
      return true;
    });

    // Format titles and mark hidden games
    return allGames.map(g => {
      const info = formatGameInfo(g.id, g.title, g.genres);
      return {
        ...g,
        title: info.title,
        genres: (info.genres && info.genres.length > 0) ? info.genres : g.genres,
        description: g.description || info.description,
        rating: g.rating ?? info.rating,
        hidden: hiddenSet.has(g.id)
      };
    });
  };

  /**
   * The catalogue with what the hub has counted about each game: when it first appeared
   * (null for the catalogue the hub started with) and how often it has been played.
   */
  const buildCatalogWithStats = async () => {
    const games = await buildCatalog();
    // Uploads carry their own date in metadata.json; everything else is dated when first seen
    const knownDates: Record<string, string> = {};
    for (const g of games) if (typeof (g as any).addedAt === 'string') knownDates[g.id] = (g as any).addedAt;
    const { baselineAt, addedAt } = userData.noteCatalogue(games.map(g => g.id), knownDates);
    const plays = userData.getPlayCounts(30);
    catalogueIds = new Set(games.map(g => g.id));
    catalogueSteamAppIds = new Set(
      games.map(g => Number(String(g.thumbnail || '').match(/steam\/apps\/(\d+)\//)?.[1])).filter(n => Number.isInteger(n) && n > 0)
    );
    return {
      baselineAt,
      games: games.map(g => ({
        ...g,
        addedAt: addedAt.get(g.id) ?? null,
        plays: plays.get(g.id) || { total: 0, recent: 0 }
      }))
    };
  };
  let catalogueIds = new Set<string>();
  // Steam app ids the catalogue's own games point at (their art comes from Steam)
  let catalogueSteamAppIds = new Set<number>();

  /*
   * Save slots are a Flash-only feature, so a write is checked against the catalogue rather
   * than trusted from the client. Rebuilding the catalogue per request would be wasteful —
   * it scans disk and can hit the network — so the id set is cached briefly.
   */
  let flashIdCache: { ids: Set<string>; at: number } = { ids: new Set(), at: 0 };
  const FLASH_ID_TTL_MS = 5 * 60 * 1000;

  const getFlashGameIds = async (): Promise<Set<string>> => {
    if (flashIdCache.at && Date.now() - flashIdCache.at < FLASH_ID_TTL_MS) {
      return flashIdCache.ids;
    }
    const catalog = await buildCatalog();
    const ids = new Set<string>(catalog.filter(g => isFlashGame(g)).map(g => g.id));
    flashIdCache = { ids, at: Date.now() };
    return ids;
  };

  /**
   * Origin that game frames are loaded from.
   *
   * Games are third-party code, so they must not share an origin with the hub. An opaque
   * sandbox (dropping allow-same-origin) achieves that but also stops the frame's scripts
   * from running at all, so instead the games are served from a *different real* origin:
   * localhost and 127.0.0.1 are the same server but distinct origins, which keeps the hub's
   * cookie and storage out of reach while letting the game behave normally.
   *
   * Deployments behind a real domain should set GAME_ORIGIN to a second hostname.
   */
  const resolveGameOrigin = (req: express.Request): string => {
    if (process.env.GAME_ORIGIN) return originFromEnv(process.env.GAME_ORIGIN);

    const host = (req.headers.host || '').split(':')[0];
    const port = (req.headers.host || '').split(':')[1];
    const suffix = port ? `:${port}` : '';
    const protocol = req.protocol === 'https' ? 'https' : 'http';

    if (host === 'localhost') return `${protocol}://127.0.0.1${suffix}`;
    if (host === '127.0.0.1') return `${protocol}://localhost${suffix}`;

    // No second origin available; frames fall back to same-origin (see the README).
    return '';
  };

  app.get('/api/config', (req, res) => {
    // isolationRequired: a game origin was configured, so a game must never quietly fall back
    // to running on the hub's own origin (that rescue is for local development only)
    res.json({ status: 'ok', gameOrigin: resolveGameOrigin(req), isolationRequired: !!process.env.GAME_ORIGIN });
  });

  // API Route to fetch games
  app.get('/api/games', async (req, res) => {
    try {
      const { games, baselineAt } = await buildCatalogWithStats();
      res.json({ status: 'ok', data: games, catalogueSince: baselineAt, isSyncing, syncProgressMessage });
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  });

  // --- AUTHENTICATION & REAL USER ACCOUNT ENDPOINTS ---
  
  const SESSION_COOKIE = 'fh_session';
  const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

  // Read one cookie without pulling in a parser dependency
  const readCookie = (req: express.Request, name: string): string => {
    const header = req.headers.cookie;
    if (!header) return '';
    for (const part of header.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (key === name) return decodeURIComponent(rest.join('='));
    }
    return '';
  };

  /**
   * The cookie is the real session carrier: httpOnly keeps it out of reach of any script,
   * so a hostile game frame cannot lift it. The header forms remain for API clients.
   */
  const setSessionCookie = (res: express.Response, token: string) => {
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/'
    });
  };

  const clearSessionCookie = (res: express.Response) => {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  };

  // Helper to read the session token off a request
  const getAuthToken = (req: express.Request): string => {
    const authHeader = (req.headers['authorization'] as string) || '';
    if (authHeader.startsWith('Bearer ')) return authHeader.substring(7).trim();
    return (
      (req.headers['x-auth-token'] as string) ||
      readCookie(req, SESSION_COOKIE) ||
      (req.query.token as string) ||
      ''
    );
  };

  // Helper to extract session user from request header
  const getAuthUser = (req: express.Request): StoredUserAccount | null => {
    const userId = getUserIdFromToken(getAuthToken(req));
    if (!userId) return null;

    const stored = getStoredAccounts();
    return stored.find(u => u.id === userId) || null;
  };

  // Guard: any signed-in player
  const requireUser = (req: express.Request, res: express.Response): StoredUserAccount | null => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }
    return user;
  };

  // Guard: signed-in player holding the admin role
  const requireAdmin = (req: express.Request, res: express.Response): StoredUserAccount | null => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Admin privileges required' });
      return null;
    }
    return user;
  };

  // Register a new real account
  app.post('/api/auth/register', (req, res) => {
    try {
      const { username, email, password, displayName, avatarUrl, bio } = req.body;

      const limitKeys = guardCredentials(req, res, 'register');
      if (!limitKeys) return;

      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      if (username.trim().length > 24) {
        return res.status(400).json({ error: 'Username cannot exceed 24 characters' });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' });
      }

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }

      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        return res.status(400).json({ error: 'That password is too common; pick something less guessable' });
      }

      const storedAccounts = getStoredAccounts();
      const lowerUser = username.trim().toLowerCase();
      const lowerEmail = email.trim().toLowerCase();

      if (storedAccounts.some(a => a.username.toLowerCase() === lowerUser)) {
        recordFailure(limitKeys);
        return res.status(400).json({ error: 'An account with this username already exists' });
      }
      if (storedAccounts.some(a => a.email.toLowerCase() === lowerEmail)) {
        recordFailure(limitKeys);
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      // Hash password securely with unique cryptographic salt
      const { hash, salt } = hashPassword(password);

      const isFirstAccount = storedAccounts.length === 0;
      const newAccount: StoredUserAccount = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: username.trim(),
        email: lowerEmail,
        displayName: displayName?.trim() || username.trim(),
        bio: bio?.trim() || 'FlashHub retro player.',
        passwordHash: hash,
        passwordSalt: salt,
        role: isFirstAccount ? 'admin' : 'user',
        avatarUrl: avatarUrl?.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username.trim())}`,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      storedAccounts.push(newAccount);
      saveStoredAccounts(storedAccounts);

      // Create persistent session token
      const token = createSession(newAccount.id);

      // An admin provisioning an account from the console must keep their own session,
      // so the cookie is only issued when the caller was not already signed in.
      if (!getAuthUser(req)) {
        setSessionCookie(res, token);
      }

      res.status(201).json({
        status: 'ok',
        token,
        user: toPublicAccount(newAccount, 0),
        message: 'Account created successfully!'
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  // Login with credentials (Username or Email + Password)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { identifier, username, email, password } = req.body;
      const loginId = (identifier || username || email || '').trim();

      if (!loginId) {
        return res.status(400).json({ error: 'Username or email is required' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Resolve the account first, then rate-limit on WHO it is, not on the string typed.
      // Keying on the raw identifier let one account be attacked through both its username
      // and its email as two separate budgets, doubling the allowed guesses.
      const storedAccounts = getStoredAccounts();
      const lowerId = loginId.toLowerCase();
      const user = storedAccounts.find(
        a => a.username.toLowerCase() === lowerId || a.email.toLowerCase() === lowerId
      );

      // Looking up the account is cheap; the expensive pbkdf2 below is still gated behind
      // this check, so the limiter also caps CPU spent on guesses.
      const limitKeys = guardKeys(res, [
        `login:ip:${clientIp(req)}`,
        user ? `login:acct:${user.id}` : `login:id:${lowerId}`
      ]);
      if (!limitKeys) return;

      if (!user) {
        // Count misses on unknown accounts too, so the endpoint cannot be used to
        // enumerate which usernames exist by watching who gets throttled.
        recordFailure(limitKeys);
        return res.status(401).json({ error: 'Invalid username/email or password' });
      }

      // Verify password hash
      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        recordFailure(limitKeys);
        return res.status(401).json({ error: 'Invalid username/email or password' });
      }

      clearFailures(limitKeys);

      // Update last login
      user.lastLogin = new Date().toISOString();
      saveStoredAccounts(storedAccounts);

      // Issue session token
      const token = createSession(user.id);
      setSessionCookie(res, token);

      const saves = getSaves().filter(s => s.userId === user.id);

      res.json({
        status: 'ok',
        token,
        user: toPublicAccount(user, saves.length),
        message: `Welcome back, ${user.displayName || user.username}!`
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Get current authenticated user details (/api/auth/me)
  app.get('/api/auth/me', (req, res) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ status: 'unauthorized', error: 'No active session' });
      }

      const saves = getSaves().filter(s => s.userId === user.id);

      res.json({
        status: 'ok',
        user: toPublicAccount(user, saves.length)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Logout session
  app.post('/api/auth/logout', (req, res) => {
    try {
      removeSession(getAuthToken(req));
      clearSessionCookie(res);
      res.json({ status: 'ok', message: 'Logged out successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update profile (Display name, Bio, Avatar)
  app.put('/api/auth/profile', (req, res) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { displayName, bio, avatarUrl } = req.body;
      const storedAccounts = getStoredAccounts();
      const index = storedAccounts.findIndex(a => a.id === user.id);

      if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (displayName !== undefined) storedAccounts[index].displayName = displayName.trim() || storedAccounts[index].username;
      if (bio !== undefined) storedAccounts[index].bio = bio.trim();
      if (avatarUrl !== undefined && avatarUrl.trim()) storedAccounts[index].avatarUrl = avatarUrl.trim();

      saveStoredAccounts(storedAccounts);

      const saves = getSaves().filter(s => s.userId === user.id);

      res.json({
        status: 'ok',
        user: toPublicAccount(storedAccounts[index], saves.length),
        message: 'Profile updated!'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Change password securely
  app.put('/api/auth/change-password', (req, res) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      const limitKeys = guardCredentials(req, res, 'change-password', user.id);
      if (!limitKeys) return;
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }
      if (COMMON_PASSWORDS.has(newPassword.toLowerCase())) {
        return res.status(400).json({ error: 'That password is too common; pick something less guessable' });
      }

      const storedAccounts = getStoredAccounts();
      const index = storedAccounts.findIndex(a => a.id === user.id);
      if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = verifyPassword(currentPassword, storedAccounts[index].passwordHash, storedAccounts[index].passwordSalt);
      if (!isValid) {
        recordFailure(limitKeys);
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      clearFailures(limitKeys);

      const { hash, salt } = hashPassword(newPassword);
      storedAccounts[index].passwordHash = hash;
      storedAccounts[index].passwordSalt = salt;
      saveStoredAccounts(storedAccounts);

      // Every other session for this account is now suspect — a password change is how a
      // player evicts someone who already has one. Drop them all, then re-issue this device's
      // session so the change does not sign the player out of the tab they are looking at.
      removeUserSessions(user.id);
      setSessionCookie(res, createSession(user.id));

      res.json({ status: 'ok', message: 'Password updated successfully!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Bank a finished session against the player's account.
   *
   * Playtime used to be inferred from save slots, which only Flash titles have and which
   * are overwritten rather than accumulated. The player modal reports each session as it
   * closes instead, so the figure covers every game and only ever goes up.
   */
  app.post('/api/auth/playtime', (req, res) => {
    try {
      const user = requireUser(req, res);
      if (!user) return;

      const minutes = Number(req.body?.minutes);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        return res.status(400).json({ error: 'A positive number of minutes is required' });
      }

      // One sitting cannot plausibly exceed a day; anything larger is a bad clock or a
      // client bug, and banking it would poison the counter permanently.
      const capped = Math.min(Math.round(minutes), 60 * 24);

      const storedAccounts = getStoredAccounts();
      const index = storedAccounts.findIndex(a => a.id === user.id);
      if (index === -1) return res.status(404).json({ error: 'User not found' });

      storedAccounts[index].totalPlaytimeMinutes = (storedAccounts[index].totalPlaytimeMinutes || 0) + capped;
      saveStoredAccounts(storedAccounts);

      const newlyEarned = checkAchievements(user.id);
      const saves = getSaves().filter(s => s.userId === user.id);

      res.json({
        status: 'ok',
        user: toPublicAccount(storedAccounts[index], saves.length),
        newlyEarned
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- STEAM: SIGN IN THROUGH STEAM ------------------------------------------------------
  //
  // Linking used to accept any Steam id posted from the browser, so an account could claim
  // someone else's profile. It now goes through Steam's own OpenID sign-in, and only an id
  // Steam confirms is stored. Links made the old way stay in place, marked unverified, until
  // their owner confirms them; nothing is disconnected without the owner doing it.

  const STEAM_STATE_COOKIE = 'fh_steam_state';
  const STEAM_STATE_TTL_MS = 10 * 60 * 1000;
  const steamStates = new Map<string, { userId: string; createdAt: number }>();

  /**
   * The public origin of this hub: APP_URL when set, then the address the host reports
   * (Render sets RENDER_EXTERNAL_URL on every web service), otherwise the request's own host.
   */
  const publicOrigin = (req: express.Request): string => {
    const configured = (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
    if (/^https?:\/\/[^/]+$/.test(configured)) return configured;
    return `${req.protocol}://${req.get('host')}`;
  };

  /** Where the player lands afterwards, with the outcome for the library to show. */
  const steamOutcome = (res: express.Response, outcome: 'verified' | 'error', reason?: string) => {
    const query = outcome === 'verified' ? 'steam=verified' : `steam=error&reason=${encodeURIComponent(reason || 'rejected')}`;
    res.redirect(302, `/?${query}#/library/steam`);
  };

  /** Refresh the profile fields Steam owns, from Steam. Only what Steam returns is stored. */
  const steamProfileFields = async (steamId: string): Promise<Partial<StoredUserAccount>> => {
    try {
      if (isSteamConfigured()) {
        const summary = await getLibrarySummary(steamId);
        if (!summary.profile) return {};
        return {
          steamPersonaName: summary.profile.personaName,
          steamAvatar: summary.profile.avatar || undefined,
          steamProfileUrl: summary.profile.profileUrl,
          ...(summary.level !== null ? { steamLevel: summary.level } : {}),
          steamGamesCount: summary.gameCount,
          steamStatsAt: new Date().toISOString()
        };
      }
      const xml = await fetch(`https://steamcommunity.com/profiles/${encodeURIComponent(steamId)}/?xml=1`, {
        headers: { 'User-Agent': 'FlashHub/2.0' },
        signal: AbortSignal.timeout(6000)
      }).then(r => (r.ok ? r.text() : ''));
      const pick = (tag: string) => xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`))?.[1];
      const persona = pick('steamID');
      const avatar = pick('avatarFull');
      return {
        ...(persona ? { steamPersonaName: persona } : {}),
        ...(avatar ? { steamAvatar: avatar } : {}),
        steamProfileUrl: `https://steamcommunity.com/profiles/${steamId}`
      };
    } catch {
      return {};
    }
  };

  // Step 1: send the signed-in player to Steam
  app.get('/api/auth/steam/start', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return steamOutcome(res, 'error', 'signed-out');

    // Expired states go first so the map cannot grow without bound
    const now = Date.now();
    for (const [token, record] of steamStates) if (now - record.createdAt > STEAM_STATE_TTL_MS) steamStates.delete(token);

    const state = crypto.randomBytes(24).toString('hex');
    steamStates.set(state, { userId: user.id, createdAt: now });

    // The session cookie is SameSite=Strict, so it does not come back on Steam's redirect.
    // This cookie is Lax, which does, and proves the browser returning is the one that left.
    res.cookie(STEAM_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: STEAM_STATE_TTL_MS,
      path: '/api/auth/steam'
    });

    const origin = publicOrigin(req);
    res.redirect(302, buildSteamLoginUrl(`${origin}/api/auth/steam/return?state=${state}`, origin));
  });

  // Step 2: Steam sends the player back; trust nothing until Steam confirms it
  app.get('/api/auth/steam/return', async (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const record = steamStates.get(state);
    const cookieState = readCookie(req, STEAM_STATE_COOKIE);
    res.clearCookie(STEAM_STATE_COOKIE, { path: '/api/auth/steam' });

    // One use per state, and only from the browser that started it
    steamStates.delete(state);
    if (!record || Date.now() - record.createdAt > STEAM_STATE_TTL_MS || cookieState !== state) {
      return steamOutcome(res, 'error', 'expired');
    }

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) if (typeof value === 'string') params[key] = value;

    const expectedReturn = `${publicOrigin(req)}/api/auth/steam/return?state=${state}`;
    const result = await verifySteamAssertion(params, expectedReturn);
    if ('reason' in result) return steamOutcome(res, 'error', result.reason);

    const accounts = getStoredAccounts();
    const index = accounts.findIndex(a => a.id === record.userId);
    if (index === -1) return steamOutcome(res, 'error', 'signed-out');

    // A Steam account confirmed on one Flashhub account cannot be confirmed on another.
    // An unconfirmed claim elsewhere gives way: Steam has just said who really owns it.
    const confirmedElsewhere = accounts.find(a => a.id !== record.userId && a.steamId === result.steamId && a.steamVerifiedAt);
    if (confirmedElsewhere) return steamOutcome(res, 'error', 'taken');
    for (const other of accounts) {
      if (other.id !== record.userId && other.steamId === result.steamId && !other.steamVerifiedAt) {
        console.warn(`[Steam] Unconfirmed link on ${other.username} released: ${accounts[index].username} proved ownership.`);
        for (const field of ['steamId', 'steamPersonaName', 'steamAvatar', 'steamProfileUrl', 'steamLevel', 'steamGamesCount', 'steamLinkedAt', 'steamStatsAt'] as const) {
          delete (other as any)[field];
        }
      }
    }

    const account = accounts[index];
    const switching = account.steamId && account.steamId !== result.steamId;
    if (switching) {
      // A different Steam account than the one linked before: start its data afresh
      userData.dropSteamSnapshot(account.steamId!);
      for (const field of ['steamPersonaName', 'steamAvatar', 'steamProfileUrl', 'steamLevel', 'steamGamesCount', 'steamStatsAt'] as const) {
        delete (account as any)[field];
      }
    }

    Object.assign(account, await steamProfileFields(result.steamId), {
      steamId: result.steamId,
      steamVerifiedAt: new Date().toISOString(),
      steamLinkedAt: switching || !account.steamLinkedAt ? new Date().toISOString() : account.steamLinkedAt
    });
    saveStoredAccounts(accounts);
    steamOutcome(res, 'verified');
  });

  // The words for an outcome, so the client does not have to keep its own copy
  app.get('/api/auth/steam/messages', (_req, res) => {
    res.json({ status: 'ok', data: OPENID_FAILURE_MESSAGE });
  });

  // The old form-posted link. Retired: it could claim any profile.
  app.post('/api/auth/link-steam', (_req, res) => {
    res.status(410).json({
      error: 'Steam accounts are now linked with Sign in through Steam, so Steam can confirm they are yours.',
      signInUrl: '/api/auth/steam/start'
    });
  });

  // Unlink Steam
  app.post('/api/auth/unlink-steam', (req, res) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const storedAccounts = getStoredAccounts();
      const index = storedAccounts.findIndex(a => a.id === user.id);
      if (index === -1) return res.status(404).json({ error: 'User not found' });

      delete storedAccounts[index].steamId;
      delete storedAccounts[index].steamPersonaName;
      delete storedAccounts[index].steamAvatar;
      delete storedAccounts[index].steamProfileUrl;
      delete storedAccounts[index].steamLevel;
      delete storedAccounts[index].steamGamesCount;
      delete storedAccounts[index].steamLinkedAt;
      delete storedAccounts[index].steamVerifiedAt;
      delete storedAccounts[index].steamStatsAt;

      saveStoredAccounts(storedAccounts);
      if (user.steamId) userData.dropSteamSnapshot(user.steamId);

      const saves = getSaves().filter(s => s.userId === user.id);

      res.json({
        status: 'ok',
        user: toPublicAccount(storedAccounts[index], saves.length),
        message: 'Steam account unlinked.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete account
  app.delete('/api/auth/account', (req, res) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Password confirmation required to delete account' });
      }

      const limitKeys = guardCredentials(req, res, 'delete-account', user.id);
      if (!limitKeys) return;

      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        recordFailure(limitKeys);
        return res.status(400).json({ error: 'Incorrect password confirmation' });
      }

      clearFailures(limitKeys);

      let storedAccounts = getStoredAccounts();
      storedAccounts = storedAccounts.filter(a => a.id !== user.id);
      saveStoredAccounts(storedAccounts);

      // Favourites, collections, play history and the cached Steam library go with it
      userData.forgetUser(user.id);
      if (user.steamId) userData.dropSteamSnapshot(user.steamId);

      // Clean up saves
      let saves = getSaves();
      saves = saves.filter(s => s.userId !== user.id);
      saveSaves(saves);

      // Clear session
      removeSession(getAuthToken(req));
      clearSessionCookie(res);

      res.json({ status: 'ok', message: 'Account and associated data deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Favicon handler
  app.get('/favicon.ico', (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
  });

  // Archive.org thumbnail proxy with resilient fallback
  const imgCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
  const IMG_CACHE_MAX_ENTRIES = 500;
  const cacheImage = (id: string, buffer: Buffer, contentType: string) => {
    // Simple FIFO eviction so a long-running server cannot grow this map without bound
    if (imgCache.size >= IMG_CACHE_MAX_ENTRIES) {
      const oldestKey = imgCache.keys().next().value;
      if (oldestKey !== undefined) imgCache.delete(oldestKey);
    }
    imgCache.set(id, { buffer, contentType, timestamp: Date.now() });
  };
  app.get('/api/archive-img/:id', async (req, res) => {
    const { id } = req.params;
    const cached = imgCache.get(id);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buffer);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const upstream = await fetch(`https://archive.org/services/img/${encodeURIComponent(id)}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FlashHub/2.0' }
      });
      clearTimeout(timeoutId);

      if (upstream.ok) {
        const cType = upstream.headers.get('content-type') || 'image/jpeg';
        const arrayBuf = await upstream.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        cacheImage(id, buf, cType);
        res.setHeader('Content-Type', cType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buf);
      }
    } catch {
      // Upstream rate limit, timeout or reset
    }

    // No cover from Archive.org: fall back to the same drawn cover every other game uses.
    // Not cached under the item id, so a later request can still pick up the real image.
    const readableTitle = id
      .replace(/_\d{6,}$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    return res.redirect(302, `/api/cover/${encodeURIComponent(id)}?title=${encodeURIComponent(readableTitle)}`);
  });

  // List all accounts (public directory)
  app.get('/api/accounts', (req, res) => {
    try {
      // The directory names every player and marks which of them are admins, so it is for
      // signed-in players only — anonymous callers used to be able to enumerate the lot.
      const viewer = requireUser(req, res);
      if (!viewer) return;

      const publicAccounts = getPublicAccounts();

      // Only admins see e-mail addresses; the directory itself is public so players can
      // pick their account on the sign-in screen.
      const data = viewer?.role === 'admin'
        ? publicAccounts
        : publicAccounts.map(({ email, ...rest }) => rest);

      res.json({ status: 'ok', data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update user role
  app.put('/api/admin/users/:id/role', (req, res) => {
    try {
      const adminUser = requireAdmin(req, res);
      if (!adminUser) return;

      const { id } = req.params;
      if (adminUser.id === id && req.body.role !== 'admin') {
        return res.status(400).json({ error: 'You cannot remove your own admin role' });
      }
      const { role } = req.body;
      if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({ error: 'Invalid role. Must be admin or user' });
      }

      const storedAccounts = getStoredAccounts();
      const index = storedAccounts.findIndex(a => a.id === id);
      if (index === -1) return res.status(404).json({ error: 'User not found' });

      storedAccounts[index].role = role;
      saveStoredAccounts(storedAccounts);

      res.json({ status: 'ok', data: toPublicAccount(storedAccounts[index]) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Delete user
  app.delete('/api/admin/users/:id', (req, res) => {
    try {
      const adminUser = requireAdmin(req, res);
      if (!adminUser) return;

      const { id } = req.params;
      if (adminUser.id === id) {
        return res.status(400).json({ error: 'Use the account settings page to delete your own account' });
      }

      let storedAccounts = getStoredAccounts();
      if (!storedAccounts.some(a => a.id === id)) {
        return res.status(404).json({ error: 'User not found' });
      }
      const removed = storedAccounts.find(a => a.id === id);
      storedAccounts = storedAccounts.filter(a => a.id !== id);
      saveStoredAccounts(storedAccounts);
      userData.forgetUser(id);
      if (removed?.steamId) userData.dropSteamSnapshot(removed.steamId);

      // Clean up saves
      let saves = getSaves();
      saves = saves.filter(s => s.userId !== id);
      saveSaves(saves);

      res.json({ status: 'ok' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resolve Steam Profile info for linking
  app.get('/api/steam/lookup', async (req, res) => {
    const query = (req.query.query as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Steam ID, vanity name or profile URL required' });
    }

    try {
      const steamId = await resolveSteamId(query);
      if (!steamId) {
        return res.status(404).json({ error: 'No Steam account matches that ID or vanity name' });
      }

      // With a key this is the real profile; without one, fall back to the public XML page,
      // which is the only keyless source Steam still serves.
      if (isSteamConfigured()) {
        const summary = await getLibrarySummary(steamId);
        const profile = summary.profile;
        if (!profile) {
          return res.status(404).json({ error: 'Steam returned no profile for that account' });
        }

        return res.json({
          status: 'ok',
          data: {
            steamId: profile.steamId,
            steamPersonaName: profile.personaName,
            steamAvatar: profile.avatar,
            steamProfileUrl: profile.profileUrl,
            steamLevel: summary.level ?? undefined,
            steamGamesCount: summary.gameCount,
            onlineState: profile.state,
            visibility: profile.visibility,
            memberSince: profile.createdAt,
            location: profile.countryCode
          }
        });
      }

      const xmlRes = await fetch(`https://steamcommunity.com/profiles/${encodeURIComponent(steamId)}/?xml=1`, {
        headers: { 'User-Agent': 'Mozilla/5.0 FlashHub/2.0' },
        signal: AbortSignal.timeout(6000)
      });

      if (!xmlRes.ok) {
        return res.status(502).json({ error: 'Steam did not respond; try again shortly' });
      }

      const xmlText = await xmlRes.text();
      const pick = (tag: string) =>
        xmlText.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's'))?.[1] ??
        xmlText.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'))?.[1] ??
        undefined;

      const customUrl = pick('customURL');

      res.json({
        status: 'ok',
        data: {
          steamId,
          steamPersonaName: pick('steamID') || steamId,
          steamAvatar: pick('avatarFull'),
          steamProfileUrl: customUrl
            ? `https://steamcommunity.com/id/${customUrl}/`
            : `https://steamcommunity.com/profiles/${steamId}`,
          onlineState: pick('onlineState') || 'offline',
          memberSince: pick('memberSince'),
          location: pick('location'),
          // Level and library size need the Web API; they are left unset rather than invented
          needsKeyFor: ['steamLevel', 'steamGamesCount', 'achievements']
        }
      });
    } catch (err: any) {
      if (err instanceof SteamUnavailable) {
        return res.status(err.needsKey ? 501 : 502).json({ error: err.message, needsKey: err.needsKey });
      }
      console.warn('Steam lookup failed:', redactSteamKey(err?.message || String(err)));
      res.status(502).json({ error: 'Could not reach Steam; try again shortly' });
    }
  });

  // --- STEAM LIBRARY & ACHIEVEMENTS ---

  /**
   * Resolve which Steam account a request is about: the caller's linked id by default, or
   * an explicit one for admins looking at another player.
   */
  const steamIdForRequest = (req: express.Request, res: express.Response): string | null => {
    const user = requireUser(req, res);
    if (!user) return null;

    const requested = typeof req.query.steamId === 'string' ? req.query.steamId : '';
    if (requested && requested !== user.steamId) {
      if (user.role !== 'admin') {
        res.status(403).json({ error: 'You can only view your own Steam library' });
        return null;
      }
      return requested;
    }

    if (!user.steamId) {
      res.status(400).json({ error: 'Link a Steam account first', needsLink: true });
      return null;
    }
    return user.steamId;
  };

  // Steam replies to failures in a few different ways; present them consistently
  const sendSteamError = (res: express.Response, err: any) => {
    if (err instanceof SteamUnavailable) {
      return res.status(err.needsKey ? 501 : 502).json({
        error: err.message,
        needsKey: err.needsKey,
        configured: isSteamConfigured()
      });
    }
    console.error('Steam request failed:', redactSteamKey(err?.message || String(err)));
    res.status(502).json({ error: 'Could not reach Steam', configured: isSteamConfigured() });
  };

  app.get('/api/steam/status', (req, res) => {
    const user = getAuthUser(req);
    res.json({
      status: 'ok',
      configured: isSteamConfigured(),
      linked: !!user?.steamId,
      steamId: user?.steamId || null
    });
  });

  app.get('/api/steam/library', async (req, res) => {
    const steamId = steamIdForRequest(req, res);
    if (!steamId) return;

    try {
      const summary = await getLibrarySummary(steamId);
      if (summary.profile?.visibility === 'private') {
        return res.json({
          status: 'ok',
          data: summary,
          notice: 'This Steam profile is private, so its library and achievements are hidden.'
        });
      }
      res.json({ status: 'ok', data: summary });
    } catch (err) {
      sendSteamError(res, err);
    }
  });

  /**
   * The player's whole owned-games list, for the unified library. Official Web API only
   * (GetOwnedGames, cached for five minutes in server/steam.ts); store metadata never gates it.
   * A private "Game details" setting makes Steam answer with an empty list, so the profile's
   * visibility travels with the games and the client can say why the list is empty.
   */
  const steamRefreshAt = new Map<string, number>();
  const STEAM_REFRESH_MIN_MS = 60 * 1000;
  const STEAM_SNAPSHOT_MAX_AGE_MS = 5 * 60 * 1000;

  app.get('/api/steam/owned', async (req, res) => {
    const steamId = steamIdForRequest(req, res);
    if (!steamId) return;

    type Owned = { steamId: string; personaName: string | null; visibility: string; games: unknown[] };
    const snapshot = userData.getSteamSnapshot<Owned>(steamId);

    // "Refresh" skips the five-minute cache, at most once a minute per player
    if (req.query.refresh === '1') {
      const last = steamRefreshAt.get(steamId) || 0;
      if (Date.now() - last >= STEAM_REFRESH_MIN_MS) {
        steamRefreshAt.set(steamId, Date.now());
        forgetPlayerCache(steamId);
      }
    }

    try {
      if (!isSteamConfigured()) {
        throw new SteamUnavailable('No Steam Web API key is configured on this server', true);
      }
      const [profile, games] = await Promise.all([
        getProfile(steamId).catch(() => null),
        getOwnedGames(steamId)
      ]);
      const data: Owned = {
        steamId,
        personaName: profile?.personaName ?? null,
        visibility: profile?.visibility ?? 'unknown',
        games
      };

      // Keep the last list Steam gave, so an outage does not empty the library. The memory
      // cache already answers repeats within five minutes, so the file is written at most
      // that often, or when the list changes.
      let fetchedAt = snapshot?.fetchedAt;
      const snapshotAge = snapshot ? Date.now() - Date.parse(snapshot.fetchedAt) : Infinity;
      if (!snapshot || snapshotAge > STEAM_SNAPSHOT_MAX_AGE_MS || snapshot.data.games.length !== games.length) {
        const now = new Date();
        fetchedAt = now.toISOString();
        userData.saveSteamSnapshot(steamId, data, now);
      }
      res.json({ status: 'ok', data: { ...data, fetchedAt } });
    } catch (err) {
      // Steam is down or refused: show the last list it gave, plainly marked as such
      if (snapshot && err instanceof SteamUnavailable && !err.needsKey) {
        return res.json({ status: 'ok', data: { ...snapshot.data, fetchedAt: snapshot.fetchedAt, stale: true } });
      }
      sendSteamError(res, err);
    }
  });

  // --- PLAY HISTORY AND PLAY COUNTS ---------------------------------------------------------

  /** Whether an id is in the catalogue; rebuilds the catalogue once if it has not run yet. */
  const isCatalogueGame = async (id: unknown): Promise<boolean> => {
    if (typeof id !== 'string') return false;
    if (catalogueIds.size === 0) await buildCatalogWithStats();
    return catalogueIds.has(id);
  };

  /**
   * A finished sitting. Signed in, it is added to the player's history and banked as playtime;
   * signed in or not, a sitting of 30 seconds or more counts once toward the game's plays.
   */
  const sessionPosts = new Map<string, number[]>();
  const SESSION_POST_WINDOW_MS = 15 * 60 * 1000;
  const SESSION_POST_LIMIT = 60;

  app.post('/api/play/session', async (req, res) => {
    try {
      const gameId = req.body?.gameId;
      const seconds = Number(req.body?.seconds);
      if (!(await isCatalogueGame(gameId)) || !Number.isFinite(seconds) || seconds < 0) {
        return res.status(400).json({ error: 'A catalogue game id and a number of seconds are required' });
      }

      const user = getAuthUser(req);
      const actor = user ? `user:${user.id}` : `ip:${clientIp(req)}`;

      // A player finishes a handful of sittings an hour; sixty in fifteen minutes is a script.
      // (The credential limiter's thresholds are far too tight for this, so it has its own.)
      const now = Date.now();
      const recent = (sessionPosts.get(actor) || []).filter(t => now - t < SESSION_POST_WINDOW_MS);
      if (recent.length >= SESSION_POST_LIMIT) {
        res.setHeader('Retry-After', String(Math.ceil((SESSION_POST_WINDOW_MS - (now - recent[0])) / 1000)));
        return res.status(429).json({ error: 'Too many sessions reported. Try again shortly.' });
      }
      recent.push(now);
      sessionPosts.set(actor, recent);
      if (sessionPosts.size > 5000) {
        for (const [key, times] of sessionPosts) if (!times.some(t => now - t < SESSION_POST_WINDOW_MS)) sessionPosts.delete(key);
      }

      const counted = userData.recordPlay(gameId, actor, seconds);
      if (!user) return res.json({ status: 'ok', counted });

      const record = userData.recordSession(user.id, gameId, seconds);

      // The account's total playtime, as /api/auth/playtime banked it before
      let publicUser: UserAccount | undefined;
      let newlyEarned: unknown[] = [];
      if (seconds >= 30) {
        const accounts = getStoredAccounts();
        const index = accounts.findIndex(a => a.id === user.id);
        if (index !== -1) {
          accounts[index].totalPlaytimeMinutes = (accounts[index].totalPlaytimeMinutes || 0) + Math.max(1, Math.round(Math.min(seconds, 86400) / 60));
          saveStoredAccounts(accounts);
          newlyEarned = checkAchievements(user.id);
          publicUser = toPublicAccount(getStoredAccounts().find(a => a.id === user.id)!, getSaves().filter(sv => sv.userId === user.id).length);
        }
      }
      res.json({ status: 'ok', counted, record, user: publicUser, newlyEarned });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/play/history', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ status: 'ok', data: userData.getHistory(user.id) });
  });

  /** Take one game out of the player's own history. The hub-wide play count is not changed. */
  app.delete('/api/play/history/:key', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    if (!userData.removeHistoryEntry(user.id, req.params.key)) return res.status(404).json({ error: 'That game is not in your history' });
    res.json({ status: 'ok', data: userData.getHistory(user.id) });
  });

  /** Fold a browser's local history into the account (larger value wins; never a sum). */
  app.post('/api/play/history/import', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const merged = userData.importHistory(user.id, req.body?.history);
    if (!merged) return res.status(400).json({ error: 'A history object is required' });
    res.json({ status: 'ok', data: merged });
  });

  // --- FAVOURITES AND COLLECTIONS -------------------------------------------------------

  app.get('/api/library/me', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ status: 'ok', data: userData.getLibrary(user.id) });
  });

  app.put('/api/library/favourites', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const lib = userData.setFavourites(user.id, req.body?.keys);
    if (!lib) return res.status(400).json({ error: 'Favourites must be a list of game keys' });
    res.json({ status: 'ok', data: lib });
  });

  /** Add a browser's local favourites to the account without removing any. */
  app.post('/api/library/favourites/merge', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const lib = userData.mergeFavourites(user.id, req.body?.keys);
    if (!lib) return res.status(400).json({ error: 'Favourites must be a list of game keys' });
    res.json({ status: 'ok', data: lib });
  });

  app.post('/api/library/collections', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const created = userData.createCollection(user.id, req.body?.name, req.body?.keys ?? []);
    if (created === 'invalid') return res.status(400).json({ error: 'A collection needs a name of 1 to 60 characters' });
    if (created === 'limit') return res.status(400).json({ error: 'You have reached the limit of 100 collections' });
    res.status(201).json({ status: 'ok', data: created });
  });

  app.patch('/api/library/collections/:id', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const updated = userData.updateCollection(user.id, req.params.id, { name: req.body?.name, keys: req.body?.keys });
    if (updated === 'missing') return res.status(404).json({ error: 'Collection not found' });
    if (updated === 'invalid') return res.status(400).json({ error: 'A collection needs a name of 1 to 60 characters and valid game keys' });
    res.json({ status: 'ok', data: updated });
  });

  app.delete('/api/library/collections/:id', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    if (!userData.deleteCollection(user.id, req.params.id)) return res.status(404).json({ error: 'Collection not found' });
    res.json({ status: 'ok' });
  });

  /**
   * Store details for one Steam app: description, genres, developer, release, screenshots.
   * Answered from the disk cache when it can be; asked of Steam (carefully, see
   * server/steamStore.ts) when not. Open to any app the catalogue points at, and to signed-in
   * players for anything else, so the hub is not a free relay for the store.
   */
  app.get('/api/steam/store/:appId', async (req, res) => {
    const appId = Number(req.params.appId);
    if (!Number.isInteger(appId) || appId <= 0) return res.status(400).json({ error: 'Invalid Steam app id' });
    if (catalogueSteamAppIds.size === 0) await buildCatalogWithStats().catch(() => {});
    if (!catalogueSteamAppIds.has(appId) && !getAuthUser(req)) {
      return res.status(401).json({ error: 'Sign in to see store details for this game' });
    }
    const result = await steamStore.getDetails(appId);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.json({ status: 'ok', data: result });
  });

  app.get('/api/steam/achievements', async (req, res) => {
    const steamId = steamIdForRequest(req, res);
    if (!steamId) return;

    try {
      res.json({ status: 'ok', data: await getAchievementOverview(steamId) });
    } catch (err) {
      sendSteamError(res, err);
    }
  });

  app.get('/api/steam/achievements/:appId', async (req, res) => {
    const steamId = steamIdForRequest(req, res);
    if (!steamId) return;

    const appId = Number(req.params.appId);
    if (!Number.isInteger(appId) || appId <= 0) {
      return res.status(400).json({ error: 'Invalid Steam app id' });
    }

    try {
      res.json({ status: 'ok', data: await getAchievements(steamId, appId) });
    } catch (err) {
      sendSteamError(res, err);
    }
  });

  // --- GAME SAVES & PROGRESS TRACKER ENDPOINTS ---

  // Get saves for user and/or game
  app.get('/api/saves', (req, res) => {
    try {
      const { userId, gameId } = req.query;
      const sessionUser = getAuthUser(req);
      const isAdmin = sessionUser?.role === 'admin';
      const ownerId = sessionUser ? sessionUser.id : 'guest';

      // Admins can browse the whole repository; everyone else only sees their own slots
      const scopedUserId = isAdmin ? (userId as string | undefined) : ownerId;
      if (!isAdmin && userId && userId !== ownerId) {
        return res.status(403).json({ error: 'Cannot read saves for another account' });
      }

      let saves = getSaves();

      if (scopedUserId) {
        saves = saves.filter(s => s.userId === scopedUserId);
      }
      if (gameId) {
        saves = saves.filter(s => s.gameId === gameId);
      }

      res.json({ status: 'ok', data: saves });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save game progress / state
  app.post('/api/saves', async (req, res) => {
    try {
      const { id, gameId, gameTitle, userId, slotName, saveData, playtimeMinutes, highScore, notes } = req.body;
      if (!gameId || !userId || !saveData) {
        return res.status(400).json({ error: 'Missing required save fields' });
      }

      const flashIds = await getFlashGameIds();
      if (!flashIds.has(gameId)) {
        return res.status(400).json({ error: 'Save slots are available for Flash titles only' });
      }

      // A signed-in player may only write their own saves; guests stay in the guest bucket
      const sessionUser = getAuthUser(req);
      const ownerId = sessionUser ? sessionUser.id : 'guest';
      if (userId !== ownerId) {
        return res.status(403).json({ error: 'Cannot write saves for another account' });
      }

      const saves = getSaves();
      const existingIndex = id ? saves.findIndex(s => s.id === id) : -1;
      if (existingIndex >= 0 && saves[existingIndex].userId !== ownerId) {
        return res.status(403).json({ error: 'Cannot overwrite another player\'s save' });
      }

      const saveEntry: GameSave = {
        id: id || `save-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        gameId,
        gameTitle: gameTitle || 'Untitled Game',
        userId: ownerId,
        slotName: slotName || 'Quick Save',
        saveData: typeof saveData === 'string' ? saveData : JSON.stringify(saveData),
        timestamp: new Date().toISOString(),
        playtimeMinutes: Number(playtimeMinutes) || 0,
        highScore: highScore !== undefined ? Number(highScore) : undefined,
        notes: notes || ''
      };

      if (existingIndex >= 0) {
        saves[existingIndex] = saveEntry;
      } else {
        saves.unshift(saveEntry);
      }

      saveSaves(saves);

      const newlyEarned = checkAchievements(ownerId);
      
      res.json({ status: 'ok', data: saveEntry, newlyEarned });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Achievements
  app.get('/api/achievements', (req, res) => {
    res.json({ status: 'ok', data: ACHIEVEMENTS });
  });

  app.post('/api/achievements/check', (req, res) => {
    try {
      const userId = getUserIdFromToken(getAuthToken(req));

      if (!userId) {
        return res.status(401).json({ status: 'unauthorized', error: 'No active session' });
      }

      const newlyEarned = checkAchievements(userId);
      res.json({ status: 'ok', data: newlyEarned });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete save slot
  app.delete('/api/saves/:id', (req, res) => {
    try {
      const user = requireUser(req, res);
      if (!user) return;

      const { id } = req.params;
      let saves = getSaves();
      
      const saveToDelete = saves.find(s => s.id === id);
      if (!saveToDelete) {
        return res.status(404).json({ error: 'Save not found' });
      }

      // Check ownership if not admin
      if (user.role !== 'admin' && saveToDelete.userId !== user.id) {
        return res.status(403).json({ error: 'You do not own this save' });
      }

      saves = saves.filter(s => s.id !== id);
      saveSaves(saves);
      res.json({ status: 'ok' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export all saves for backup
  app.get('/api/saves/export-all', (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;

      const saves = getSaves();
      res.setHeader('Content-Disposition', 'attachment; filename="flashhub-cloud-saves-backup.json"');
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(saves, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Import saves backup
  app.post('/api/saves/import-all', (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;

      const imported = req.body;
      if (!Array.isArray(imported)) {
        return res.status(400).json({ error: 'Expected array of saves' });
      }

      const existing = getSaves();
      const map = new Map<string, GameSave>();
      existing.forEach(s => map.set(s.id, s));
      imported.forEach((s: GameSave) => {
        if (s.id && s.gameId && s.saveData) {
          map.set(s.id, s);
        }
      });

      const merged = Array.from(map.values());
      saveSaves(merged);
      res.json({ status: 'ok', count: merged.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADMIN PANEL CONTROL ENDPOINTS ---

  // Admin stats
  app.get('/api/admin/stats', async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;

      const accounts = getStoredAccounts();
      const saves = getSaves();
      const mem = process.memoryUsage();
      const settings = getGameSettings();
      const localGames = await fetchLocalWebports();
      const totalGames =
        GENIZY_WEBPORT_GAMES.length +
        cachedArchiveGames.length +
        localGames.length +
        (settings.customGames || []).length;

      res.json({
        status: 'ok',
        data: {
          totalGames,
          activeAccounts: accounts.length,
          totalSaves: saves.length,
          cachedProxyItems: imgCache.size + cacheStats().entries,
          assetCacheMb: cacheStats().megabytes,
          memoryUsageMb: Math.round(mem.rss / 1024 / 1024),
          uptimeSeconds: Math.round(process.uptime()),
          isSyncing,
          syncProgressMessage
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear cache
  app.post('/api/admin/cache/clear', (req, res) => {
    if (!requireAdmin(req, res)) return;
    cachedArchiveGames = [];
    imgCache.clear();
    clearSteamCache();
    clearAssetCache();
    lastArchiveFetchTime = 0;
    flashIdCache = { ids: new Set(), at: 0 };
    res.json({ status: 'ok', message: 'All in-memory proxy & games cache purged successfully.' });
  });

  // Toggle game hidden status
  app.post('/api/admin/games/toggle', (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;

      const { gameId, hide } = req.body;
      if (!gameId) return res.status(400).json({ error: 'gameId required' });

      const settings = getGameSettings();
      let hiddenSet = new Set(settings.hiddenGameIds || []);

      if (hide) {
        hiddenSet.add(gameId);
      } else {
        hiddenSet.delete(gameId);
      }

      settings.hiddenGameIds = Array.from(hiddenSet);
      saveGameSettings(settings);

      res.json({ status: 'ok', hidden: hide });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Custom add game to catalog
  app.post('/api/admin/games/custom-add', (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;

      const { title, embedUrl, thumbnail, genres, source } = req.body;
      if (!title || !embedUrl) {
        return res.status(400).json({ error: 'Title and embed URL required' });
      }

      const settings = getGameSettings();
      const newGame = {
        id: `custom-admin-${Date.now()}`,
        title,
        embedUrl,
        thumbnail: thumbnail || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}&backgroundColor=09090b`,
        genres: Array.isArray(genres) && genres.length ? genres : ['Custom', 'Web Port'],
        source: source || 'webporting',
        addedAt: new Date().toISOString()
      };

      settings.customGames = settings.customGames || [];
      settings.customGames.unshift(newGame);
      saveGameSettings(settings);

      res.json({ status: 'ok', data: newGame });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CATALOGUE HEALTH CHECK ---
  app.get('/api/admin/health-check', (req, res) => {
    if (!requireAdmin(req, res)) return;
    res.json({ status: 'ok', ...getHealthReport() });
  });

  app.post('/api/admin/health-check', async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { running } = getHealthReport();
    if (running) {
      return res.json({ status: 'in_progress', ...getHealthReport() });
    }

    try {
      const games = await buildCatalog();
      const origin = `http://127.0.0.1:${PORT}`;

      // Runs in the background; the client polls GET for progress
      runHealthCheck(games, origin).catch(err => console.error('Health check failed:', err));

      res.json({ status: 'started', total: games.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route to trigger background games sync
  app.post('/api/sync', (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (isSyncing) {
      return res.json({ status: 'in_progress', message: syncProgressMessage });
    }
    runSync();
    res.json({ status: 'started', message: 'Game synchronization started.' });
  });

  // API Route to check sync status
  app.get('/api/sync-status', (req, res) => {
    res.json({
      isSyncing,
      message: syncProgressMessage,
    });
  });

  // API Route to upload games
  const uploadFields = upload.fields([{ name: 'game', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

  app.post('/api/upload', (req, res) => {
    // Uploaded HTML is served from this origin, so only signed-in players may publish games
    if (!requireUser(req, res)) return;

    uploadFields(req, res, (uploadErr: any) => {
      if (uploadErr) {
        const isTooLarge = uploadErr.code === 'LIMIT_FILE_SIZE';
        return res.status(400).json({
          error: isTooLarge ? 'File is too large (100 MB maximum)' : uploadErr.message || 'Upload failed'
        });
      }
      handleUpload(req, res);
    });
  });

  /** First `length` bytes of a file, or an empty buffer if it cannot be read. */
  const readHead = (filePath: string, length: number): Buffer => {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(length);
      const read = fs.readSync(fd, buf, 0, length, 0);
      fs.closeSync(fd);
      return buf.subarray(0, read);
    } catch {
      return Buffer.alloc(0);
    }
  };

  const handleUpload = (req: express.Request, res: express.Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const gameFile = files?.['game']?.[0];
    const thumbFile = files?.['thumbnail']?.[0];

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!gameFile || !title) {
      // Drop any partial upload that arrived without the rest of the form
      [gameFile, thumbFile].forEach(f => { if (f) fs.rmSync(f.path, { force: true }); });
      return res.status(400).json({ error: 'Missing file or title' });
    }

    const originalName = gameFile.originalname;
    const ext = path.extname(originalName).toLowerCase();

    /*
     * Check what the file actually is, not just what it is called. A renamed binary would
     * otherwise be written into a folder this server hands out over HTTP.
     */
    const head = readHead(gameFile.path, 256);

    const magic = head.subarray(0, 3).toString('ascii');
    const looksLikeSwf = ['FWS', 'CWS', 'ZWS'].includes(magic);
    const looksLikeHtml = /<(!doctype|html|head|body|script|div|meta)\b/i.test(head.toString('utf8'));

    if (ext === '.swf' ? !looksLikeSwf : !looksLikeHtml) {
      [gameFile, thumbFile].forEach(f => { if (f) fs.rmSync(f.path, { force: true }); });
      return res.status(400).json({
        error: ext === '.swf'
          ? 'That file is not a Flash movie (expected an FWS/CWS/ZWS header)'
          : 'That file does not look like an HTML document'
      });
    }
    
    // Create a folder for the new game
    const gameId = `custom-${Date.now()}`;
    const gameDir = path.join(customGamesDir, gameId);
    fs.mkdirSync(gameDir, { recursive: true });

    // Move file
    const targetFile = ext === '.swf' ? 'game.swf' : 'index.html';
    fs.renameSync(gameFile.path, path.join(gameDir, targetFile));

    let thumbnailUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}&backgroundColor=09090b`;
    if (thumbFile) {
      const thumbExt = path.extname(thumbFile.originalname).toLowerCase();

      // The extension decides the Content-Type this server later hands out, so the bytes
      // have to agree with it. A mislabelled file is dropped rather than published.
      const thumbHead = readHead(thumbFile.path, 16);
      const signature = THUMB_SIGNATURES.find(s => s.ext.includes(thumbExt));
      if (!signature || !signature.test(thumbHead)) {
        fs.rmSync(thumbFile.path, { force: true });
        fs.rmSync(gameDir, { recursive: true, force: true });
        return res.status(400).json({
          error: `That thumbnail is not a valid ${thumbExt.replace('.', '').toUpperCase()} image`
        });
      }

      const thumbName = `thumb${thumbExt}`;
      fs.renameSync(thumbFile.path, path.join(gameDir, thumbName));
      thumbnailUrl = `/custom_games/${gameId}/${thumbName}`;
    }

    /*
     * An uploaded .swf plays through Ruffle exactly like every other Flash title, so it is
     * tagged `Flash`. That tag is not cosmetic: it drives the RUFFLE badge and it is the
     * gate for save slots, which are Flash-only — without it an uploaded Flash game would
     * silently be the one Ruffle title on the hub that cannot be saved.
     */
    const isSwf = ext === '.swf';
    const swfPath = `/custom_games/${gameId}/game.swf`;
    const meta: Record<string, unknown> = {
      id: gameId,
      title,
      source: 'custom',
      embedUrl: isSwf
        ? `/play.html?title=${encodeURIComponent(title)}&swf=${swfPath}&autoplay=1`
        : `/custom_games/${gameId}/index.html`,
      genres: isSwf ? ['Custom', 'Uploaded', 'Flash'] : ['Custom', 'Uploaded'],
      thumbnail: thumbnailUrl,
      addedAt: new Date().toISOString(),
      isArchiveIndependent: true
    };

    if (isSwf) {
      // Without explicit mirrors the player falls through to its generic branch and labels
      // a Ruffle upload "HTML5 WebPort".
      meta.swfUrl = swfPath;
      meta.mirrors = [
        {
          id: `${gameId}-ruffle`,
          name: 'Ruffle',
          type: 'ruffle',
          url: meta.embedUrl,
          isArchiveIndependent: true
        },
        { id: `${gameId}-swf`, name: 'Direct file', type: 'mirror', url: swfPath, isArchiveIndependent: true }
      ];
    }

    fs.writeFileSync(path.join(gameDir, 'metadata.json'), JSON.stringify(meta, null, 2));

    const settings = getGameSettings();
    if (!settings.customGames) settings.customGames = [];
    settings.customGames.push(meta);
    saveGameSettings(settings);

    res.json({ status: 'ok', game: meta });
  };

  /*
   * Uploaded HTML is third-party code sitting on this server's own filesystem, and
   * /custom_games is deliberately outside the security-header middleware so games can be
   * embedded. That combination previously meant an uploaded index.html executed as
   * first-party script on the hub's origin — reachable by navigating straight to it.
   *
   * Two things fix it, and both are needed:
   *   - `Content-Security-Policy: sandbox` drops the document into an opaque origin, so it
   *     cannot reach the hub's cookies, storage or DOM even when opened directly. Scripts
   *     still run, so the game still works.
   *   - The storage bridge is injected, because an opaque origin has no usable
   *     localStorage — the same treatment every proxied game document already gets.
   */
  app.get(/^\/custom_games\/.+\.html?$/i, (req, res, next) => {
    const relative = decodeURIComponent(req.path.replace(/^\/custom_games\//, ''));

    // Resolve and confirm the result is still inside the uploads directory
    const target = path.resolve(customGamesDir, relative);
    if (target !== customGamesDir && !target.startsWith(customGamesDir + path.sep)) {
      return res.status(400).type('text/plain').send('Invalid path');
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return next();

    try {
      const html = fs.readFileSync(target, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Content-Security-Policy',
        'sandbox allow-scripts allow-pointer-lock allow-forms allow-modals allow-popups allow-presentation allow-orientation-lock'
      );
      res.send(injectFrameStorage(html));
    } catch (err: any) {
      console.error(`Could not serve uploaded game ${relative}:`, err);
      res.status(500).type('text/plain').send('Could not load this game');
    }
  });

  // Serve custom games directly
  app.use(
    '/custom_games',
    (req, res, next) => {
      // Sandboxed frames are an opaque origin, so their sub-resource fetches are cross-origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Uploaded files live on this origin: never let the browser second-guess their type
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    },
    express.static(customGamesDir)
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/^\/api\//, (_req, res) => {
      res.status(404).json({ error: 'Unknown API endpoint' });
    });
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Background refresh of linked Steam profiles every 15 minutes
  setInterval(async () => {
    const accounts = getStoredAccounts();
    const linked = accounts.filter(a => a.steamId);
    if (linked.length === 0) return;

    console.log(`[Steam Sync] Refreshing ${linked.length} linked profile(s)...`);
    const updates = new Map<string, Partial<StoredUserAccount>>();

    for (const account of linked) {
      try {
        if (isSteamConfigured()) {
          const summary = await getLibrarySummary(account.steamId!);
          if (summary.profile) {
            updates.set(account.id, {
              steamPersonaName: summary.profile.personaName,
              steamAvatar: summary.profile.avatar,
              steamProfileUrl: summary.profile.profileUrl,
              ...(summary.level !== null ? { steamLevel: summary.level } : {}),
              steamGamesCount: summary.gameCount,
              // Marks these figures as Steam's own, so the account shows them
              steamStatsAt: new Date().toISOString()
            });
          }
          continue;
        }

        // Keyless: the public profile XML is all Steam still serves
        const response = await fetch(`https://steamcommunity.com/profiles/${encodeURIComponent(account.steamId!)}/?xml=1`, {
          headers: { 'User-Agent': 'Mozilla/5.0 FlashHub/2.0' },
          signal: AbortSignal.timeout(6000)
        });
        if (!response.ok) continue;

        const xmlText = await response.text();
        const persona = xmlText.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/)?.[1];
        const avatar = xmlText.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/)?.[1];

        const update: Partial<StoredUserAccount> = {};
        if (persona) update.steamPersonaName = persona;
        if (avatar) update.steamAvatar = avatar;
        if (Object.keys(update).length > 0) updates.set(account.id, update);
      } catch (err: any) {
        console.warn(`[Steam Sync] Could not refresh ${account.username}: ${err?.message || err}`);
      }
    }

    if (updates.size > 0) {
      // Re-read before writing so a registration or profile edit during the loop survives
      const current = getStoredAccounts();
      saveStoredAccounts(current.map(acc => {
        const update = updates.get(acc.id);
        return update ? { ...acc, ...update } : acc;
      }));
      console.log(`[Steam Sync] Updated ${updates.size} profile(s).`);
    }
  }, 15 * 60 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    if (!process.env.GAME_ORIGIN) {
      console.log(
        '[FlashHub] GAME_ORIGIN is not set. On localhost the hub falls back to 127.0.0.1 for ' +
        'game frames, but a public deployment should set GAME_ORIGIN to a second hostname so ' +
        'game code cannot share an origin with the hub.'
      );
    }
  });
}

startServer();
