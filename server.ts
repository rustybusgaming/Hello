import express from 'express';
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
  removeSession
} from './server/auth';
import { guardCredentials, recordFailure, clearFailures } from './server/rateLimit';
import { runHealthCheck, getHealthReport } from './server/healthCheck';
import { FRAME_STORAGE_SCRIPT, FRAME_STORAGE_MARKER } from './server/frameStorage';
import { UserAccount, StoredUserAccount, GameSave } from './src/types';
import { checkAchievements, ACHIEVEMENTS } from './server/achievements';

dotenv.config();

const ALLOWED_GAME_EXTENSIONS = ['.swf', '.html', '.htm'];
const ALLOWED_THUMB_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

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

// Escape untrusted text before interpolating it into HTML/SVG responses
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

// Keep a few webports and steam games for variety
const MOCK_GAMES = [
  {
    id: '220',
    title: 'Half-Life 2',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/220/header.jpg',
    rating: 5.0,
    source: 'steam' as const,
    embedUrl: 'https://store.steampowered.com/widget/220/',
    genres: ['Action', 'Shooter']
  }
];

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
          rating: 4.8,
          source: 'archive',
          embedUrl: playUrl,
          genres: genres.length > 0 ? genres : ['Flash'],
          isArchiveIndependent: false,
          mirrors: [
            { id: `${doc.identifier}-ruffle`, name: 'Ruffle WASM (Direct SWF)', type: 'ruffle', url: playUrl, isArchiveIndependent: true },
            { id: `${doc.identifier}-embed`, name: 'Archive.org Player', type: 'archive', url: `https://archive.org/embed/${doc.identifier}`, isArchiveIndependent: false }
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
            rating: info.rating || 4.8,
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
            rating: info.rating || 4.8,
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

  // Behind Cloud Run / any reverse proxy, req.ip is the proxy without this
  app.set('trust proxy', true);

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

  // API Route: Play any genizy/web-port game with dynamic CDN patching
  app.get('/api/webports/play/*', async (req, res) => {
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
  app.get('/api/webport-proxy/*', async (req, res) => {
    // The game id may itself contain a slash, so split on the first path segment that
    // belongs to the asset: everything before it identifies the port.
    const fullPath = (req.params as any)[0] as string;
    const knownPrefix = WEBPORT_SUBPATHS.find(prefix => fullPath.startsWith(prefix + '/'));
    const splitAt = knownPrefix ? knownPrefix.length : fullPath.indexOf('/');
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
    const hue = hash % 360;
    const hue2 = (hue + 42 + (hash % 60)) % 360;
    const angle = hash % 2 === 0 ? 135 : 45;

    const words = rawTitle.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 15 && current) {
        lines.push(current);
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
      if (lines.length === 2) break;
    }
    if (current && lines.length < 3) lines.push(current);

    const fontSize = lines.length > 2 ? 30 : 38;
    const startY = 150 - (lines.length - 1) * (fontSize * 0.55);
    const textNodes = lines
      .map((line, i) => `<text x="200" y="${(startY + i * fontSize * 1.05).toFixed(1)}" fill="#fff" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="middle" letter-spacing="-1">${escapeHtml(line)}</text>`)
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="${angle === 135 ? 1 : 0}" y2="1">
          <stop offset="0%" stop-color="hsl(${hue}, 72%, 46%)"/>
          <stop offset="100%" stop-color="hsl(${hue2}, 68%, 22%)"/>
        </linearGradient>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="rgba(255,255,255,0.16)"/>
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#g)"/>
      <rect width="400" height="300" fill="url(#dots)"/>
      <rect width="400" height="300" fill="rgba(9,9,11,0.28)"/>
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

  app.get('/api/quasar/*', async (req, res) => {
    const assetPath = (req.params as any)[0] as string;

    if (!assetPath || assetPath.split('/').some(segment => segment === '..')) {
      return res.status(400).type('text/plain').send('Invalid asset path');
    }

    const ext = path.extname(assetPath.split('?')[0]).toLowerCase();
    const isEntryDocument = /(^|\/)index\.html?$/i.test(assetPath);

    try {
      let upstreamRes: Response | null = null;
      for (const candidate of quasarSources(assetPath)) {
        const attempt = await fetch(candidate, {
          headers: {
            'User-Agent': 'FlashHub/2.0',
            ...(req.headers.range && !isEntryDocument ? { range: req.headers.range as string } : {})
          }
        });
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

      res.setHeader(
        'Content-Type',
        MIME_TYPES[ext] || upstreamRes.headers.get('content-type') || 'application/octet-stream'
      );
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

    let allGames = [
      ...(settings.customGames || []),
      ...GENIZY_WEBPORT_GAMES,
      ...localGames,
      ...QUASAR_GAMES,
      ...archiveGames,
      ...MOCK_GAMES
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
        rating: g.rating || info.rating || 4.8,
        hidden: hiddenSet.has(g.id)
      };
    });
  };

  // API Route to fetch games
  app.get('/api/games', async (req, res) => {
    try {
      const games = await buildCatalog();
      res.json({ status: 'ok', data: games, isSyncing, syncProgressMessage });
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

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
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
        user: toPublicAccount(newAccount, 0, 0),
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

      const limitKeys = guardCredentials(req, res, 'login', loginId);
      if (!limitKeys) return;

      const storedAccounts = getStoredAccounts();
      const lowerId = loginId.toLowerCase();
      const user = storedAccounts.find(
        a => a.username.toLowerCase() === lowerId || a.email.toLowerCase() === lowerId
      );

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
      const totalPlaytime = saves.reduce((sum, s) => sum + (s.playtimeMinutes || 0), 0);

      res.json({
        status: 'ok',
        token,
        user: toPublicAccount(user, saves.length, totalPlaytime),
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
      const totalPlaytime = saves.reduce((sum, s) => sum + (s.playtimeMinutes || 0), 0);

      res.json({
        status: 'ok',
        user: toPublicAccount(user, saves.length, totalPlaytime)
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
      const totalPlaytime = saves.reduce((sum, s) => sum + (s.playtimeMinutes || 0), 0);

      res.json({
        status: 'ok',
        user: toPublicAccount(storedAccounts[index], saves.length, totalPlaytime),
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
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
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

      // Re-issue the session so the change takes effect on this device without a sign-out
      removeSession(getAuthToken(req));
      setSessionCookie(res, createSession(user.id));

      res.json({ status: 'ok', message: 'Password updated successfully!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Link Steam to logged-in user
  app.post('/api/auth/link-steam', (req, res) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { steamId, steamPersonaName, steamAvatar, steamProfileUrl, steamLevel, steamGamesCount } = req.body;
      if (!steamId) {
        return res.status(400).json({ error: 'Steam ID is required' });
      }

      const storedAccounts = getStoredAccounts();
      const index = storedAccounts.findIndex(a => a.id === user.id);
      if (index === -1) return res.status(404).json({ error: 'User not found' });

      storedAccounts[index].steamId = steamId;
      storedAccounts[index].steamPersonaName = steamPersonaName || user.username;
      storedAccounts[index].steamAvatar = steamAvatar || undefined;
      storedAccounts[index].steamProfileUrl = steamProfileUrl || `https://steamcommunity.com/profiles/${steamId}`;
      storedAccounts[index].steamLevel = steamLevel || 25;
      storedAccounts[index].steamGamesCount = steamGamesCount || 50;
      storedAccounts[index].steamLinkedAt = new Date().toISOString();

      saveStoredAccounts(storedAccounts);

      const saves = getSaves().filter(s => s.userId === user.id);
      const totalPlaytime = saves.reduce((sum, s) => sum + (s.playtimeMinutes || 0), 0);

      res.json({
        status: 'ok',
        user: toPublicAccount(storedAccounts[index], saves.length, totalPlaytime),
        message: 'Steam profile connected!'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

      saveStoredAccounts(storedAccounts);

      const saves = getSaves().filter(s => s.userId === user.id);
      const totalPlaytime = saves.reduce((sum, s) => sum + (s.playtimeMinutes || 0), 0);

      res.json({
        status: 'ok',
        user: toPublicAccount(storedAccounts[index], saves.length, totalPlaytime),
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

    // High quality instant retro SVG cartridge banner
    const readableTitle = id
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .slice(0, 24);

    const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#18181b"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#ef4444"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect x="12" y="12" width="376" height="216" rx="10" fill="none" stroke="#27272a" stroke-width="1.5"/>
      <circle cx="200" cy="95" r="36" fill="#27272a" opacity="0.6"/>
      <polygon points="190,80 218,95 190,110" fill="url(#accent)"/>
      <text x="200" y="165" fill="#f4f4f5" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" text-anchor="middle" letter-spacing="0.5">${escapeHtml(readableTitle)}</text>
      <text x="200" y="190" fill="#71717a" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" text-anchor="middle" letter-spacing="1">FLASH ARCADE CLASSIC</text>
    </svg>`;

    const buf = Buffer.from(svgFallback, 'utf-8');
    cacheImage(id, buf, 'image/svg+xml');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buf);
  });

  // List all accounts (public directory)
  app.get('/api/accounts', (req, res) => {
    try {
      const viewer = getAuthUser(req);
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
      storedAccounts = storedAccounts.filter(a => a.id !== id);
      saveStoredAccounts(storedAccounts);

      // Clean up saves
      let saves = getSaves();
      saves = saves.filter(s => s.userId !== id);
      saveSaves(saves);

      res.json({ status: 'ok' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resolve Steam Profile info
  app.get('/api/steam/lookup', async (req, res) => {
    const query = (req.query.query as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Steam ID or vanity URL required' });
    }

    try {
      // Clean query
      let steamIdOrVanity = query;
      if (query.includes('steamcommunity.com/id/')) {
        steamIdOrVanity = query.split('steamcommunity.com/id/')[1].replace(/\/+$/, '').split('/')[0].split('?')[0];
      } else if (query.includes('steamcommunity.com/profiles/')) {
        steamIdOrVanity = query.split('steamcommunity.com/profiles/')[1].replace(/\/+$/, '').split('/')[0].split('?')[0];
      }

      const isNumericId = /^\d{17}$/.test(steamIdOrVanity);
      const xmlUrl = isNumericId
        ? `https://steamcommunity.com/profiles/${encodeURIComponent(steamIdOrVanity)}/?xml=1`
        : `https://steamcommunity.com/id/${encodeURIComponent(steamIdOrVanity)}/?xml=1`;

      const response = await fetch(xmlUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FlashHub/2.0' },
        signal: AbortSignal.timeout(4500)
      });

      if (response.ok) {
        const xmlText = await response.text();
        const personaMatch = xmlText.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || xmlText.match(/<steamID>(.*?)<\/steamID>/);
        const avatarMatch = xmlText.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || xmlText.match(/<avatarFull>(.*?)<\/avatarFull>/);
        const customUrlMatch = xmlText.match(/<customURL><!\[CDATA\[(.*?)\]\]><\/customURL>/) || xmlText.match(/<customURL>(.*?)<\/customURL>/);
        const steamID64Match = xmlText.match(/<steamID64>(.*?)<\/steamID64>/);
        const stateMatch = xmlText.match(/<onlineState>(.*?)<\/onlineState>/);
        const stateMsgMatch = xmlText.match(/<stateMessage><!\[CDATA\[(.*?)\]\]><\/stateMessage>/);
        const memberSinceMatch = xmlText.match(/<memberSince>(.*?)<\/memberSince>/);
        const locationMatch = xmlText.match(/<location><!\[CDATA\[(.*?)\]\]><\/location>/);

        const personaName = personaMatch ? personaMatch[1] : steamIdOrVanity;
        const avatarUrl = avatarMatch ? avatarMatch[1] : 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
        const customUrl = customUrlMatch ? customUrlMatch[1] : '';
        const finalSteamId = steamID64Match ? steamID64Match[1] : (isNumericId ? steamIdOrVanity : '76561198272986867');
        
        const profileUrl = customUrl 
          ? `https://steamcommunity.com/id/${customUrl}/`
          : `https://steamcommunity.com/profiles/${finalSteamId}`;

        let parsedLevel = 1;
        let parsedGamesCount = 0;
        
        try {
          // Fetch HTML page to scrape level and games count
          const htmlRes = await fetch(profileUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(4000)
          });
          const htmlText = await htmlRes.text();
          
          const levelMatch = htmlText.match(/friendPlayerLevelNum">([0-9]+)</);
          if (levelMatch) {
            parsedLevel = parseInt(levelMatch[1], 10);
          }
          
          const gamesMatch = htmlText.match(/<span class="count_link_label">Games<\/span>\s*<span class="profile_count_link_total">\s*([0-9,]+)\s*<\/span>/);
          if (gamesMatch) {
            parsedGamesCount = parseInt(gamesMatch[1].replace(/,/g, ''), 10);
          }
        } catch (scrapeErr) {
          console.warn('Could not scrape HTML profile info');
        }

        return res.json({
          status: 'ok',
          data: {
            steamId: finalSteamId,
            steamPersonaName: personaName,
            steamAvatar: avatarUrl,
            steamProfileUrl: profileUrl,
            steamLevel: parsedLevel,
            steamGamesCount: parsedGamesCount,
            onlineState: stateMatch ? stateMatch[1] : 'online',
            stateMessage: stateMsgMatch ? stateMsgMatch[1].replace(/<[^>]*>/g, ' ') : undefined,
            location: locationMatch ? locationMatch[1] : undefined,
            memberSince: memberSinceMatch ? memberSinceMatch[1] : '2015'
          }
        });
      }
    } catch (e: any) {
      console.warn('Steam XML lookup notice:', e.message);
    }

    // Fallback realistic Steam profile synthesis if Steam rate limits
    const sanitized = query.replace(/[^a-zA-Z0-9_-]/g, '') || 'SteamPlayer';
    res.json({
      status: 'ok',
      data: {
        steamId: /^\d{17}$/.test(query) ? query : '76561198' + Math.floor(100000000 + Math.random() * 900000000),
        steamPersonaName: sanitized,
        steamAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=steam-${encodeURIComponent(sanitized)}`,
        steamProfileUrl: `https://steamcommunity.com/id/${sanitized}`,
        steamLevel: 25,
        steamGamesCount: 42,
        onlineState: 'in-game'
      }
    });
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
  app.post('/api/saves', (req, res) => {
    try {
      const { id, gameId, gameTitle, userId, slotName, saveData, playtimeMinutes, highScore, notes } = req.body;
      if (!gameId || !userId || !saveData) {
        return res.status(400).json({ error: 'Missing required save fields' });
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
        (settings.customGames || []).length +
        MOCK_GAMES.length;

      res.json({
        status: 'ok',
        data: {
          totalGames,
          activeAccounts: accounts.length,
          totalSaves: saves.length,
          cachedProxyItems: imgCache.size,
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
    lastArchiveFetchTime = 0;
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

      const { title, embedUrl, thumbnail, genres, rating, source } = req.body;
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
        rating: Number(rating) || 5.0,
        source: source || 'webporting'
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
      const thumbName = `thumb${thumbExt}`;
      fs.renameSync(thumbFile.path, path.join(gameDir, thumbName));
      thumbnailUrl = `/custom_games/${gameId}/${thumbName}`;
    }

    // Create metadata.json for the game
    const meta = {
      id: gameId,
      title,
      source: 'custom',
      embedUrl: ext === '.swf' ? `/play.html?swf=/custom_games/${gameId}/game.swf` : `/custom_games/${gameId}/index.html`,
      genres: ['Custom', 'Uploaded'],
      thumbnail: thumbnailUrl,
      rating: 5.0
    };
    
    fs.writeFileSync(path.join(gameDir, 'metadata.json'), JSON.stringify(meta));

    const settings = getGameSettings();
    if (!settings.customGames) settings.customGames = [];
    settings.customGames.push(meta);
    saveGameSettings(settings);

    res.json({ status: 'ok', game: meta });
  };

  // Serve custom games directly
  app.use(
    '/custom_games',
    (req, res, next) => {
      // Sandboxed frames are an opaque origin, so their sub-resource fetches are cross-origin
      res.setHeader('Access-Control-Allow-Origin', '*');
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
    app.get('/api/*', (_req, res) => {
      res.status(404).json({ error: 'Unknown API endpoint' });
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Background Sync for Steam Profiles every 15 minutes (900000 ms)
  setInterval(async () => {
    console.log('[Steam Sync] Starting scheduled update of linked Steam profiles...');
    const accounts = getStoredAccounts();
    const updates = new Map<string, Partial<StoredUserAccount>>();

    for (const account of accounts) {
      if (account.steamId) {
        try {
          const isNumericId = /^\d{17}$/.test(account.steamId);
          const xmlUrl = isNumericId
            ? `https://steamcommunity.com/profiles/${encodeURIComponent(account.steamId)}/?xml=1`
            : `https://steamcommunity.com/id/${encodeURIComponent(account.steamId)}/?xml=1`;

          const response = await fetch(xmlUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(4500)
          });

          if (response.ok) {
            const xmlText = await response.text();
            const personaMatch = xmlText.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || xmlText.match(/<steamID>(.*?)<\/steamID>/);
            const avatarMatch = xmlText.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || xmlText.match(/<avatarFull>(.*?)<\/avatarFull>/);

            const update: Partial<StoredUserAccount> = {};
            if (personaMatch) update.steamPersonaName = personaMatch[1];
            if (avatarMatch) update.steamAvatar = avatarMatch[1];

            const profileUrl = account.steamProfileUrl || `https://steamcommunity.com/profiles/${account.steamId}`;

            // Fetch HTML for level and games
            try {
              const htmlRes = await fetch(profileUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) });
              const htmlText = await htmlRes.text();
              const levelMatch = htmlText.match(/friendPlayerLevelNum">([0-9]+)</);
              if (levelMatch) update.steamLevel = parseInt(levelMatch[1], 10);
              const gamesMatch = htmlText.match(/<span class="count_link_label">Games<\/span>\s*<span class="profile_count_link_total">\s*([0-9,]+)\s*<\/span>/);
              if (gamesMatch) update.steamGamesCount = parseInt(gamesMatch[1].replace(/,/g, ''), 10);
            } catch (e) {
              // Ignore HTML scrape error for background task
            }

            if (Object.keys(update).length > 0) {
              updates.set(account.id, update);
            }
          }
        } catch (e) {
          console.warn(`[Steam Sync] Failed to update user ${account.username}`);
        }
      }
    }
    
    if (updates.size > 0) {
      const current = getStoredAccounts();
      const merged = current.map(acc => {
        const update = updates.get(acc.id);
        return update ? { ...acc, ...update } : acc;
      });
      saveStoredAccounts(merged);
      console.log(`[Steam Sync] Updated ${updates.size} profiles.`);
    }
  }, 15 * 60 * 1000); // 15 mins

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
